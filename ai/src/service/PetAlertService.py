from __future__ import annotations

import asyncio
import datetime
import json
import logging
import os
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass

from fastapi import Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.persistance.db import create_db_session, get_db
from src.persistance.generated_models import PetAlert
from src.persistance.repositories.PetAlertRepository import PetAlertRepository
from src.persistance.repositories.PetMatchRepository import PetMatchRepository
from src.schemas.PetAlertSchemas import (
    AlertType,
    EmbeddingStatus,
    PetAlertCreateRequest,
    PetAlertListFilters,
    PetAlertMatchResponse,
    PetAlertResponse,
    PetAlertUpdateRequest,
    PetAlertUploadSocketData,
    UploadStatus,
)
from src.service.AIService import AIService, PetMatchCandidate, get_ai_service
from src.service.PetAlertSocketManager import (
    PetAlertSocketManager,
    get_pet_alert_socket_manager,
)

logger = logging.getLogger(__name__)


class PetAlertValidationError(Exception):
    pass


class PetAlertNotFoundError(Exception):
    pass


class PetAlertForbiddenError(Exception):
    pass


def serialize_pet_alert(alert: PetAlert) -> PetAlertResponse:
    owner_user_id: str | None = None
    pulse = alert.pulse
    if pulse is not None:
        owner_user_id = pulse.userId

    return PetAlertResponse(
        id=alert.id,
        pulseId=alert.pulseId,
        alertType=AlertType.coerce(alert.alertType),
        petType=alert.petType,
        color=alert.color,
        breed=alert.breed,
        imageUrl=alert.imageUrl,
        aiDescriptor=alert.aiDescriptor,
        embeddingStatus=EmbeddingStatus(alert.embeddingStatus),
        embeddingModel=alert.embeddingModel,
        embeddingUpdatedAt=alert.embeddingUpdatedAt,
        ownerUserId=owner_user_id,
    )


@dataclass(slots=True)
class PetAlertUploadRequestResult:
    request_id: uuid.UUID
    alert: PetAlert
    status: str
    should_enqueue: bool


