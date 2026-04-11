import uuid
from enum import StrEnum

from sqlalchemy import delete, desc, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session, aliased

from src.persistance.generated_models import PetAlert, PetMatch
from src.schemas.PetAlertSchemas import AlertType


class PetMatchStatus(StrEnum):
    PENDING_REVIEW = "PENDING_REVIEW"


class PetMatchRepository:
    def __init__(self, db_session: Session):
        self.db = db_session

    def upsert_match(
        self,
        *,
        lost_alert_id: uuid.UUID,
        found_alert_id: uuid.UUID,
        confidence_score: float,
        image_similarity: float,
        matched_attributes: list[str],
        commit: bool = True,
    ) -> PetMatch:
        statement = insert(PetMatch).values(
            lostAlertId=lost_alert_id,
            foundAlertId=found_alert_id,
            confidenceScore=confidence_score,
            imageSimilarity=image_similarity,
            matchedAttributes=matched_attributes,
        )
        statement = statement.on_conflict_do_update(
            index_elements=["lostAlertId", "foundAlertId"],
            set_={
                "confidenceScore": confidence_score,
                "imageSimilarity": image_similarity,
                "matchedAttributes": matched_attributes,
                "updatedAt": func.now(),
            },
        ).returning(PetMatch)

        entity = self.db.execute(statement).scalar_one()

        if commit:
            self.commit()

        return entity

    def delete_for_alert(
        self,
        pet_alert_id: uuid.UUID,
        alert_type: AlertType | None = None,
        *,
        commit: bool = True,
    ) -> None:
        if alert_type is AlertType.LOST:
            statement = delete(PetMatch).where(PetMatch.lostAlertId == pet_alert_id)
        elif alert_type is AlertType.FOUND:
            statement = delete(PetMatch).where(PetMatch.foundAlertId == pet_alert_id)
        else:
            statement = delete(PetMatch).where(
                or_(
                    PetMatch.lostAlertId == pet_alert_id,
                    PetMatch.foundAlertId == pet_alert_id,
                )
            )

        self.db.execute(statement)
        self.db.flush()

        if commit:
            self.commit()

    def list_for_alert(
        self, pet_alert_id: uuid.UUID, alert_type: AlertType, *, limit: int = 5
    ) -> list[tuple[PetMatch, PetAlert]]:
        matched_alert = aliased(PetAlert)

        if alert_type is AlertType.LOST:
            statement = (
                select(PetMatch, matched_alert)
                .join(matched_alert, PetMatch.foundAlertId == matched_alert.id)
                .where(PetMatch.lostAlertId == pet_alert_id)
            )
        else:
            statement = (
                select(PetMatch, matched_alert)
                .join(matched_alert, PetMatch.lostAlertId == matched_alert.id)
                .where(PetMatch.foundAlertId == pet_alert_id)
            )

        statement = statement.order_by(
            desc(PetMatch.confidenceScore),
            desc(PetMatch.imageSimilarity),
        ).limit(limit)

        return [(match, alert) for match, alert in self.db.execute(statement).all()]

    def list_for_alert_entities(
        self, pet_alert_id: uuid.UUID, alert_type: AlertType
    ) -> list[PetMatch]:
        if alert_type is AlertType.LOST:
            statement = select(PetMatch).where(PetMatch.lostAlertId == pet_alert_id)
        else:
            statement = select(PetMatch).where(PetMatch.foundAlertId == pet_alert_id)

        statement = statement.order_by(
            desc(PetMatch.confidenceScore),
            desc(PetMatch.imageSimilarity),
        )

        return list(self.db.scalars(statement))

    def delete_pending_for_alert_except_pairs(
        self,
        pet_alert_id: uuid.UUID,
        alert_type: AlertType,
        keep_pairs: set[tuple[uuid.UUID, uuid.UUID]],
        *,
        commit: bool = True,
    ) -> None:
        existing_matches = self.list_for_alert_entities(pet_alert_id, alert_type)

        for match in existing_matches:
            pair = (match.lostAlertId, match.foundAlertId)
            if match.status == PetMatchStatus.PENDING_REVIEW and pair not in keep_pairs:
                self.db.delete(match)

        self.db.flush()

        if commit:
            self.commit()

    def commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
