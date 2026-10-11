"""Batch and individual invocation edits preserve package sources and rollback."""
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import yaml
from main import Api
from skillhub.infrastructure.filesystem import atomic_write_text


class CollectionInvocationPolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1])
        self.root = Path(self.temp.name)
        self.api = object.__new__(Api)
        self.api.skills_dir = str(self.root)
        self.api.language = "zh"
        self.names = ["nature-alpha", "nature-beta"]
        self.sources = {}
        for name in self.names:
            root = self.root / name
            (root / "agents").mkdir(parents=True)
            (root / "SKILL.md").write_text(f"---\nname: {name}\ndescription: Research.\n---\n# Keep body\n", encoding="utf-8")
            content = "# Keep comment\ninterface:\n  display_name: Research\n  brand_color: '#123456'\ndependencies:\n  tools:\n    - type: mcp\n      value: zotero\n      custom: keep\npolicy:\n  custom: keep\n  allow_implicit_invocation: true # Keep inline\nextra: untouched\n"
            (root / "agents" / "openai.yaml").write_text(content, encoding="utf-8")
            self.sources[name] = (root / "SKILL.md").read_bytes()

    def tearDown(self):
        self.temp.cleanup()

    def path(self, name):
        return self.root / name / "agents" / "openai.yaml"

    def versions(self):
        result = self.api.get_skills_invocation_policy(self.names)
        self.assertTrue(all(item["supported"] for item in result["items"]))
        return {item["filename"]: item["version"] for item in result["items"]}

    def test_batch_edit_preserves_everything_except_the_requested_value(self):
        before = {name: self.path(name).read_text(encoding="utf-8") for name in self.names}
        result = self.api.set_skills_invocation_policy(self.names, False, self.versions())
        self.assertEqual(result["updated"], self.names)
        for name in self.names:
            self.assertEqual(self.path(name).read_text(encoding="utf-8"), before[name].replace('allow_implicit_invocation: true', 'allow_implicit_invocation: false'))
            self.assertEqual((self.root / name / 'SKILL.md').read_bytes(), self.sources[name])
        states = self.api.get_skills_invocation_policy(self.names)["items"]
        self.assertTrue(all(not item["allow_implicit_invocation"] for item in states))

    def test_one_member_can_override_the_bulk_policy(self):
        self.api.set_skills_invocation_policy(self.names, False, self.versions())
        result = self.api.set_skills_invocation_policy([self.names[0]], True, self.versions())
        self.assertEqual(result["updated"], [self.names[0]])
        values = [item["allow_implicit_invocation"] for item in self.api.get_skills_invocation_policy(self.names)["items"]]
        self.assertEqual(values, [True, False])

    def test_stale_member_version_blocks_the_entire_batch(self):
        versions = self.versions()
        self.path(self.names[1]).write_text('policy:\n  allow_implicit_invocation: false\n', encoding="utf-8")
        before = {name: self.path(name).read_bytes() for name in self.names}
        result = self.api.set_skills_invocation_policy(self.names, False, versions)
        self.assertTrue(result["conflict"])
        self.assertEqual(before, {name: self.path(name).read_bytes() for name in self.names})

    def test_write_failure_rolls_back_both_metadata_and_registry(self):
        versions = self.versions()
        before = {name: self.path(name).read_bytes() for name in self.names}
        calls = 0
        def write(path, text):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError('synthetic disk failure')
            return atomic_write_text(path, text)
        with mock.patch('skillhub.presentation.api.skill_editor.atomic_write_text', side_effect=write):
            result = self.api.set_skills_invocation_policy(self.names, False, versions)
        self.assertTrue(result["rolled_back"])
        self.assertEqual(before, {name: self.path(name).read_bytes() for name in self.names})
        self.assertFalse((self.root / '.skill-hub' / 'library-index.json').exists())

    def test_missing_metadata_is_created_without_touching_markdown(self):
        self.path(self.names[0]).unlink()
        result = self.api.set_skills_invocation_policy([self.names[0]], False, self.versions())
        self.assertTrue(result["ok"])
        self.assertEqual(yaml.safe_load(self.path(self.names[0]).read_text()), {'policy': {'allow_implicit_invocation': False}})

    def test_flow_and_block_policies_retain_other_fields_and_newlines(self):
        examples = ['policy: {custom: keep}\n', 'policy:\n  custom: keep\ninterface:\n  display_name: Keep\n', 'policy: null\n', 'interface:\r\n  display_name: Keep\r\n']
        for content in examples:
            with self.subTest(content=content):
                result = self.api._render_invocation_policy(content, False)
                self.assertFalse(yaml.safe_load(result)['policy']['allow_implicit_invocation'])
                if 'custom' in content:
                    self.assertEqual(yaml.safe_load(result)['policy']['custom'], 'keep')
                if '\r\n' in content:
                    self.assertNotIn('\n', result.replace('\r\n', ''))

    def test_aliased_policy_is_rejected_without_editing_shared_values(self):
        with self.assertRaises(ValueError):
            self.api._render_invocation_policy('base: &p {allow_implicit_invocation: true}\npolicy: *p\n', False)

    def editor(self):
        self.api._save_skill_collections({'version': 1, 'collections': [{'id': 'nature-test', 'members': self.names, 'enabled_members': self.names}]})
        return self.api.get_collection_editor_data('nature-test')

    def save_editor(self, loaded, **changes):
        changes['expected_versions'] = {item['filename']: item['version'] for item in loaded['items']}
        return self.api.save_collection_editor_data('nature-test', changes, loaded['collection_version'])

    def test_shared_rules_are_applied_updated_and_removed_without_replacing_member_bodies(self):
        loaded = self.editor()
        self.assertTrue(self.save_editor(loaded, shared_rules='Use Chinese and cite sources.')['ok'])
        for name in self.names:
            content=(self.root/name/'SKILL.md').read_text(encoding='utf-8')
            self.assertTrue((self.root/name/'SKILL.md').read_bytes().startswith(self.sources[name]))
            self.assertIn('Use Chinese and cite sources.', content)
        loaded=self.api.get_collection_editor_data('nature-test')
        self.assertEqual(loaded['shared_rules'],'Use Chinese and cite sources.')
        self.assertTrue(self.save_editor(loaded, shared_rules='Cite verified sources.')['ok'])
        for name in self.names:
            content=(self.root/name/'SKILL.md').read_text(encoding='utf-8')
            self.assertEqual(content.count(':START -->'),1)
            self.assertNotIn('Use Chinese',content)
        loaded=self.api.get_collection_editor_data('nature-test')
        self.assertTrue(self.save_editor(loaded, shared_rules='')['ok'])
        for name in self.names:
            self.assertNotIn('SKILLHUB:COLLECTION_RULES', (self.root/name/'SKILL.md').read_text())

    def test_collection_save_combines_policy_document_and_shared_rules_atomically(self):
        loaded=self.editor()
        result=self.save_editor(loaded, policies={self.names[0]:False}, documents={self.names[1]:'# Custom member\n'}, shared_rules='Verify claims.')
        self.assertTrue(result['ok'])
        self.assertFalse(yaml.safe_load(self.path(self.names[0]).read_text())['policy']['allow_implicit_invocation'])
        content=(self.root/self.names[1]/'SKILL.md').read_text()
        self.assertTrue(content.startswith('# Custom member\n'))
        self.assertIn('Verify claims.',content)

    def test_shared_rule_write_failure_restores_documents_and_collection_state(self):
        loaded=self.editor()
        before={name:(self.root/name/'SKILL.md').read_bytes() for name in self.names}
        calls=0
        def write(path,text):
            nonlocal calls
            calls+=1
            if calls==2: raise OSError('synthetic rule write failure')
            atomic_write_text(path,text)
        with mock.patch('skillhub.presentation.api.skill_editor.atomic_write_text',side_effect=write):
            result=self.save_editor(loaded,shared_rules='Do not lose the originals.')
        self.assertTrue(result['rolled_back'])
        self.assertEqual(before,{name:(self.root/name/'SKILL.md').read_bytes() for name in self.names})
        self.assertEqual(self.api.get_collection_editor_data('nature-test')['shared_rules'],'')

    def test_changed_collection_membership_or_member_source_blocks_stale_shared_rules(self):
        loaded=self.editor()
        (self.root/self.names[1]/'SKILL.md').write_text('# External change\n')
        result=self.save_editor(loaded,shared_rules='Should not be applied.')
        self.assertTrue(result['conflict'])
        self.assertEqual((self.root/self.names[0]/'SKILL.md').read_bytes(),self.sources[self.names[0]])
        state=self.api._load_skill_collections();state['collections'][0]['members']=[self.names[0]];self.api._save_skill_collections(state)
        result=self.save_editor(loaded,policies={self.names[0]:False})
        self.assertTrue(result['conflict'])


if __name__ == '__main__':
    unittest.main()
