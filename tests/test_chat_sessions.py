import os
import tempfile
import unittest

from main import Api


class SessionApi(Api):
    def __init__(self, sessions_path):
        self._sessions_path_override = sessions_path
        super().__init__()

    @property
    def _sessions_path(self):
        return self._sessions_path_override


class ChatSessionTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.sessions_path = os.path.join(self.temp_dir.name, "sessions.json")
        self.api = SessionApi(self.sessions_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_session_save_is_immediately_loadable(self):
        result = self.api.chat_save_session(
            "session-1",
            "Question",
            [
                {"role": "user", "content": "Question"},
                {"role": "assistant", "content": "Answer"},
            ],
        )

        self.assertTrue(result["ok"])
        loaded = self.api.chat_load_session("session-1")
        self.assertEqual(loaded["session"]["messages"][-1]["content"], "Answer")

    def test_session_list_is_sorted_by_most_recent_update(self):
        self.api._save_sessions([
            {
                "id": "older",
                "title": "Older",
                "created_at": "2026-01-01T10:00:00",
                "updated_at": "2026-01-01T10:00:00",
                "messages": [],
            },
            {
                "id": "newer",
                "title": "Newer",
                "created_at": "2026-01-01T11:00:00",
                "updated_at": "2026-01-01T12:00:00",
                "messages": [],
            },
        ])

        sessions = self.api.chat_list_sessions()

        self.assertEqual([session["id"] for session in sessions], ["newer", "older"])


if __name__ == "__main__":
    unittest.main()
