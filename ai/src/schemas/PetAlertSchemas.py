import datetime
import uuid
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

AlertType = Literal["lost", "found"]


class EmbeddingStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    SKIPPED = "skipped"


class UploadStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


class PetAlertBase(BaseModel):
    pulseId: uuid.UUID
    alertType: AlertType
    petType: str = Field(min_length=1, max_length=255)
    color: str | None = Field(default=None, min_length=1, max_length=255)
    breed: str | None = Field(default=None, max_length=255)
    imageUrl: str | None = None

    @field_validator("petType", "color")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Value must not be blank.")
        return normalized

    @field_validator("breed", "imageUrl")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class PetAlertCreateRequest(PetAlertBase):
    requestId: uuid.UUID
    userId: str


class PetAlertUpdateRequest(BaseModel):
    userId: str
    pulseId: uuid.UUID | None = None
    alertType: AlertType | None = None
    petType: str | None = Field(default=None, min_length=1, max_length=255)
    color: str | None = Field(default=None, min_length=1, max_length=255)
    breed: str | None = Field(default=None, max_length=255)
    imageUrl: str | None = None
    aiDescriptor: str | None = None

    @field_validator("petType", "color")
    @classmethod
    def normalize_required_update_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        if not normalized:
            raise ValueError("Value must not be blank.")
        return normalized

    @field_validator("breed", "imageUrl", "aiDescriptor")
    @classmethod
    def normalize_optional_update_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_at_least_one_field(self) -> "PetAlertUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided for an update.")
        return self


class PetAlertListFilters(BaseModel):
    pulseId: uuid.UUID | None = None
    alertType: AlertType | None = None
    petType: str | None = None
    color: str | None = None

    @field_validator("petType", "color")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class PetAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    pulseId: uuid.UUID
    alertType: AlertType
    petType: str
    color: str
    breed: str | None
    imageUrl: str | None
    aiDescriptor: str | None
    embeddingStatus: EmbeddingStatus
    embeddingModel: str | None
    embeddingUpdatedAt: datetime.datetime | None
    ownerUserId: str | None


class PetAlertUploadAcceptedResponse(BaseModel):
    requestId: uuid.UUID
    alertId: uuid.UUID
    status: UploadStatus
    embeddingStatus: EmbeddingStatus
    alert: PetAlertResponse


class PetAlertUploadSocketData(BaseModel):
    requestId: uuid.UUID
    alertId: uuid.UUID
    status: UploadStatus
    embeddingStatus: EmbeddingStatus
    alert: PetAlertResponse
    error: str | None = None


class PetAlertMatchResponse(BaseModel):
    matchedAlert: PetAlertResponse
    confidenceScore: float
    imageSimilarity: float
    matchedAttributes: list[str]
    createdAt: datetime.datetime
