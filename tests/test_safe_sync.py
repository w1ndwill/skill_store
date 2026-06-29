import os
import tempfile
import unittest

from main import Api


def write_text(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)


def read_text(path):
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


class SafeSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = self.temp_dir.name
        self.skills_dir = os.path.join(self.root, "global-skills")
        self.project_dir = os.path.join(self.root, "project")
        os.makedirs(self.skills_dir)
        os.makedirs(self.project_dir)

        self.api = Api()
        self.api.skills_dir = self.skills_dir
        self.api.projects = [{"name": "project", "path": self.project_dir}]
        self.api.language = "en"

    def tearDown(self):
        self.temp_dir.cleanup()

    def skill_path(self, filename):
        return os.path.join(self.skills_dir, filename)

    def project_path(self, relative_path):
        return os.path.join(self.project_dir, *relative_path.split("/"))

    def test_unknown_files_are_preserved_and_managed_files_can_be_removed(self):
        write_text(self.skill_path("alpha.md"), "# Alpha\n")
        unknown = self.project_path(".agent/skills/local-only.md")
        write_text(unknown, "# Local only\n")

        result = self.api.sync_skills(self.project_dir, ["alpha.md"])
        self.assertTrue(result["ok"])
        self.assertTrue(os.path.exists(unknown))

        result = self.api.sync_skills(self.project_dir, [])
        self.assertTrue(result["ok"])
        self.assertFalse(os.path.exists(self.project_path(".agent/skills/alpha.md")))
        self.assertTrue(os.path.exists(unknown))

    def test_modified_managed_file_is_preserved_when_unselected(self):
        write_text(self.skill_path("alpha.md"), "# Alpha\n")
        self.api.sync_skills(self.project_dir, ["alpha.md"])
        target = self.project_path(".agent/skills/alpha.md")
        write_text(target, "# Project customization\n")

        preview = self.api.preview_sync(self.project_dir, [])
        self.assertEqual(preview["summary"]["preserve"], 1)

        result = self.api.sync_skills(self.project_dir, [])
        self.assertTrue(result["ok"])
        self.assertEqual(read_text(target), "# Project customization\n")
        project = self.api.get_projects()[0]
        self.assertEqual(project["enabled_skills"], [])

    def test_conflict_requires_explicit_confirmation(self):
        write_text(self.skill_path("alpha.md"), "# Global\n")
        target = self.project_path(".agent/skills/alpha.md")
        write_text(target, "# Project\n")

        preview = self.api.preview_sync(self.project_dir, ["alpha.md"])
        self.assertEqual(preview["summary"]["conflict"], 1)

        blocked = self.api.sync_skills(self.project_dir, ["alpha.md"])
        self.assertTrue(blocked["requires_confirmation"])
        self.assertEqual(read_text(target), "# Project\n")

        applied = self.api.sync_skills(self.project_dir, ["alpha.md"], True)
        self.assertTrue(applied["ok"])
        self.assertEqual(read_text(target), "# Global\n")

    def test_changed_plan_requires_a_fresh_confirmation(self):
        write_text(self.skill_path("alpha.md"), "# Version 1\n")
        preview = self.api.preview_sync(self.project_dir, ["alpha.md"])
        write_text(self.skill_path("alpha.md"), "# Version 2\n")

        result = self.api.sync_skills(
            self.project_dir,
            ["alpha.md"],
            False,
            preview["plan_token"],
        )

        self.assertTrue(result["requires_confirmation"])
        self.assertTrue(result["plan_changed"])
        self.assertNotEqual(result["preview"]["plan_token"], preview["plan_token"])

    def test_agents_managed_section_preserves_user_content(self):
        write_text(self.skill_path("alpha.md"), "# Alpha\n")
        agents_path = self.project_path("AGENTS.md")
        write_text(agents_path, "# Project notes\n\nKeep this paragraph.\n")

        self.api.sync_skills(self.project_dir, ["alpha.md"])
        first = read_text(agents_path)
        self.assertIn("# Project notes", first)
        self.assertIn("Keep this paragraph.", first)
        self.assertIn("<!-- AI_SKILL_HUB:START -->", first)
        self.assertIn(".agent/skills/alpha.md", first)

        write_text(agents_path, first + "\nManual footer.\n")
        self.api.sync_skills(self.project_dir, ["alpha.md"])
        second = read_text(agents_path)
        self.assertEqual(second.count("<!-- AI_SKILL_HUB:START -->"), 1)
        self.assertIn("Manual footer.", second)

    def test_last_sync_can_be_undone(self):
        write_text(self.skill_path("alpha.md"), "# Version 1\n")
        self.api.sync_skills(self.project_dir, ["alpha.md"])
        target = self.project_path(".agent/skills/alpha.md")

        write_text(self.skill_path("alpha.md"), "# Version 2\n")
        self.api.sync_skills(self.project_dir, ["alpha.md"])
        self.assertEqual(read_text(target), "# Version 2\n")

        result = self.api.undo_last_sync(self.project_dir)
        self.assertTrue(result["ok"])
        self.assertGreaterEqual(result["restored_count"], 1)
        self.assertEqual(read_text(target), "# Version 1\n")

    def test_undo_skips_files_edited_after_sync(self):
        write_text(self.skill_path("alpha.md"), "# Alpha\n")
        self.api.sync_skills(self.project_dir, ["alpha.md"])
        target = self.project_path(".agent/skills/alpha.md")
        write_text(target, "# Edited after sync\n")

        result = self.api.undo_last_sync(self.project_dir)
        self.assertTrue(result["ok"])
        self.assertIn(".agent/skills/alpha.md", result["skipped"])
        self.assertEqual(read_text(target), "# Edited after sync\n")

    def test_failed_sync_rolls_back_already_written_files(self):
        write_text(self.skill_path("alpha.md"), "# Alpha\n")
        write_text(self.skill_path("beta.md"), "# Beta\n")
        original_write = self.api._write_sync_target

        def fail_on_beta(target, spec):
            if spec["path"].endswith("beta.md"):
                raise OSError("simulated write failure")
            original_write(target, spec)

        self.api._write_sync_target = fail_on_beta
        result = self.api.sync_skills(self.project_dir, ["alpha.md", "beta.md"])

        self.assertIn("simulated write failure", result["error"])
        self.assertFalse(os.path.exists(self.project_path(".agent/skills/alpha.md")))
        self.assertFalse(os.path.exists(self.project_path(".agent/skills/beta.md")))
        self.assertFalse(os.path.exists(self.project_path("AGENTS.md")))


if __name__ == "__main__":
    unittest.main()
