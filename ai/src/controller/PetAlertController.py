import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, WebSocket, status
from fastapi.responses import JSONResponse
from fastapi.websockets import WebSocketDisconnect

from src.schemas.PetAlertSchemas import (
    EmbeddingStatus,
    PetAlertCreateRequest,
    PetAlertListFilters,
    PetAlertUpdateRequest,
    PetAlertUploadAcceptedResponse,
    UploadStatus,
)
from src.service.PetAlertService import (
    PetAlertForbiddenError,
    PetAlertNotFoundError,
    PetAlertService,
    PetAlertValidationError,
    get_pet_alert_service,
    serialize_pet_alert,
)
from src.service.PetAlertSocketManager import (
    PetAlertSocketManager,
    get_pet_alert_socket_manager,
)

router = APIRouter(prefix="/api/v1/pet-alerts", tags=["pet-alerts"])


def json_success(message: str, data, status_code: int = status.HTTP_200_OK):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
        },
    )


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_pet_alert(
    payload: PetAlertCreateRequest,
    service: PetAlertService = Depends(get_pet_alert_service),
):
    try:
        result = service.create_pet_alert_record(payload)
        await service.emit_upload_status(
            user_id=payload.userId,
            request_id=result.request_id,
            alert=result.alert,
            status=result.status,
        )
        if result.should_enqueue:
            service.enqueue_pet_alert_processing(
                pet_alert_id=result.alert.id,
                request_id=result.request_id,
                user_id=payload.userId,
            )

        response = PetAlertUploadAcceptedResponse(
            requestId=result.request_id,
            alertId=result.alert.id,
            status=UploadStatus(result.status),
            embeddingStatus=EmbeddingStatus(result.alert.embeddingStatus),
            alert=serialize_pet_alert(result.alert),
        )
        return json_success(
            " uploaded!",
            response.model_dump(mode="json"),
            status.HTTP_202_ACCEPTED,
        )
    except PetAlertValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except PetAlertForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.get("/{user_id}")
def list_pet_alerts(
    user_id: str,
    filters: Annotated[PetAlertListFilters, Depends()],
    service: PetAlertService = Depends(get_pet_alert_service),
):
    pet_alerts = service.get_all_pet_alerts(user_id, filters)
    return json_success(
        "Pet alerts retrieved",
        [
            serialize_pet_alert(pet_alert).model_dump(mode="json")
            for pet_alert in pet_alerts
        ],
    )


@router.get("")
def get_all(
    service: PetAlertService = Depends(get_pet_alert_service),
):
    pet_alerts = service.get_unresolved()
    return json_success(
        "Pet alerts retrieved",
        [
            serialize_pet_alert(pet_alert).model_dump(mode="json")
            for pet_alert in pet_alerts
        ],
    )


@router.get("/{user_id}/{pet_alert_id}")
def get_pet_alert(
    user_id: str,
    pet_alert_id: uuid.UUID,
    service: PetAlertService = Depends(get_pet_alert_service),
):
    try:
        pet_alert = service.get_pet_alert(pet_alert_id, user_id)
        return json_success(
            "Pet alert retrieved",
            serialize_pet_alert(pet_alert).model_dump(mode="json"),
        )
    except PetAlertNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PetAlertForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.get("/{user_id}/{pet_alert_id}/matches")
def get_pet_alert_matches(
    pet_alert_id: uuid.UUID,
    user_id: str,
    service: PetAlertService = Depends(get_pet_alert_service),
):
    try:
        matches = service.get_pet_alert_matches(pet_alert_id, user_id)
        return json_success(
            "Pet alert matches retrieved",
            [match.model_dump(mode="json") for match in matches],
        )
    except PetAlertNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PetAlertForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.patch("/{pet_alert_id}")
def update_pet_alert(
    pet_alert_id: uuid.UUID,
    payload: PetAlertUpdateRequest,
    service: PetAlertService = Depends(get_pet_alert_service),
):
    try:
        pet_alert = service.update_pet_alert(pet_alert_id, payload, payload.userId)
        return json_success(
            "Pet alert updated",
            serialize_pet_alert(pet_alert).model_dump(mode="json"),
        )
    except PetAlertValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except PetAlertNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PetAlertForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.delete("/{user_id}/{pet_alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet_alert(
    pet_alert_id: uuid.UUID,
    user_id: str,
    service: PetAlertService = Depends(get_pet_alert_service),
):
    try:
        service.delete_pet_alert(pet_alert_id, user_id)
        return json_success("Pet alert deleted", data={})
    except PetAlertNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PetAlertForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.websocket("/ws")
async def pet_alert_upload_socket(
    websocket: WebSocket,
    socket_manager: PetAlertSocketManager = Depends(get_pet_alert_socket_manager),
):
    user_id = websocket.query_params.get("userId")
    if not user_id:
        await websocket.accept()
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Invalid user ID",
        )
        return

    await socket_manager.register(websocket, user_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await socket_manager.unregister(websocket)
    except Exception:
        await socket_manager.unregister(websocket)
