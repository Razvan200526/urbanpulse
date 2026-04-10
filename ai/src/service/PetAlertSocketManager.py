from __future__ import annotations

import asyncio
from collections import defaultdict
from functools import lru_cache

from fastapi import WebSocket


class PetAlertSocketManager:
    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def register(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].add(websocket)

    async def unregister(self, websocket: WebSocket) -> None:
        async with self._lock:
            empty_users: list[str] = []
            for user_id, sockets in self._connections.items():
                if websocket in sockets:
                    sockets.discard(websocket)
                if not sockets:
                    empty_users.append(user_id)

            for user_id in empty_users:
                self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, payload: dict) -> None:
        async with self._lock:
            sockets = list(self._connections.get(user_id, set()))

        stale_connections: list[WebSocket] = []
        for websocket in sockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                stale_connections.append(websocket)

        for websocket in stale_connections:
            await self.unregister(websocket)


@lru_cache
def get_pet_alert_socket_manager() -> PetAlertSocketManager:
    return PetAlertSocketManager()
