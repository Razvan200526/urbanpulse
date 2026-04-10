import uuid

from sqlalchemy import delete, desc, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session, aliased

from src.persistance.generated_models import PetAlert, PetMatch


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
            },
        ).returning(PetMatch)

        entity = self.db.execute(statement).scalar_one()

        if commit:
            self.commit()

        return entity

    def delete_for_alert(
        self,
        pet_alert_id: uuid.UUID,
        alert_type: str | None = None,
        *,
        commit: bool = True,
    ) -> None:
        if alert_type == "lost":
            statement = delete(PetMatch).where(PetMatch.lostAlertId == pet_alert_id)
        elif alert_type == "found":
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
        self, pet_alert_id: uuid.UUID, alert_type: str, *, limit: int = 5
    ) -> list[tuple[PetMatch, PetAlert]]:
        matched_alert = aliased(PetAlert)

        if alert_type == "lost":
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

    def commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
