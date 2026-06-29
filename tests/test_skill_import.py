import json
import os
import tempfile
import unittest
import zipfile
from unittest.mock import Mock, patch

from main import Api, get_default_skills_dir, scan_skill_text, seed_original_skills


def write_text(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)


class SkillImportTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = self.temp_dir.name
        self.skills_dir = os.path.join(self.root, "skills")
        self.sources_dir = os.path.join(self.root, "downloads")
        self.project_dir = os.path.join(self.root, "project")
        os.makedirs(self.skills_dir)
        os.makedirs(self.sources_dir)
        os.makedirs(self.project_dir)

        self.api = Api()
        self.api.skills_dir = self.skills_dir
        self.api.projects = [{"name": "project", "path": self.project_dir}]
        self.api.language = "zh"
        self.api.deepseek_api_key = ""
        self.api.ai_import_optimization = False

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_markdown_import_works_without_ai_and_preserves_upstream(self):
        source = os.path.join(self.sources_dir, "review.md")
        write_text(source, "# 代码审查\n\n检查错误处理和测试覆盖。\n")

        preview = self.api.preview_skill_import(source)
        self.assertTrue(preview["ok"])
        self.assertTrue(preview["can_import"])
        self.assertFalse(preview["ai_required"])
        self.assertFalse(preview["ai_used"])
        self.assertIn("added_frontmatter", preview["changes"])

        result = self.api.apply_skill_import(preview["token"])
        self.assertTrue(result["ok"])
        self.assertFalse(result["ai_used"])

        active = os.path.join(self.skills_dir, result["filename"])
        with open(active, "r", encoding="utf-8") as handle:
            content = handle.read()
        self.assertIn("title: 代码审查", content)
        self.assertIn("description: 检查错误处理和测试覆盖。", content)

        catalog_path = os.path.join(
            self.skills_dir, ".skill-hub", "imports", "catalog.json"
        )
        with open(catalog_path, "r", encoding="utf-8") as handle:
            catalog = json.load(handle)
        self.assertEqual(catalog["imports"][0]["active_name"], result["filename"])
        self.assertFalse(catalog["imports"][0]["ai_used"])

        upstream = os.path.join(
            self.skills_dir,
            ".skill-hub",
            "imports",
            "upstream",
            preview["token"],
            "review.md",
        )
        self.assertTrue(os.path.isfile(upstream))
        self.assertEqual([skill["filename"] for skill in self.api.get_skills()], ["review.md"])

    def test_exact_duplicate_is_detected_after_normalization(self):
        source = os.path.join(self.sources_dir, "review.md")
        write_text(source, "# Review\n\nCheck behavior.\n")
        first = self.api.preview_skill_import(source)
        self.assertTrue(self.api.apply_skill_import(first["token"])["ok"])

        duplicate = self.api.preview_skill_import(source)
        self.assertFalse(duplicate["can_import"])
        self.assertEqual(duplicate["duplicate_of"], "review.md")
        self.assertTrue(self.api.discard_skill_import(duplicate["token"])["ok"])
        pending = os.path.join(
            self.skills_dir,
            ".skill-hub",
            "imports",
            "pending",
            duplicate["token"],
        )
        self.assertFalse(os.path.exists(pending))

    def test_name_collision_uses_suffix_without_overwriting(self):
        first_source = os.path.join(self.sources_dir, "first", "review.md")
        second_source = os.path.join(self.sources_dir, "second", "review.md")
        write_text(first_source, "# First\n\nFirst behavior.\n")
        write_text(second_source, "# Second\n\nSecond behavior.\n")

        first = self.api.preview_skill_import(first_source)
        self.assertTrue(self.api.apply_skill_import(first["token"])["ok"])
        second = self.api.preview_skill_import(second_source)
        self.assertEqual(second["active_name"], "review-2.md")
        self.assertTrue(self.api.apply_skill_import(second["token"])["ok"])
        self.assertTrue(os.path.isfile(os.path.join(self.skills_dir, "review.md")))
        self.assertTrue(os.path.isfile(os.path.join(self.skills_dir, "review-2.md")))

    def test_standard_skill_folder_syncs_under_agent_skills(self):
        source = os.path.join(self.sources_dir, "lint-skill")
        write_text(
            os.path.join(source, "SKILL.md"),
            "---\nname: lint-skill\ndescription: Run the project linter.\n---\n\n# Lint\n",
        )
        write_text(os.path.join(source, "scripts", "check.py"), "print('ok')\n")

        preview = self.api.preview_skill_import(source)
        self.assertEqual(preview["kind"], "standard")
        self.assertTrue(self.api.apply_skill_import(preview["token"])["ok"])

        skill = self.api.get_skills()[0]
        self.assertEqual(skill["filename"], "lint-skill")
        self.assertEqual(skill["folder_kind"], "standard")

        sync = self.api.sync_skills(self.project_dir, ["lint-skill"])
        self.assertTrue(sync["ok"])
        self.assertTrue(os.path.isfile(os.path.join(
            self.project_dir, ".agent", "skills", "lint-skill", "SKILL.md"
        )))
        self.assertTrue(os.path.isfile(os.path.join(
            self.project_dir, ".agent", "skills", "lint-skill", "scripts", "check.py"
        )))
        self.assertFalse(os.path.exists(os.path.join(self.project_dir, "SKILL.md")))
        with open(os.path.join(self.project_dir, "AGENTS.md"), "r", encoding="utf-8") as handle:
            agents_content = handle.read()
        self.assertIn(
            ".agent/skills/lint-skill/SKILL.md",
            agents_content,
        )
        self.assertEqual(
            self.api.get_projects()[0]["skills_status"]["lint-skill"],
            "synced",
        )

    def test_standard_skill_folded_description_is_shown_in_library(self):
        skill_dir = os.path.join(self.skills_dir, "ponytail")
        write_text(
            os.path.join(skill_dir, "SKILL.md"),
            (
                "---\n"
                "name: ponytail\n"
                "description: >\n"
                "  Prefer the smallest effective solution.\n"
                "  Use the standard library first.\n"
                "---\n\n"
                "# Ponytail\n"
            ),
        )

        skill = self.api.get_skills()[0]
        self.assertEqual(
            skill["description"],
            "Prefer the smallest effective solution. Use the standard library first.",
        )

    def test_standard_skill_collection_installs_children_and_skips_duplicate(self):
        main_content = (
            "---\n"
            "name: ponytail\n"
            "description: Prefer the smallest effective solution.\n"
            "---\n\n"
            "# Ponytail\n"
        )
        existing = os.path.join(self.sources_dir, "single-ponytail")
        write_text(os.path.join(existing, "SKILL.md"), main_content)
        first = self.api.preview_skill_import(existing)
        self.assertTrue(self.api.apply_skill_import(first["token"])["ok"])

        repository = os.path.join(self.sources_dir, "ponytail-repository")
        write_text(os.path.join(repository, "README.md"), "# Ponytail repository\n")
        write_text(os.path.join(repository, "hooks", "startup.js"), "throw new Error('not run');\n")
        write_text(
            os.path.join(repository, "skills", "ponytail", "SKILL.md"),
            main_content,
        )
        write_text(
            os.path.join(repository, "skills", "ponytail-review", "SKILL.md"),
            (
                "---\n"
                "name: ponytail-review\n"
                "description: Review a diff for unnecessary complexity.\n"
                "---\n\n"
                "# Ponytail Review\n"
            ),
        )

        preview = self.api.preview_skill_import(repository)
        self.assertEqual(preview["kind"], "collection")
        self.assertEqual(preview["collection_count"], 2)
        self.assertEqual(preview["installable_count"], 1)
        self.assertEqual(preview["duplicate_count"], 1)
        self.assertEqual(preview["active_names"], ["ponytail-review"])
        self.assertTrue(preview["can_import"])

        result = self.api.apply_skill_import(preview["token"])
        self.assertTrue(result["ok"])
        self.assertEqual(result["filenames"], ["ponytail-review"])
        self.assertEqual(result["skipped_duplicates"], ["ponytail"])
        self.assertTrue(os.path.isfile(os.path.join(
            self.skills_dir,
            "ponytail-review",
            "SKILL.md",
        )))
        self.assertFalse(os.path.exists(os.path.join(
            self.skills_dir,
            "ponytail-review",
            "hooks",
            "startup.js",
        )))
        archived_hook = os.path.join(
            self.skills_dir,
            ".skill-hub",
            "imports",
            "upstream",
            preview["token"],
            "ponytail-repository",
            "hooks",
            "startup.js",
        )
        self.assertTrue(os.path.isfile(archived_hook))

        installed = {
            skill["filename"]: skill
            for skill in self.api.get_skills()
            if skill["filename"].startswith("ponytail")
        }
        self.assertEqual(
            installed["ponytail"]["collection"]["id"],
            "ponytail",
        )
        self.assertEqual(
            installed["ponytail-review"]["collection"]["id"],
            "ponytail",
        )
        self.assertTrue(
            installed["ponytail-review"]["collection"]["enabled"]
        )

        disabled = self.api.set_collection_member_enabled(
            "ponytail",
            "ponytail-review",
            False,
        )
        self.assertTrue(disabled["ok"])
        self.assertFalse(disabled["enabled"])

        sync = self.api.sync_skills(
            self.project_dir,
            ["ponytail", "ponytail-review"],
        )
        self.assertTrue(sync["ok"])
        self.assertTrue(os.path.isdir(os.path.join(
            self.project_dir,
            ".agent",
            "skills",
            "ponytail",
        )))
        self.assertFalse(os.path.exists(os.path.join(
            self.project_dir,
            ".agent",
            "skills",
            "ponytail-review",
        )))

    def test_zip_path_traversal_is_rejected(self):
        archive = os.path.join(self.sources_dir, "unsafe.zip")
        with zipfile.ZipFile(archive, "w") as handle:
            handle.writestr("../outside.md", "# Unsafe\n")

        preview = self.api.preview_skill_import(archive)
        self.assertIn("unsafe path", preview["error"].lower())
        self.assertFalse(os.path.exists(os.path.join(self.root, "outside.md")))

    def test_single_skill_md_uses_frontmatter_name(self):
        source = os.path.join(self.sources_dir, "SKILL.md")
        write_text(
            source,
            "---\nname: release-helper\ndescription: Prepare a release.\n---\n\n# Release\n",
        )
        preview = self.api.preview_skill_import(source)
        self.assertEqual(preview["active_name"], "release-helper.md")
        self.assertTrue(preview["can_import"])

    def test_ai_toggle_without_key_falls_back_to_local_import(self):
        self.api.ai_import_optimization = True
        source = os.path.join(self.sources_dir, "review.md")
        write_text(source, "# Review\n\nCheck behavior.\n")

        preview = self.api.preview_skill_import(source)
        self.assertTrue(preview["can_import"])
        self.assertTrue(preview["ai_requested"])
        self.assertFalse(preview["ai_used"])
        self.assertTrue(any(
            finding["code"] == "ai_optimization_fallback"
            for finding in preview["findings"]
        ))

    def test_safety_scan_does_not_flag_prohibitions_as_sensitive_logging(self):
        safe = scan_skill_text(
            "- 不记录凭据、完整请求、cookie、会话或秘密。\n"
            "- Never log authorization headers or session IDs.\n"
        )
        self.assertNotIn(
            "sensitive_logging",
            {finding["code"] for finding in safe},
        )

        unsafe = scan_skill_text(
            "记录完整请求 body 和 cookie，便于后续诊断。"
        )
        self.assertIn(
            "sensitive_logging",
            {finding["code"] for finding in unsafe},
        )

    def test_ai_toggle_uses_configured_api_for_optional_optimization(self):
        self.api.ai_import_optimization = True
        self.api.deepseek_api_key = "sk-test-key"
        source = os.path.join(self.sources_dir, "review.md")
        write_text(source, "# Review\n\nCheck behavior.\n")
        response = Mock()
        response.status_code = 200
        response.json.return_value = {
            "choices": [{
                "message": {
                    "content": (
                        "---\n"
                        "title: AI Review\n"
                        "emoji: 🔍\n"
                        "category: 工程质量\n"
                        "tags: Review, 安全\n"
                        "description: 仅在用户要求代码审查时使用。\n"
                        "---\n\n"
                        "# AI Review\n\n检查行为和安全边界。\n"
                    )
                }
            }]
        }

        with patch("main.requests.post", return_value=response) as post:
            preview = self.api.preview_skill_import(source)

        self.assertTrue(preview["ai_requested"])
        self.assertTrue(preview["ai_used"])
        self.assertIn("ai_optimized", preview["changes"])
        post.assert_called_once()

    def test_api_configuration_exposes_status_without_returning_secret(self):
        self.api.deepseek_api_key = "sk-example-12345678"
        self.api.ai_import_optimization = True
        config = self.api.get_config()
        self.assertTrue(config["has_ai_key"])
        self.assertEqual(config["api_key_hint"], "••••5678")
        self.assertEqual(config["deepseek_api_key"], "***")
        self.assertNotIn("sk-example", json.dumps(config, ensure_ascii=False))
        self.api._save_config = Mock()
        result = self.api.save_settings({"ai_import_optimization": False})
        self.assertFalse(result["ai_import_optimization"])

    def test_existing_library_becomes_baseline_and_new_copy_is_detected(self):
        write_text(os.path.join(self.skills_dir, "existing.md"), "# Existing\n")
        baseline = self.api.scan_unregistered_skills()
        self.assertTrue(baseline["initialized"])
        self.assertEqual(baseline["skills"], [])

        write_text(os.path.join(self.skills_dir, "downloaded.md"), "# Downloaded\n")
        scan = self.api.scan_unregistered_skills()
        self.assertEqual(
            [item["filename"] for item in scan["skills"]],
            ["downloaded.md"],
        )
        self.assertTrue(
            self.api.acknowledge_unregistered_skill("downloaded.md")["ok"]
        )
        self.assertEqual(self.api.scan_unregistered_skills()["skills"], [])

    def test_direct_copy_can_be_optimized_in_place_with_original_archived(self):
        self.api.scan_unregistered_skills()
        direct = os.path.join(self.skills_dir, "downloaded.md")
        original = "# Downloaded\n\nCheck the project.\n"
        write_text(direct, original)

        preview = self.api.preview_unregistered_skill("downloaded.md")
        self.assertTrue(preview["can_import"])
        self.assertEqual(preview["replace_existing"], "downloaded.md")
        self.assertEqual(preview["active_name"], "downloaded.md")

        result = self.api.apply_skill_import(preview["token"])
        self.assertTrue(result["ok"])
        self.assertTrue(result["replaced_existing"])
        with open(direct, "r", encoding="utf-8") as handle:
            adapted = handle.read()
        self.assertIn("title: Downloaded", adapted)
        self.assertIn("# Downloaded", adapted)

        archived = os.path.join(
            self.skills_dir,
            ".skill-hub",
            "imports",
            "upstream",
            preview["token"],
            "downloaded.md",
        )
        with open(archived, "r", encoding="utf-8") as handle:
            self.assertEqual(handle.read(), original)
        self.assertEqual(self.api.scan_unregistered_skills()["skills"], [])

    def test_direct_copy_changed_after_preview_is_not_overwritten(self):
        self.api.scan_unregistered_skills()
        direct = os.path.join(self.skills_dir, "downloaded.md")
        write_text(direct, "# First\n")
        preview = self.api.preview_unregistered_skill("downloaded.md")
        write_text(direct, "# Changed after preview\n")

        result = self.api.apply_skill_import(preview["token"])
        self.assertTrue(result["requires_repreview"])
        with open(direct, "r", encoding="utf-8") as handle:
            self.assertEqual(handle.read(), "# Changed after preview\n")

    def test_bundle_reports_runtime_and_source_collisions(self):
        write_text(
            os.path.join(self.skills_dir, "handoff.md"),
            "---\ntitle: Existing\n---\n\n# Existing\n",
        )
        source = os.path.join(self.sources_dir, "bundle")
        write_text(os.path.join(source, "README.md"), "# Bundle\n")
        write_text(os.path.join(source, "AGENTS.md"), "# Rules\n")
        write_text(os.path.join(source, "docs", "plans", "task.md"), "# Task\n")
        write_text(
            os.path.join(source, ".agent", "skills", "handoff.md"),
            "# Bundled handoff\n",
        )

        preview = self.api.preview_skill_import(source)
        codes = {finding["code"] for finding in preview["findings"]}
        self.assertIn("bundle_agents_ignored", codes)
        self.assertIn("bundled_runtime_task", codes)
        self.assertIn("bundled_source_collision", codes)


