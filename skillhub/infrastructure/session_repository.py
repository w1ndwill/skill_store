"""JSON-backed persistence adapter for chat sessions."""

from .filesystem import atomic_write_json, load_json_file


class ChatSessionRepository:
    def __init__(self, path: str):
        self.path = path

    def load(self) -> list:
        sessions = load_json_file(self.path, [])
        return sessions if isinstance(sessions, list) else []

    def save(self, sessions: list) -> bool:
        try:
            atomic_write_json(self.path, sessions)
            return True
        except OSError:
            return False
