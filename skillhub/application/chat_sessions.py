"""Chat-session use cases independent of the PyWebView bridge."""

import time
from collections.abc import Callable
from typing import Protocol


class SessionRepository(Protocol):
    """Persistence port required by the chat-session application service."""

    def load(self) -> list: ...

    def save(self, sessions: list) -> bool: ...


class ChatSessionService:
    """Create, query, and delete persisted chat sessions."""

    def __init__(
        self,
        repository: SessionRepository,
        language: str = "zh",
        clock: Callable[[], str] | None = None,
    ):
        self.repository = repository
        self.language = language
        self.clock = clock or (lambda: time.strftime("%Y-%m-%dT%H:%M:%S"))

    def list_sessions(self) -> list:
        sessions = sorted(
            self.repository.load(),
            key=lambda session: session.get(
                "updated_at",
                session.get("created_at", ""),
            ),
            reverse=True,
        )
        return [{
            "id": session["id"],
            "title": session.get("title") or (
                "新会话" if self.language == "zh" else "New Chat"
            ),
            "created_at": session.get("created_at", ""),
            "updated_at": session.get("updated_at", ""),
            "msg_count": len(session.get("messages", [])),
        } for session in sessions]

    def load_session(self, session_id: str) -> dict:
        for session in self.repository.load():
            if session["id"] == session_id:
                return {"session": session}
        return {"error": "Session not found"}

    def save_session(self, session_id: str, title: str, messages: list) -> dict:
        sessions = self.repository.load()
        now = self.clock()
        for session in sessions:
            if session["id"] == session_id:
                session["title"] = title or session.get("title") or (
                    "未命名会话" if self.language == "zh" else "Untitled Chat"
                )
                session["messages"] = messages
                session["updated_at"] = now
                break
        else:
            sessions.append({
                "id": session_id,
                "title": title or (
                    "新会话" if self.language == "zh" else "New Chat"
                ),
                "created_at": now,
                "updated_at": now,
                "messages": messages,
            })
        if not self.repository.save(sessions):
            return {"error": "Failed to save chat session"}
        return {"ok": True, "id": session_id}

    def delete_session(self, session_id: str) -> dict:
        sessions = [
            session
            for session in self.repository.load()
            if session["id"] != session_id
        ]
        if not self.repository.save(sessions):
            return {"error": "Failed to delete chat session"}
        return {"ok": True}
