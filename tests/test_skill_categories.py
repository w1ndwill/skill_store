import tempfile
import unittest
from pathlib import Path

import yaml

from skillhub.domain.catalog import parse_markdown_metadata
from skillhub.domain.frontmatter import (
    get_markdown_frontmatter_category,
    set_markdown_frontmatter_category,
    split_markdown_frontmatter_source,
)
from skillhub.domain.metadata import infer_skill_metadata


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    "---\nname: aliyun-ssh\ndescription: SSH connection.\n"
    "metadata:\n  category: 工程效率 # display category\n"
    "  owner: keep-me\nother:\n  category: unrelated\n"
    "---\n\n# SSH\n\nKeep the body exactly.\n"
)


class SkillCategoryTests(unittest.TestCase):
    def test_catalog_and_import_inference_read_nested_category(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            path = Path(directory) / "SKILL.md"
            path.write_text(SOURCE, encoding="utf-8")
            self.assertEqual(parse_markdown_metadata(str(path))["category"], "工程效率")
        self.assertEqual(infer_skill_metadata(SOURCE, "aliyun-ssh")["category"], "工程效率")

    def test_edit_and_clear_preserve_other_metadata_and_body(self):
        updated = set_markdown_frontmatter_category(SOURCE, "工程质量")
        self.assertEqual(get_markdown_frontmatter_category(updated), "工程质量")
        self.assertEqual(updated, SOURCE.replace("工程效率", '"工程质量"'))
        cleared = set_markdown_frontmatter_category(updated, "")
        self.assertEqual(get_markdown_frontmatter_category(cleared), "")
        self.assertIn("  owner: keep-me\nother:\n  category: unrelated\n", cleared)
        self.assertEqual(
            split_markdown_frontmatter_source(cleared)[1],
            split_markdown_frontmatter_source(SOURCE)[1],
        )

    def test_legacy_precedence_and_clear_prevent_stale_nested_fallback(self):
        source = SOURCE.replace("metadata:", "category: Legacy\nmetadata:")
        self.assertEqual(get_markdown_frontmatter_category(source), "Legacy")
        updated = set_markdown_frontmatter_category(source, "New")
        raw = split_markdown_frontmatter_source(updated)[0]
        document = yaml.safe_load(raw)
        self.assertEqual(document["category"], "New")
        self.assertEqual(document["metadata"]["category"], "New")
        self.assertEqual(get_markdown_frontmatter_category(set_markdown_frontmatter_category(updated, "")), "")

    def test_unrelated_nested_fields_and_nonstring_values_are_not_categories(self):
        for raw in (
            "other:\n  category: Wrong\n",
            "metadata:\n  other:\n    category: Wrong\n",
            "metadata:\n  category: [Wrong]\n",
        ):
            with self.subTest(raw=raw):
                self.assertEqual(get_markdown_frontmatter_category(f"---\n{raw}---\n"), "")

    def test_flow_metadata_can_be_read_changed_and_cleared(self):
        for raw in (
            'metadata: {category: "工程效率", owner: keep}\n',
            'metadata: {owner: keep, category: "工程效率"}\n',
            'metadata: {category: "工程效率"}\n',
        ):
            with self.subTest(raw=raw):
                source = f"---\n{raw}---\n\nBody\n"
                self.assertEqual(get_markdown_frontmatter_category(source), "工程效率")
                self.assertEqual(get_markdown_frontmatter_category(set_markdown_frontmatter_category(source, "工程质量")), "工程质量")
                cleared = set_markdown_frontmatter_category(source, "")
                document = yaml.safe_load(split_markdown_frontmatter_source(cleared)[0])
                self.assertNotIn("category", document["metadata"])
                if "owner" in raw:
                    self.assertEqual(document["metadata"]["owner"], "keep")

    def test_bom_crlf_and_multiline_category_keep_valid_yaml(self):
        source = "\ufeff" + SOURCE.replace("category: 工程效率 # display category", "category: >-\n    工程效率").replace("\n", "\r\n")
        updated = set_markdown_frontmatter_category(source, "Quality: review")
        self.assertEqual(get_markdown_frontmatter_category(updated), "Quality: review")
        self.assertTrue(updated.startswith("\ufeff---\r\n"))
        self.assertNotIn("\n", updated.replace("\r\n", ""))
        self.assertIn("  owner: keep-me\r\n", updated)

    def test_invalid_yaml_is_not_silently_rewritten(self):
        with self.assertRaisesRegex(ValueError, "Invalid Skill frontmatter"):
            set_markdown_frontmatter_category("---\nmetadata: [broken\n---\nBody", "New")


if __name__ == "__main__":
    unittest.main()
