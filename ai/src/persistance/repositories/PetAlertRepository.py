import uuid
from typing import List

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.persistance.generated_models import PetAlert, Pulse


class PetAlertRepository:
    def __init__(self, db_session: Session):
        self.db = db_session

    def get_one(self, pet_alert_id: uuid.UUID) -> PetAlert | None:
        return self.db.get(PetAlert, pet_alert_id)

    def get_by_pulse_id(self, pulse_id: uuid.UUID) -> PetAlert | None:
        return self.db.scalar(select(PetAlert).where(PetAlert.pulseId == pulse_id))

    def get_unresolved(self) -> List[PetAlert]:
        return list(
            self.db.scalars(
                select(PetAlert)
                .where(PetAlert.pulseId == Pulse.id, Pulse.status != "RESOLVED")
                .join(Pulse)
            )
        )

    def get_owned_pulse(self, pulse_id: uuid.UUID, user_id: str) -> Pulse | None:
        return self.db.scalar(
            select(Pulse).where(Pulse.id == pulse_id, Pulse.userId == user_id)
        )

    def pulse_exists(self, pulse_id: uuid.UUID) -> bool:
        return self.db.scalar(select(Pulse.id).where(Pulse.id == pulse_id)) is not None

    def create(self, payload: dict, *, commit: bool = True) -> PetAlert:
        entity = PetAlert(**payload)
        self.db.add(entity)
        self.db.flush()
        self.db.refresh(entity)

        if commit:
            self.commit()
            self.db.refresh(entity)

        return entity

    def update(
        self, pet_alert_id: uuid.UUID, payload: dict, *, commit: bool = True
    ) -> PetAlert | None:
        entity = self.get_one(pet_alert_id)
        if entity is None:
            return None

        for key, value in payload.items():
            setattr(entity, key, value)

        self.db.flush()

        if commit:
            self.commit()

        self.db.refresh(entity)
        return entity

    def delete(self, pet_alert_id: uuid.UUID, *, commit: bool = True) -> bool:
        entity = self.get_one(pet_alert_id)
        if entity is None:
            return False

        self.db.delete(entity)
        self.db.flush()

        if commit:
            self.commit()

        return True

    def get_all(self, options: dict | None = None) -> list[PetAlert]:
        query = select(PetAlert)
        options = options or {}

        for key, value in options.items():
            query = query.where(getattr(PetAlert, key) == value)

        return list(self.db.scalars(query))

    def get_match_candidates(
        self,
        *,
        opposite_alert_type: str,
        embedding: list[float],
        pet_type: str | None,
        exclude_id: uuid.UUID,
        exclude_owner_user_id: str | None,
        limit: int,
    ) -> list[PetAlert]:
        query = (
            select(PetAlert)
            .join(Pulse, PetAlert.pulseId == Pulse.id)
            .where(PetAlert.alertType == opposite_alert_type)
            .where(PetAlert.id != exclude_id)
            .where(PetAlert.imageEmbedding.is_not(None))
        )

        if exclude_owner_user_id:
            query = query.where(Pulse.userId != exclude_owner_user_id)

        if pet_type and pet_type != "other pet":
            query = query.where(func.lower(PetAlert.petType) == pet_type.lower())

        query = query.order_by(
            PetAlert.imageEmbedding.cosine_distance(embedding)
        ).limit(limit)

        return list(self.db.scalars(query))

    def commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def rollback(self) -> None:
        self.db.rollback()

    def refresh(self, entity: PetAlert) -> None:
        self.db.refresh(entity)