class DefaultSkillSeedTests(unittest.TestCase):
    def test_default_runtime_library_lives_outside_the_application_directory(self):
        with patch.dict(
            os.environ,
            {"LOCALAPPDATA": os.path.join("C:\\", "Users", "tester", "AppData", "Local")},
        ):
            self.assertEqual(
                get_default_skills_dir(),
                os.path.join(
                    "C:\\",
                    "Users",
                    "tester",
                    "AppData",
                    "Local",
                    "SkillHub",
                    "skills",
                ),
            )

    def test_defaults_seed_only_an_empty_library(self):
        with tempfile.TemporaryDirectory() as root:
            source = os.path.join(root, "defaults")
            destination = os.path.join(root, "skills")
            write_text(os.path.join(source, "alpha.md"), "# Alpha\n")
            write_text(os.path.join(source, "workflow", "SKILL.md"), "# Workflow\n")

            self.assertEqual(seed_original_skills(source, destination), 2)
            self.assertTrue(os.path.isfile(os.path.join(destination, "alpha.md")))
            self.assertTrue(os.path.isfile(os.path.join(
                destination, "workflow", "SKILL.md"
            )))

            write_text(os.path.join(source, "beta.md"), "# Beta\n")
            self.assertEqual(seed_original_skills(source, destination), 0)
            self.assertFalse(os.path.exists(os.path.join(destination, "beta.md")))

    def test_seed_locally_adapts_original_bundle_without_ai(self):
        with tempfile.TemporaryDirectory() as root:
            source = os.path.join(root, "originals")
            destination = os.path.join(root, "active")
            write_text(os.path.join(source, "handoff.md"), "# Handoff\n")
            bundle = os.path.join(source, "workflow")
            write_text(os.path.join(bundle, "README.md"), "# Workflow\n")
            write_text(os.path.join(bundle, "AGENTS.md"), "# Runtime rules\n")
            write_text(os.path.join(bundle, "docs", "plans", "task.md"), "# Runtime task\n")
            write_text(
                os.path.join(bundle, ".agent", "skills", "handoff.md"),
                "# Duplicate handoff\n",
            )
            write_text(
                os.path.join(bundle, ".agent", "skills", "planning.md"),
                "# Planning\n",
            )

            self.assertEqual(seed_original_skills(source, destination), 2)
            with open(
                os.path.join(destination, "handoff.md"),
                "r",
                encoding="utf-8",
            ) as handle:
                self.assertTrue(handle.read().startswith("---\n"))
            self.assertFalse(os.path.exists(
                os.path.join(destination, "workflow", "AGENTS.md")
            ))
            self.assertFalse(os.path.exists(
                os.path.join(destination, "workflow", "docs", "plans", "task.md")
            ))
            self.assertFalse(os.path.exists(os.path.join(
                destination,
                "workflow",
                ".agent",
                "skills",
                "handoff.md",
            )))
            self.assertTrue(os.path.isfile(os.path.join(
                destination,
                "workflow",
                ".agent",
                "skills",
                "planning.md",
            )))


if __name__ == "__main__":
    unittest.main()
