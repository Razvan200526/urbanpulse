from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.controller.PetAlertController import router as pet_alert_router
from src.utils.get_origins import get_allowed_origins

app = FastAPI(
    title="UrbanPulse AI Service",
    description="Public FastAPI microservice for UrbanPulse AI endpoints.",
    version=os.getenv("AI_SERVICE_VERSION", "0.1.0"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pet_alert_router)


@app.get("/")
def root():
    return {
        "service": "urbanPulse",
        "status": "ok",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/health")
def health_check():
    return {"service": "urbanPulse", "status": "ok"}


@app.get("/api/v1/ping")
def ping():
    return {"message": "pong", "service": "urbanPulse"}
