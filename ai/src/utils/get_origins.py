import os

from src.utils.dedupe import dedupe


def get_allowed_origins() -> list[str]:
    configured_origins = dedupe(
        [
            *parse_origins(os.getenv("AI_CORS_ORIGINS")),
            *parse_origins(os.getenv("CLIENT_URL")),
            *parse_origins(os.getenv("CORS_ALLOW_ORIGINS")),
        ]
    )

    if configured_origins:
        return configured_origins
    else:
        return []


def parse_origins(value: str | None) -> list[str]:
    return [
        origin.strip().rstrip("/")
        for origin in (value or "").split(",")
        if origin.strip().rstrip("/")
    ]
