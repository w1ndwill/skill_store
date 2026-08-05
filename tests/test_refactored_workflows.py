import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import main
from skillhub.infrastructure.filesystem import atomic_write_text


ROOT = Path(__file__).resolve().parents[1]


def write_text(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    atomic_write_text(path, content)


class RefactoredWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(dir=ROOT)
        self.root = self.temporary.name
        self.skills_dir = os.path.join(self.root, "skills")
        self.sources_dir = os.path.join(self.root, "sources")
        os.makedirs(self.skills_dir)
        os.makedirs(self.sources_dir)
        self.api = main.Api()
        self.api.skills_dir = self.skills_dir
        self.api.projects = []
        self.api.language = "zh"
        self.api.deepseek_api_key = ""
        self.api.ai_import_optimization = False
        self.api.ai_display_translation = False

    def tearDown(self):
        self.temporary.cleanup()

    def test_category_delete_rolls_back_through_library_adapter_dependency(self):
        paths = [
            os.path.join(self.skills_dir, "a.md"),
            os.path.join(self.skills_dir, "b.md"),
        ]
        originals = []
        for index, path in enumerate(paths):
            content = (
                "---\n"
                f"title: Skill {index}\n"
                "category: 测试类别\n"
                "---\n\n"
                f"# Skill {index}\n"
            )
            originals.append(content)
            write_text(path, content)
        calls = 0

        def fail_second_write(path, content):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError("simulated write failure")
            atomic_write_text(path, content)

        with mock.patch(
            "skillhub.presentation.api.library.atomic_write_text",
            side_effect=fail_second_write,
        ):
            result = self.api.delete_skill_category("测试类别")

        self.assertIn("simulated write failure", result["error"])
        self.assertTrue(result["rolled_back"])
        for path, original in zip(paths, originals):
            self.assertEqual(Path(path).read_text(encoding="utf-8"), original)

    def test_import_tree_rejects_reparse_points_through_preparation_adapter(self):
        source = os.path.join(self.sources_dir, "linked-skill")
        write_text(
            os.path.join(source, "SKILL.md"),
            "---\nname: linked-skill\ndescription: Linked.\n---\n",
        )
        linked = os.path.join(source, "linked")
        os.makedirs(linked)
        with mock.patch(
            "skillhub.presentation.api.import_preparation.is_path_reparse_point",
            side_effect=lambda path: (
                os.path.normcase(path) == os.path.normcase(linked)
            ),
        ):
            preview = self.api.preview_skill_import(source)
        self.assertIn("reparse point", preview["error"].lower())

    def test_truncated_ai_diff_falls_back_via_candidate_adapter(self):
        self.api.ai_import_optimization = True
        self.api.deepseek_api_key = "sk-test-key"
        source = os.path.join(self.sources_dir, "review.md")
        write_text(source, "# Review\n\nCheck behavior.\n")
        response = mock.Mock(status_code=200)
        response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "# AI Review\n\n" + ("Changed behavior.\n" * 100)
                }
            }]
        }
        with (
            mock.patch("skillhub.domain.imports.SKILL_IMPORT_DIFF_MAX_CHARS", 80),
            mock.patch(
                "skillhub.presentation.api.import_candidates.requests.post",
                return_value=response,
            ),
        ):
            preview = self.api.preview_skill_import(source)
        self.assertFalse(preview["ai_used"])
        self.assertTrue(any(
            finding["code"] == "ai_optimization_fallback"
            for finding in preview["findings"]
        ))