class PetAlertService:
    def __init__(
        self,
        repository: PetAlertRepository,
        match_repository: PetMatchRepository,
        ai_service: AIService,
        socket_manager: PetAlertSocketManager,
    ):
        self.repository = repository
        self.match_repository = match_repository
        self.ai_service = ai_service
        self.socket_manager = socket_manager
        self.match_threshold = 0.55
        self.max_candidates = 25
        self.max_matches = 5

    def create_pet_alert_record(
        self, payload: PetAlertCreateRequest
    ) -> PetAlertUploadRequestResult:
        self._ensure_owned_pulse(payload.pulseId, payload.userId)
        request_id = payload.requestId
        values = payload.model_dump(exclude={"requestId", "userId"})

        existing = self.repository.get_by_pulse_id(payload.pulseId)
        if existing is None:
            try:
                alert = self.repository.create(
                    {
                        **values,
                        "embeddingStatus": "pending",
                        "embeddingUpdatedAt": self._utcnow(),
                    }
                )
            except IntegrityError as exc:
                raise PetAlertValidationError(
                    "Unable to create pet alert with the provided data."
                ) from exc

            return PetAlertUploadRequestResult(
                request_id=request_id,
                alert=alert,
                status="pending",
                should_enqueue=True,
            )

        if existing.embeddingStatus == "processing":
            return PetAlertUploadRequestResult(
                request_id=request_id,
                alert=existing,
                status="processing",
                should_enqueue=False,
            )

        if not self._should_reprocess(existing, values):
            return PetAlertUploadRequestResult(
                request_id=request_id,
                alert=existing,
                status="success",
                should_enqueue=False,
            )

        try:
            alert = self.repository.update(
                existing.id,
                {
                    **values,
                    "aiDescriptor": None,
                    "imageEmbedding": None,
                    "embeddingModel": None,
                    "embeddingStatus": "pending",
                    "embeddingUpdatedAt": self._utcnow(),
                },
                commit=False,
            )
            if alert is None:
                raise PetAlertNotFoundError(
                    f"Pet alert '{existing.id}' was not found during retry."
                )
            self.repository.commit()
            self.repository.refresh(alert)
        except IntegrityError as exc:
            self.repository.rollback()
            raise PetAlertValidationError(
                "Unable to update pet alert with the provided data."
            ) from exc

        return PetAlertUploadRequestResult(
            request_id=request_id,
            alert=alert,
            status="pending",
            should_enqueue=True,
        )

    def enqueue_pet_alert_processing(
        self,
        *,
        pet_alert_id: uuid.UUID,
        request_id: uuid.UUID,
        user_id: str,
    ) -> None:
        asyncio.create_task(
            run_pet_alert_processing_job(
                pet_alert_id=pet_alert_id,
                request_id=request_id,
                user_id=user_id,
            )
        )

    async def process_pet_alert_in_background(
        self,
        *,
        pet_alert_id: uuid.UUID,
        request_id: uuid.UUID,
        user_id: str,
    ) -> PetAlert:
        pet_alert = self.get_pet_alert(pet_alert_id, user_id)
        processing_alert = self.repository.update(
            pet_alert.id,
            {
                "embeddingStatus": "processing",
                "embeddingUpdatedAt": self._utcnow(),
            },
        )
        if processing_alert is None:
            raise PetAlertNotFoundError(f"Pet alert '{pet_alert_id}' was not found.")

        await self.emit_upload_status(
            user_id=user_id,
            request_id=request_id,
            alert=processing_alert,
            status="processing",
        )

        if not processing_alert.imageUrl:
            try:
                skipped_alert = self.repository.update(
                    processing_alert.id,
                    {
                        "embeddingStatus": "skipped",
                        "embeddingUpdatedAt": self._utcnow(),
                        "imageEmbedding": None,
                        "embeddingModel": None,
                    },
                    commit=False,
                )
                if skipped_alert is None:
                    raise PetAlertNotFoundError(
                        f"Pet alert '{processing_alert.id}' was not found."
                    )
                self.match_repository.delete_pending_for_alert_except_pairs(
                    skipped_alert.id,
                    AlertType.coerce(skipped_alert.alertType),
                    set(),
                    commit=False,
                )
                self.repository.commit()
                self.repository.refresh(skipped_alert)
            except Exception:
                self.repository.rollback()
                raise

            await self.emit_upload_status(
                user_id=user_id,
                request_id=request_id,
                alert=skipped_alert,
                status="success",
            )
            return skipped_alert

        try:
            analysis = await asyncio.to_thread(
                self.ai_service.analyze_alert,
                processing_alert.imageUrl,
                processing_alert.breed,
            )

            updated_alert = self.repository.update(
                processing_alert.id,
                {
                    "imageEmbedding": analysis["embedding"],
                    "embeddingModel": analysis["modelId"],
                    "embeddingStatus": "ready",
                    "embeddingUpdatedAt": self._utcnow(),
                    "aiDescriptor": analysis["aiDescriptor"],
                    "petType": analysis.get("petType") or processing_alert.petType,
                    "color": analysis.get("color") or processing_alert.color,
                },
                commit=False,
            )
            if updated_alert is None:
                raise PetAlertNotFoundError(
                    f"Pet alert '{processing_alert.id}' was not found."
                )

            new_pet_match_ids = self._sync_pet_matches(
                updated_alert,
                analysis,
                owner_user_id=user_id,
            )
            self.repository.commit()
            self.repository.refresh(updated_alert)

            if new_pet_match_ids:
                try:
                    await asyncio.to_thread(
                        self._notify_new_pet_match_candidates,
                        new_pet_match_ids,
                    )
                except Exception as notify_exc:
                    logger.warning(
                        "Pet match candidate notifications failed after commit: %s",
                        notify_exc,
                    )

            await self.emit_upload_status(
                user_id=user_id,
                request_id=request_id,
                alert=updated_alert,
                status="success",
            )
            return updated_alert
        except Exception as exc:
            logger.exception("Pet alert background processing failed: %s", exc)
            self.repository.rollback()
            failed_alert = self.repository.update(
                processing_alert.id,
                {
                    "embeddingStatus": "failed",
                    "embeddingUpdatedAt": self._utcnow(),
                },
            )
            if failed_alert is None:
                raise PetAlertNotFoundError(
                    f"Pet alert '{processing_alert.id}' was not found."
                ) from exc

            await self.emit_upload_status(
                user_id=user_id,
                request_id=request_id,
                alert=failed_alert,
                status="failed",
                error=str(exc),
            )
            return failed_alert

    async def emit_upload_status(
        self,
        *,
        user_id: str,
        request_id: uuid.UUID,
        alert: PetAlert,
        status: str,
        error: str | None = None,
    ) -> None:
        payload = PetAlertUploadSocketData(
            requestId=request_id,
            alertId=alert.id,
            status=UploadStatus(status),
            embeddingStatus=EmbeddingStatus(alert.embeddingStatus),
            alert=serialize_pet_alert(alert),
            error=error,
        )
        await self.socket_manager.send_to_user(
            user_id,
            {
                "success": True,
                "message": self._build_upload_message(status),
                "channelName": "pet-alerts:upload-status",
                "data": payload.model_dump(mode="json"),
            },
        )

    def get_pet_alert(self, pet_alert_id: uuid.UUID, user_id: str) -> PetAlert:
        pet_alert = self.repository.get_one(pet_alert_id)
        if pet_alert is None:
            raise PetAlertNotFoundError(f"Pet alert '{pet_alert_id}' was not found.")

        self._ensure_owned_pulse(pet_alert.pulseId, user_id)
        return pet_alert

    def get_all(self) -> list[PetAlert]:
        pet_alerts = self.repository.get_all()
        return pet_alerts

    def get_unresolved(self) -> list[PetAlert]:
        pet_alerts = self.repository.get_unresolved()
        return pet_alerts

    def get_all_pet_alerts(
        self, user_id: str, filters: PetAlertListFilters
    ) -> list[PetAlert]:
        pet_alerts = self.repository.get_all(filters.model_dump(exclude_none=True))
        return [
            pet_alert
            for pet_alert in pet_alerts
            if self.repository.get_owned_pulse(pet_alert.pulseId, user_id) is not None
        ]

    def get_pet_alert_matches(
        self, pet_alert_id: uuid.UUID, user_id: str
    ) -> list[PetAlertMatchResponse]:
        pet_alert = self.get_pet_alert(pet_alert_id, user_id)
        rows = self.match_repository.list_for_alert(
            pet_alert.id,
            AlertType.coerce(pet_alert.alertType),
            limit=self.max_matches,
        )

        return [
            PetAlertMatchResponse(
                matchedAlert=serialize_pet_alert(matched_alert),
                confidenceScore=match.confidenceScore,
                imageSimilarity=match.imageSimilarity,
                matchedAttributes=list(match.matchedAttributes or []),
                createdAt=match.createdAt,
            )
            for match, matched_alert in rows
        ]

    def update_pet_alert(
        self, pet_alert_id: uuid.UUID, payload: PetAlertUpdateRequest, user_id: str
    ) -> PetAlert:
        self.get_pet_alert(pet_alert_id, user_id)
        updates = payload.model_dump(exclude_unset=True)

        if not updates:
            raise PetAlertValidationError("At least one field must be provided.")

        if "pulseId" in updates:
            self._ensure_owned_pulse(updates["pulseId"], user_id)

        try:
            pet_alert = self.repository.update(pet_alert_id, updates)
        except IntegrityError as exc:
            raise PetAlertValidationError(
                "Unable to update pet alert with the provided data."
            ) from exc

        if pet_alert is None:
            raise PetAlertNotFoundError(f"Pet alert '{pet_alert_id}' was not found.")

        return pet_alert

    def delete_pet_alert(self, pet_alert_id: uuid.UUID, user_id: str) -> None:
        pet_alert = self.get_pet_alert(pet_alert_id, user_id)
        self.match_repository.delete_for_alert(pet_alert.id)
        was_deleted = self.repository.delete(pet_alert_id)
        if not was_deleted:
            raise PetAlertNotFoundError(f"Pet alert '{pet_alert_id}' was not found.")

    def _sync_pet_matches(
        self,
        pet_alert: PetAlert,
        analysis: dict,
        *,
        owner_user_id: str | None,
    ) -> list[uuid.UUID]:
        alert_type = AlertType.coerce(pet_alert.alertType)
        opposite_alert_type = alert_type.opposite()
        query_alert = self._build_match_payload(pet_alert, analysis)
        candidate_pet_type = analysis.get("petType") or pet_alert.petType
        candidates = self.repository.get_match_candidates(
            opposite_alert_type=opposite_alert_type,
            embedding=analysis["embedding"],
            pet_type=candidate_pet_type,
            exclude_id=pet_alert.id,
            exclude_owner_user_id=owner_user_id,
            limit=self.max_candidates,
        )

        ranked_candidates = self.ai_service.rerank_matches(query_alert, candidates)
        top_matches = [
            candidate
            for candidate in ranked_candidates
            if candidate.confidenceScore >= self.match_threshold
        ][: self.max_matches]

        existing_matches = self.match_repository.list_for_alert_entities(
            pet_alert.id,
            alert_type,
        )
        existing_pairs = {
            (match.lostAlertId, match.foundAlertId): match for match in existing_matches
        }
        keep_pairs: set[tuple[uuid.UUID, uuid.UUID]] = set()
        new_pet_match_ids: list[uuid.UUID] = []

        for candidate in top_matches:
            lost_alert_id, found_alert_id = self._resolve_match_pair(
                pet_alert,
                candidate,
            )
            pair = (lost_alert_id, found_alert_id)
            keep_pairs.add(pair)
            persisted_match = self.match_repository.upsert_match(
                lost_alert_id=lost_alert_id,
                found_alert_id=found_alert_id,
                confidence_score=candidate.confidenceScore,
                image_similarity=candidate.imageSimilarity,
                matched_attributes=candidate.matchedAttributes,
                commit=False,
            )
            if pair not in existing_pairs:
                new_pet_match_ids.append(persisted_match.id)

        self.match_repository.delete_pending_for_alert_except_pairs(
            pet_alert.id,
            alert_type,
            keep_pairs,
            commit=False,
        )

        return new_pet_match_ids

    def _resolve_match_pair(
        self, pet_alert: PetAlert, candidate: PetMatchCandidate
    ) -> tuple[uuid.UUID, uuid.UUID]:
        if AlertType.coerce(pet_alert.alertType) is AlertType.LOST:
            lost_alert_id = pet_alert.id
            found_alert_id = candidate.candidate.id
        else:
            lost_alert_id = candidate.candidate.id
            found_alert_id = pet_alert.id

        return lost_alert_id, found_alert_id

    def _notify_new_pet_match_candidates(self, pet_match_ids: list[uuid.UUID]) -> None:
        if not pet_match_ids:
            return

        server_origin = (os.getenv("SERVER_URL") or "http://localhost:3000").rstrip("/")
        secret = os.getenv("PET_MATCH_INTERNAL_SECRET") or "dev-pet-match-secret"
        url = f"{server_origin}/api/internal/pet-matches/candidates"
        payload = json.dumps(
            {"petMatchIds": [str(match_id) for match_id in pet_match_ids]}
        )
        request = urllib.request.Request(
            url,
            data=payload.encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-pet-match-secret": secret,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                if response.status >= 400:
                    raise RuntimeError(
                        f"Internal pet match notification bridge returned {response.status}"
                    )
        except urllib.error.HTTPError as exc:
            raise RuntimeError(
                f"Internal pet match notification bridge returned {exc.code}"
            ) from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(
                "Internal pet match notification bridge is unavailable"
            ) from exc

    def _build_match_payload(self, pet_alert: PetAlert, analysis: dict) -> dict:
        return {
            "id": pet_alert.id,
            "alertType": AlertType.coerce(pet_alert.alertType),
            "petType": analysis.get("petType") or pet_alert.petType,
            "color": analysis.get("color") or pet_alert.color,
            "breed": pet_alert.breed,
            "imageUrl": pet_alert.imageUrl,
            "aiDescriptor": analysis.get("aiDescriptor") or pet_alert.aiDescriptor,
            "imageEmbedding": analysis.get("embedding") or pet_alert.imageEmbedding,
        }

    def _ensure_owned_pulse(self, pulse_id: uuid.UUID, user_id: str) -> None:
        pulse = self.repository.get_owned_pulse(pulse_id, user_id)
        if pulse is None:
            raise PetAlertForbiddenError("You do not have access to that pulse.")

    def _should_reprocess(self, pet_alert: PetAlert, values: dict) -> bool:
        if pet_alert.embeddingStatus in {"pending", "failed"}:
            return True

        fields_to_compare = ("alertType", "petType", "color", "breed", "imageUrl")
        return any(
            getattr(pet_alert, field) != values.get(field)
            for field in fields_to_compare
        )

    def _build_upload_message(self, status: str) -> str:
        if status == "pending":
            return "Pet alert upload queued"
        if status == "processing":
            return "Pet alert upload processing"
        if status == "failed":
            return "Pet alert upload failed"
        return "Pet alert upload completed"

    def _utcnow(self) -> datetime.datetime:
        return datetime.datetime.now(datetime.UTC).replace(tzinfo=None)


async def run_pet_alert_processing_job(
    *,
    pet_alert_id: uuid.UUID,
    request_id: uuid.UUID,
    user_id: str,
) -> None:
    db = create_db_session()
    try:
        service = build_pet_alert_service(db)
        await service.process_pet_alert_in_background(
            pet_alert_id=pet_alert_id,
            request_id=request_id,
            user_id=user_id,
        )
    finally:
        db.close()


def build_pet_alert_service(db: Session) -> PetAlertService:
    return PetAlertService(
        repository=PetAlertRepository(db_session=db),
        match_repository=PetMatchRepository(db_session=db),
        ai_service=get_ai_service(),
        socket_manager=get_pet_alert_socket_manager(),
    )


def get_pet_alert_service(db: Session = Depends(get_db)):
    return build_pet_alert_service(db)
