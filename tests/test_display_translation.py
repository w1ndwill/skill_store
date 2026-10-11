"""Display translation preserves source files and has its own output budget."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from skillhub.presentation.api.collections import CollectionsApiMixin


class TranslationApi(CollectionsApiMixin):
    deepseek_api_key = "synthetic-key"
    deepseek_model = "deepseek-flash"
    api_base = "https://api.deepseek.com/v1"
    ai_reasoning_effort = "high"
    language = "zh"


class DisplayTranslationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.skill = self.root / "SKILL.md"
        self.skill.write_text(
            "---\nname: paper-collage\ndescription: "
            + "Transform source photographs into spacious paper collages. " * 14
            + "\n---\n\n# Preserve this body\n", encoding="utf-8"
        )
        self.original = self.skill.read_bytes()
        self.api = TranslationApi()
        self.api.skills_dir = str(self.root)

    def tearDown(self):
        self.temp.cleanup()

    @staticmethod
    def response(finish="stop"):
        response = mock.Mock(status_code=200)
        response.json.return_value = {"choices": [{
            "finish_reason": finish,
            "message": {"content": json.dumps({
                "title": "纸感拼贴", "description": "将照片转化为留白充足的纸感拼贴作品。"
            }, ensure_ascii=False)},
        }]}
        return response

    def test_long_description_translates_without_agent_reasoning_and_survives_reopen(self):
        with mock.patch("skillhub.presentation.api.collections.requests.post",
                        return_value=self.response()) as post:
            result = self.api._translate_import_display_metadata(str(self.root), "standard")
        self.assertTrue(result["ok"])
        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["thinking"], {"type": "disabled"})
        self.assertNotIn("reasoning_effort", payload)
        self.assertEqual(self.api.ai_reasoning_effort, "high")
        self.api._persist_display_localizations({"paper-collage": result["localization"]})
        metadata = self.api._import_entry_metadata(str(self.root), "standard")
        metadata["filename"] = "paper-collage"
        self.api._apply_display_localization(metadata, self.api._load_display_localizations())
        self.assertIn("纸感拼贴", metadata["display_description"])
        self.assertEqual(self.skill.read_bytes(), self.original)

    def test_truncation_retries_once_with_more_room(self):
        with mock.patch("skillhub.presentation.api.collections.requests.post",
                        side_effect=[self.response("length"), self.response()]) as post:
            result = self.api._translate_import_display_metadata(str(self.root), "standard")
        self.assertTrue(result["ok"])
        self.assertEqual([call.kwargs["json"]["max_tokens"] for call in post.call_args_list], [2000, 4000])
        self.assertEqual(self.skill.read_bytes(), self.original)

    def test_repeated_truncation_is_reported_without_partial_translation(self):
        with mock.patch("skillhub.presentation.api.collections.requests.post",
                        return_value=self.response("length")) as post:
            result = self.api._translate_import_display_metadata(str(self.root), "standard")
        self.assertIn("truncated", result["error"])
        self.assertEqual(post.call_count, 2)
        self.assertNotIn("localization", result)
        self.assertEqual(self.skill.read_bytes(), self.original)

    def test_custom_provider_does_not_receive_deepseek_flags(self):
        self.api.api_base = "https://gateway.example/v1"
        with mock.patch("skillhub.presentation.api.collections.requests.post",
                        return_value=self.response()) as post:
            result = self.api._translate_import_display_metadata(str(self.root), "standard")
        self.assertTrue(result["ok"])
        self.assertNotIn("thinking", post.call_args.kwargs["json"])


if __name__ == "__main__":
    unittest.main()
