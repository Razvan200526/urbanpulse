from __future__ import annotations

import io
import logging
import math
import os
import threading
import urllib.parse
import urllib.request
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable, Sequence

import numpy as np
import torch
from PIL import Image
from transformers import AutoModel, AutoProcessor

PET_TYPE_LABELS = ("dog", "cat", "other pet")
COLOR_LABELS = ("black", "white", "brown", "golden", "gray", "orange", "cream", "mixed")
BREED_STOP_WORDS = {"dog", "cat", "mixed", "mix", "pet", "type"}
REMOTE_IMAGE_REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class MatchScoreDetails:
    confidenceScore: float
    imageSimilarity: float
    matchedAttributes: list[str]


@dataclass(slots=True)
class PetMatchCandidate:
    candidate: Any
    confidenceScore: float
    imageSimilarity: float
    matchedAttributes: list[str]


class AIService:
    def __init__(self, model_id: str | None = None):
        self.model_id = model_id or os.getenv(
            "SIGLIP2_MODEL_ID", "google/siglip2-base-patch16-224"
        )
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        self._torch_dtype = torch.bfloat16 if self._device == "cuda" else torch.float32
        self._model = None
        self._processor = None
        self._model_lock = threading.Lock()

    @property
    def device(self) -> str:
        return self._device

    def load_image(self, image_url_or_path: str) -> Image.Image:
        parsed = urllib.parse.urlparse(image_url_or_path)
        if parsed.scheme in {"http", "https"}:
            request = urllib.request.Request(
                image_url_or_path, headers=REMOTE_IMAGE_REQUEST_HEADERS
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = response.read()
            image = Image.open(io.BytesIO(payload))
        else:
            image = Image.open(Path(image_url_or_path))

        return image.convert("RGB")

    def embed_image(self, image: Image.Image) -> list[float]:
        features = self._get_raw_image_features(image)
        return self._normalize_embedding(features).tolist()

    def infer_attributes(self, image: Image.Image) -> dict[str, Any]:
        pet_scores = self._score_candidate_labels(image, PET_TYPE_LABELS)
        color_scores = self._score_candidate_labels(image, COLOR_LABELS)
        pet_type = max(pet_scores, key=lambda k: pet_scores[k])
        color = max(color_scores, key=lambda k: color_scores[k])

        return {
            "petType": pet_type,
            "color": color,
            "rawScores": {
                "petType": pet_scores,
                "color": color_scores,
            },
        }

    def build_descriptor(
        self, attributes: dict[str, Any], existing_breed: str | None
    ) -> str:
        color = self._normalize_text(attributes.get("color"))
        pet_type = self._normalize_text(attributes.get("petType"))
        descriptor = " ".join(part for part in (color, pet_type) if part).strip()

        breed = self._normalize_text(existing_breed)
        if breed:
            descriptor = f"{descriptor}, likely {breed}-type" if descriptor else breed

        return descriptor

    def analyze_alert(
        self, image_url: str, existing_breed: str | None = None
    ) -> dict[str, Any]:
        image = self.load_image(image_url)
        attributes = self.infer_attributes(image)
        embedding = self.embed_image(image)
        descriptor = self.build_descriptor(attributes, existing_breed)

        return {
            "embedding": embedding,
            "petType": attributes["petType"],
            "color": attributes["color"],
            "rawScores": attributes["rawScores"],
            "aiDescriptor": descriptor,
            "modelId": self.model_id,
        }

    def score_match(
        self, query_alert: dict[str, Any], candidate_alert: dict[str, Any]
    ) -> float:
        return self._calculate_match_details(
            query_alert, candidate_alert
        ).confidenceScore

    def rerank_matches(
        self, query_alert: dict[str, Any], candidates: Sequence[Any]
    ) -> list[PetMatchCandidate]:
        ranked: list[PetMatchCandidate] = []
        for candidate in candidates:
            candidate_payload = self._coerce_alert_payload(candidate)
            details = self._calculate_match_details(query_alert, candidate_payload)
            ranked.append(
                PetMatchCandidate(
                    candidate=candidate,
                    confidenceScore=details.confidenceScore,
                    imageSimilarity=details.imageSimilarity,
                    matchedAttributes=details.matchedAttributes,
                )
            )

        ranked.sort(
            key=lambda item: (item.confidenceScore, item.imageSimilarity), reverse=True
        )
        return ranked

    def _ensure_model(self) -> tuple[Any, Any]:
        if self._model is not None and self._processor is not None:
            return self._model, self._processor

        with self._model_lock:
            if self._model is None:
                model = AutoModel.from_pretrained(
                    self.model_id,
                    torch_dtype=self._torch_dtype,
                )
                model.eval()
                model.to(self.device)
                self._model = model

            if self._processor is None:
                self._processor = AutoProcessor.from_pretrained(self.model_id)

        return self._model, self._processor

    def _build_text_prompts(self, labels: Iterable[str]) -> list[str]:
        return [f"This is a photo of {label.lower()}." for label in labels]

    def _score_candidate_labels(
        self, image: Image.Image, labels: Sequence[str]
    ) -> dict[str, float]:
        model, processor = self._ensure_model()
        prompts = self._build_text_prompts(labels)
        inputs = processor(
            text=prompts,
            images=image,
            padding="max_length",
            max_length=64,
            truncation=True,
            return_tensors="pt",
        ).to(model.device)

        with torch.inference_mode():
            outputs = model(**inputs)

        scores = torch.sigmoid(outputs.logits_per_image)[0].detach().cpu().tolist()
        return {label: round(float(score), 6) for label, score in zip(labels, scores)}

    def _get_raw_image_features(self, image: Image.Image) -> np.ndarray:
        model, processor = self._ensure_model()
        inputs = processor(images=[image], return_tensors="pt").to(model.device)

        with torch.inference_mode():
            vision_outputs = model.vision_model(**{
                k: v for k, v in inputs.items()
                if k in ("pixel_values", "pixel_mask")
            })

            # Prefer pooler_output (batch, hidden_dim) when available;
            # otherwise mean-pool last_hidden_state (batch, seq, hidden_dim).
            if hasattr(vision_outputs, "pooler_output") and vision_outputs.pooler_output is not None:
                features = vision_outputs.pooler_output[0]
            else:
                features = vision_outputs.last_hidden_state[0].mean(dim=0)

        arr = features.detach().float().cpu().numpy().ravel()
        logger.debug("Embedding shape after ravel: %s", arr.shape)
        return arr

    def _normalize_embedding(self, values: Sequence[float] | np.ndarray) -> np.ndarray:
        vector = np.asarray(values, dtype=np.float32)
        norm = np.linalg.norm(vector)
        if not math.isfinite(float(norm)) or norm == 0:
            raise ValueError("Embedding vector must have a non-zero norm.")
        return vector / norm

    def _calculate_match_details(
        self, query_alert: dict[str, Any], candidate_alert: dict[str, Any]
    ) -> MatchScoreDetails:
        image_similarity = self._calculate_image_similarity(
            query_alert.get("imageEmbedding"), candidate_alert.get("imageEmbedding")
        )
        species_score = self._calculate_species_score(query_alert, candidate_alert)
        color_score = self._calculate_color_score(query_alert, candidate_alert)
        breed_score = self._calculate_breed_score(query_alert, candidate_alert)

        final_score = (
            0.80 * image_similarity
            + 0.10 * species_score
            + 0.07 * color_score
            + 0.03 * breed_score
        )
        confidence = round(min(max(final_score, 0.0), 1.0), 4)

        matched_attributes: list[str] = []
        if species_score == 1.0:
            matched_attributes.append("species")
        if color_score > 0:
            matched_attributes.append("color")
        if breed_score > 0:
            matched_attributes.append("breed")

        return MatchScoreDetails(
            confidenceScore=confidence,
            imageSimilarity=round(image_similarity, 4),
            matchedAttributes=matched_attributes,
        )

    def _calculate_image_similarity(
        self,
        left_embedding: Sequence[float] | None,
        right_embedding: Sequence[float] | None,
    ) -> float:
        if left_embedding is None or right_embedding is None:
            return 0.0
        if len(left_embedding) == 0 or len(right_embedding) == 0:
            return 0.0

        left = self._normalize_embedding(left_embedding)
        right = self._normalize_embedding(right_embedding)
        similarity = float(np.dot(left, right))
        return round(max(similarity, 0.0), 6)

    def _calculate_species_score(
        self, query_alert: dict[str, Any], candidate_alert: dict[str, Any]
    ) -> float:
        return float(
            self._normalize_text(query_alert.get("petType"))
            == self._normalize_text(candidate_alert.get("petType"))
        )

    def _calculate_color_score(
        self, query_alert: dict[str, Any], candidate_alert: dict[str, Any]
    ) -> float:
        query_color = self._normalize_text(query_alert.get("color"))
        candidate_color = self._normalize_text(candidate_alert.get("color"))

        if not query_color or not candidate_color:
            return 0.0

        if query_color == candidate_color:
            return 1.0

        query_descriptor = self._normalize_text(query_alert.get("aiDescriptor"))
        candidate_descriptor = self._normalize_text(candidate_alert.get("aiDescriptor"))
        if (
            query_color in candidate_descriptor.split()
            or candidate_color in query_descriptor.split()
        ):
            return 0.5

        return 0.0

    def _calculate_breed_score(
        self, query_alert: dict[str, Any], candidate_alert: dict[str, Any]
    ) -> float:
        query_breed = self._normalize_text(query_alert.get("breed"))
        candidate_breed = self._normalize_text(candidate_alert.get("breed"))

        if not query_breed or not candidate_breed:
            return 0.0

        if query_breed == candidate_breed:
            return 1.0

        query_tokens = self._breed_family_tokens(query_breed)
        candidate_tokens = self._breed_family_tokens(candidate_breed)
        if (
            query_tokens
            and candidate_tokens
            and query_tokens.intersection(candidate_tokens)
        ):
            return 0.5

        return 0.0

    def _breed_family_tokens(self, breed: str) -> set[str]:
        normalized = self._normalize_text(breed)
        return {
            token
            for token in normalized.replace("-", " ").split()
            if token and token not in BREED_STOP_WORDS
        }

    def _coerce_alert_payload(self, alert: Any) -> dict[str, Any]:
        if isinstance(alert, dict):
            return alert

        return {
            "id": getattr(alert, "id", None),
            "alertType": getattr(alert, "alertType", None),
            "petType": getattr(alert, "petType", None),
            "color": getattr(alert, "color", None),
            "breed": getattr(alert, "breed", None),
            "imageUrl": getattr(alert, "imageUrl", None),
            "aiDescriptor": getattr(alert, "aiDescriptor", None),
            "imageEmbedding": getattr(alert, "imageEmbedding", None),
        }

    def _normalize_text(self, value: Any) -> str:
        if value is None:
            return ""
        return str(value).strip().lower()


@lru_cache
def get_ai_service() -> AIService:
    return AIService()
