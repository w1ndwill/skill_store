"""First-class editing for SKILL.md and usage-affecting OpenAI metadata."""

import os
import re
import hashlib
import difflib
import uuid
from skillhub.settings import USER_DATA_DIR
from skillhub.infrastructure.filesystem import atomic_write_json
from skillhub.infrastructure.json_store import file_lock
from skillhub.infrastructure.transactions import capture_files, restore_files, persist_snapshot

import yaml

from skillhub.domain.catalog import parse_markdown_metadata
from skillhub.domain.frontmatter import (
    get_markdown_frontmatter_category,
    set_markdown_frontmatter_category,
)
from skillhub.infrastructure.filesystem import atomic_write_text, safe_real_child_path


class SkillEditorApiMixin:
    """Read, validate, and jointly save editable Skill package sources."""

    OPENAI_TOOL_FIELDS = (
        "type",
        "value",
        "description",
        "transport",
        "url",
    )

    @staticmethod
    def _collection_editor_version(collection):
        import json
        data = {key: collection.get(key) for key in ("id", "members", "shared_rules")}
        return hashlib.sha256(json.dumps(data, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()

    def get_collection_editor_data(self, collection_id):
        with file_lock(self.skills_dir):
            collection = next((item for item in self._load_skill_collections().get("collections", []) if item.get("id") == collection_id), None)
            if not collection:
                return {"error": "Collection does not exist"}
            items = []
            for name in collection.get("members", []):
                data = self._get_skill_editor_data(name)
                items.append({"filename": name, "version": data.get("version"),
                              "skill_content": data.get("skill_content", ""),
                              "editable": not bool(data.get("error")),
                              "supported": bool(data.get("openai_yaml_supported") and not data.get("openai_form_error")),
                              "allow_implicit_invocation": data.get("openai_form", {}).get("allow_implicit_invocation", True),
                              "error": data.get("error") or data.get("openai_form_error") or ""})
            return {"ok": True, "collection_version": self._collection_editor_version(collection),
                    "shared_rules": collection.get("shared_rules", ""), "items": items}

    @staticmethod
    def _apply_collection_rules(content, collection_id, rules):
        if not re.fullmatch(r"[A-Za-z0-9._-]+", collection_id or ""):
            raise ValueError("Invalid collection identifier")
        start = f"<!-- SKILLHUB:COLLECTION_RULES:{collection_id}:START -->"
        end = f"<!-- SKILLHUB:COLLECTION_RULES:{collection_id}:END -->"
        if start in rules or end in rules:
            raise ValueError("Rules cannot contain their management markers")
        if content.count(start) != content.count(end) or content.count(start) > 1:
            raise ValueError("Collection rule markers are ambiguous; repair the member first")
        newline = "\r\n" if "\r\n" in content else "\n"
        text = rules.strip().replace("\r\n", "\n").replace("\n", newline)
        block = start + newline + "## 集合共同要求" + newline * 2 + text + newline + end if text else ""
        if start in content:
            begin, finish = content.index(start), content.index(end) + len(end)
            if begin >= finish:
                raise ValueError("Invalid collection rule markers")
            return content[:begin] + block + content[finish:]
        if not block:
            return content
        separator = "" if content.endswith(newline * 2) else newline if content.endswith(newline) else newline * 2
        return content + separator + block + newline

    def save_collection_editor_data(self, collection_id, changes, collection_version):
        if not isinstance(changes, dict):
            return {"error": "Invalid collection changes"}
        policies, documents = changes.get("policies", {}), changes.get("documents", {})
        versions = changes.get("expected_versions", {})
        if not all(isinstance(value, dict) for value in (policies, documents, versions)):
            return {"error": "Invalid member settings"}
        if not all(isinstance(value, bool) for value in policies.values()) or not all(isinstance(value, str) for value in documents.values()):
            return {"error": "Policies must be boolean and documents must be text"}
        shared = changes.get("shared_rules")
        if "shared_rules" in changes and not isinstance(shared, str):
            return {"error": "Shared rules must be text"}
        with file_lock(self.skills_dir):
            state = self._load_skill_collections()
            collection = next((item for item in state.get("collections", []) if item.get("id") == collection_id), None)
            if not collection or collection_version != self._collection_editor_version(collection):
                return {"conflict": True, "error": "Collection changed; reopen the editor. Your draft is retained."}
            members = set(collection.get("members", []))
            affected = set(policies) | set(documents) | (members if shared is not None else set())
            if not affected <= members:
                return {"error": "Changes include a Skill outside this collection"}
            prepared, updated = [], []
            for name in sorted(affected):
                files = self._skill_editor_files(name)
                if not files or versions.get(name) != self._editor_version(files):
                    return {"conflict": True, "error": f"{name}: Skill changed; reopen the editor. Your draft is retained."}
                try:
                    if name in documents or shared is not None:
                        with open(files["skill_path"], encoding="utf-8", newline="") as handle:
                            original = handle.read()
                        content = documents.get(name, original)
                        if shared is not None:
                            content = self._apply_collection_rules(content, collection_id, shared)
                        if content != original:
                            prepared.append((files["skill_path"], content))
                            updated.append(name)
                    if name in policies:
                        if not files.get("openai_yaml_supported"):
                            return {"error": f"{name}: invocation policy is unsupported"}
                        target = files["openai_yaml_path"]
                        original = ""
                        if os.path.isfile(target):
                            with open(target, encoding="utf-8", newline="") as handle:
                                original = handle.read()
                        content = self._render_invocation_policy(original, policies[name])
                        if content != original:
                            prepared.append((target, content))
                            updated.append(name)
                except (OSError, ValueError, yaml.YAMLError) as error:
                    return {"error": f"{name}: {error}"}
            shared_changed = shared is not None and shared != collection.get("shared_rules", "")
            if not prepared and not shared_changed:
                return {"ok": True, "updated": []}
            snapshot = capture_files([path for path, _ in prepared] + [self._library_index_path(), self._skill_collections_path()])
            backup = os.path.join(self.skills_dir, ".skill-hub", "collection-editor-backups", uuid.uuid4().hex)
            try:
                persist_snapshot(snapshot, backup)
                for path, content in prepared:
                    atomic_write_text(path, content)
                if shared_changed:
                    collection["shared_rules"] = shared
                    self._save_skill_collections(state)
                for name in dict.fromkeys(updated):
                    self._register_library_entry(name, source="collection-editor")
            except Exception as error:
                errors = restore_files(snapshot)
                return {"error": str(error), "rolled_back": not errors, "rollback_errors": errors, "recovery_path": backup}
            return {"ok": True, "updated": list(dict.fromkeys(updated)), "backup_path": backup}

    def get_skills_invocation_policy(self, filenames):
        if not isinstance(filenames, list) or not all(isinstance(name, str) for name in filenames):
            return {"error": "Skill names must be a list of strings"}
        with file_lock(self.skills_dir):
            items = []
            for name in dict.fromkeys(filenames):
                data = self._get_skill_editor_data(name)
                error = data.get("error") or data.get("openai_form_error")
                supported = bool(data.get("openai_yaml_supported") and not error)
                items.append({"filename": name, "supported": supported,
                              "allow_implicit_invocation": data.get("openai_form", {}).get("allow_implicit_invocation", True),
                              "version": data.get("version"),
                              "error": error or ("Only standard Skill packages support invocation policy" if not supported else "")})
            return {"ok": True, "items": items}

    @classmethod
    def _render_invocation_policy(cls, content, allow_implicit):
        """Change one YAML value while retaining unrelated text and comments."""
        if not content:
            return "policy:\n  allow_implicit_invocation: " + ("true" if allow_implicit else "false") + "\n"
        error = cls._validate_openai_yaml(content)
        if error:
            raise ValueError(error)
        value = "true" if allow_implicit else "false"
        newline = "\r\n" if "\r\n" in content else "\n"
        root = yaml.compose(content)
        policy_entries = [(key, node) for key, node in root.value if key.value == "policy"] if root else []
        policies = [node for _, node in policy_entries]
        if len(policies) > 1:
            raise ValueError("Duplicate policy keys are ambiguous")
        if not policies:
            result = content.rstrip("\r\n") + (newline if content else "") + f"policy:{newline}  allow_implicit_invocation: {value}{newline}"
        else:
            policy = policies[0]
            if policy.start_mark.index < policy_entries[0][0].end_mark.index:
                raise ValueError("Aliased policy must be edited manually")
            fields = [node for key, node in policy.value if key.value == "allow_implicit_invocation"] if isinstance(policy, yaml.MappingNode) else []
            if len(fields) > 1:
                raise ValueError("Duplicate invocation policy keys are ambiguous")
            if fields:
                node = fields[0]
                if not policy.start_mark.index <= node.start_mark.index < policy.end_mark.index:
                    raise ValueError("Aliased invocation value must be edited manually")
                result = content[:node.start_mark.index] + value + content[node.end_mark.index:]
            elif isinstance(policy, yaml.MappingNode) and policy.flow_style:
                index = policy.end_mark.index - 1
                result = content[:index] + (", " if policy.value else "") + f"allow_implicit_invocation: {value}" + content[index:]
            elif isinstance(policy, yaml.MappingNode):
                index = policy.end_mark.index
                indent = policy.value[0][0].start_mark.column if policy.value else 2
                prefix = "" if not index or content[index-1] in "\r\n" else newline
                result = content[:index] + prefix + " " * indent + f"allow_implicit_invocation: {value}{newline}" + content[index:]
            else:
                result = content[:policy.start_mark.index] + f"{newline}  allow_implicit_invocation: {value}" + content[policy.end_mark.index:]
        error = cls._validate_openai_yaml(result)
        if error:
            raise ValueError(error)
        return result

    def set_skills_invocation_policy(self, filenames, allow_implicit, expected_versions):
        if not isinstance(allow_implicit, bool) or not isinstance(expected_versions, dict):
            return {"error": "Boolean policy and reviewed versions are required"}
        if not isinstance(filenames, list) or not filenames or not all(isinstance(name, str) for name in filenames):
            return {"error": "Skill names must be a non-empty list"}
        with file_lock(self.skills_dir):
            prepared = []
            for name in dict.fromkeys(filenames):
                files = self._skill_editor_files(name)
                if not files.get("openai_yaml_supported"):
                    return {"error": f"{name}: invocation policy requires a standard Skill package"}
                if expected_versions.get(name) != self._editor_version(files):
                    return {"conflict": True, "error": f"{name}: Skill changed; reload the policy settings"}
                target = files["openai_yaml_path"]
                try:
                    content = ""
                    if os.path.isfile(target):
                        with open(target, encoding="utf-8", newline="") as handle:
                            content = handle.read()
                    rendered = self._render_invocation_policy(content, allow_implicit)
                except (OSError, ValueError, yaml.YAMLError) as error:
                    return {"error": f"{name}: {error}"}
                if rendered != content:
                    prepared.append((name, target, rendered))
            if not prepared:
                return {"ok": True, "updated": []}
            snapshot = capture_files([target for _, target, _ in prepared] + [self._library_index_path()])
            backup = os.path.join(self.skills_dir, ".skill-hub", "policy-backups", uuid.uuid4().hex)
            try:
                persist_snapshot(snapshot, backup)
                for name, target, rendered in prepared:
                    atomic_write_text(target, rendered)
                    self._register_library_entry(name, source="invocation-policy")
            except Exception as error:
                rollback_errors = restore_files(snapshot)
                return {"error": str(error), "rolled_back": not rollback_errors, "rollback_errors": rollback_errors, "recovery_path": backup}
            return {"ok": True, "updated": [name for name, _, _ in prepared], "backup_path": backup}

    def _skill_editor_files(self, filename: str) -> dict:
        source = self._editable_skill_source(filename)
        skill_path = source.get("path", "")
        if not skill_path:
            return {}
        result = {
            "skill_path": skill_path,
            "openai_yaml_path": "",
            "openai_yaml_supported": False,
        }
        if os.path.basename(skill_path).casefold() != "skill.md":
            return result
        package_root = os.path.dirname(skill_path)
        metadata_path = safe_real_child_path(
            package_root,
            os.path.join("agents", "openai.yaml"),
        )
        if metadata_path:
            result["openai_yaml_path"] = metadata_path
            result["openai_yaml_supported"] = True
        return result

    def _default_openai_yaml(self, filename: str, skill_path: str) -> str:
        metadata = parse_markdown_metadata(skill_path)
        package_name = os.path.basename(os.path.dirname(skill_path))
        invocation_name = re.sub(
            r"[^a-z0-9]+",
            "-",
            package_name.casefold(),
        ).strip("-") or "skill"
        display_name = str(metadata.get("title") or package_name or filename).strip()
        description = str(metadata.get("description") or "").strip()
        prompt = (
            f"使用 ${invocation_name} 完成当前任务。"
            if self.language == "zh"
            else f"Use ${invocation_name} for the current task."
        )
        content = {
            "interface": {
                "display_name": display_name,
                "short_description": description,
                "default_prompt": prompt,
            },
            "policy": {"allow_implicit_invocation": True},
        }
        rendered = yaml.safe_dump(
            content,
            allow_unicode=True,
            sort_keys=False,
            width=1000,
        )
        return rendered + (
            "\n# Optional tool dependencies:\n"
            "# dependencies:\n"
            "#   tools:\n"
            "#     - type: mcp\n"
            "#       value: tool-name\n"
            "#       description: Explain why this tool is required.\n"
        )

    def export_editor_draft(self, filename, editor_data):
        if not isinstance(editor_data, dict) or not all(isinstance(editor_data.get(k, ""), str) for k in ("skill_content", "openai_yaml_content")):
            return {"error": "Invalid draft"}
        path = os.path.join(USER_DATA_DIR, "editor-drafts", uuid.uuid4().hex + ".json")
        try:
            atomic_write_json(path, {"filename": str(filename), "skill_content": editor_data.get("skill_content", ""), "openai_yaml_content": editor_data.get("openai_yaml_content", "")})
            return {"ok": True, "path": path}
        except OSError as error:
            return {"error": str(error)}

    def _editor_version(self, files):
        result = {}
        for key in ("skill_path", "openai_yaml_path"):
            path = files.get(key)
            result[key] = None
            if path and os.path.isfile(path):
                with open(path, "rb") as handle:
                    result[key] = hashlib.sha256(handle.read()).hexdigest()
        return result

    def get_skill_editor_data(self, filename):
        with file_lock(self.skills_dir):
            files = self._skill_editor_files(filename)
            before = self._editor_version(files)
            result = self._get_skill_editor_data(filename)
            if before != self._editor_version(files):
                return {"error": "文件在加载期间变化，请重新打开 / File changed while loading"}
            return result

    def _get_skill_editor_data(self, filename):
        files = self._skill_editor_files(filename)
        skill_path = files.get("skill_path", "")
        if not skill_path or not os.path.isfile(skill_path):
            return {"error": "File not found"}
        try:
            with open(skill_path, "r", encoding="utf-8") as handle:
                skill_content = handle.read()
            metadata_path = files.get("openai_yaml_path", "")
            metadata_exists = bool(metadata_path and os.path.isfile(metadata_path))
            if metadata_exists:
                with open(metadata_path, "r", encoding="utf-8") as handle:
                    metadata_content = handle.read()
            elif files.get("openai_yaml_supported"):
                metadata_content = self._default_openai_yaml(filename, skill_path)
            else:
                metadata_content = ""
            form_result = (
                self.parse_openai_yaml_form(metadata_content)
                if metadata_content
                else {"form": {}}
            )
            return {
                "version": self._editor_version(files),
                "skill_content": skill_content,
                "category": get_markdown_frontmatter_category(skill_content),
                "openai_yaml_content": metadata_content,
                "openai_form": form_result.get("form", {}),
                "openai_form_error": form_result.get("error", ""),
                "openai_yaml_exists": metadata_exists,
                "openai_yaml_supported": bool(
                    files.get("openai_yaml_supported")
                ),
            }
        except Exception as error:
            return {"error": str(error)}

    def render_skill_category(self, content, category):
        if not isinstance(content, str) or not isinstance(category, str):
            return {"error": "Skill content and category must be text"}
        try:
            return {"content": set_markdown_frontmatter_category(content, category)}
        except ValueError as error:
            return {"error": str(error)}

    @classmethod
    def _openai_form_from_document(cls, document: dict) -> dict:
        interface = document.get("interface") or {}
        policy = document.get("policy") or {}
        tools = (document.get("dependencies") or {}).get("tools") or []
        return {
            "display_name": str(interface.get("display_name") or ""),
            "short_description": str(interface.get("short_description") or ""),
            "default_prompt": str(interface.get("default_prompt") or ""),
            "allow_implicit_invocation": policy.get(
                "allow_implicit_invocation",
                True,
            ) is not False,
            "tools": [
                {
                    **{
                        field: str(tool.get(field) or "")
                        for field in cls.OPENAI_TOOL_FIELDS
                    },
                    "_source_index": index,
                }
                for index, tool in enumerate(tools)
                if isinstance(tool, dict)
            ],
        }

    def parse_openai_yaml_form(self, content):
        validation_error = self._validate_openai_yaml(content)
        if validation_error:
            return {"error": validation_error}
        document = yaml.safe_load(content) or {}
        return {"ok": True, "form": self._openai_form_from_document(document)}

    def render_openai_yaml_form(self, content, form_data):
        validation_error = self._validate_openai_yaml(content)
        if validation_error:
            return {"error": validation_error}
        if not isinstance(form_data, dict):
            return {"error": "Invalid OpenAI metadata form"}
        document = yaml.safe_load(content) or {}
        interface = document.setdefault("interface", {})
        policy = document.setdefault("policy", {})
        if not isinstance(interface, dict) or not isinstance(policy, dict):
            return {"error": "interface and policy must be YAML mappings"}

        for field in ("display_name", "short_description", "default_prompt"):
            value = form_data.get(field, "")
            if not isinstance(value, str):
                return {"error": f"{field} must be text"}
            if value.strip():
                interface[field] = value.strip()
            else:
                interface.pop(field, None)
        implicit = form_data.get("allow_implicit_invocation")
        if not isinstance(implicit, bool):
            return {"error": "allow_implicit_invocation must be true or false"}
        policy["allow_implicit_invocation"] = implicit

        requested_tools = form_data.get("tools", [])
        if not isinstance(requested_tools, list):
            return {"error": "tools must be a list"}
        dependencies = document.get("dependencies")
        if dependencies is None:
            dependencies = {}
        if not isinstance(dependencies, dict):
            return {"error": "dependencies must be a YAML mapping"}
        original_tools = dependencies.get("tools") or []
        rendered_tools = []
        for index, requested in enumerate(requested_tools):
            if not isinstance(requested, dict):
                return {"error": f"tools[{index}] must be an object"}
            source_index = requested.get("_source_index")
            existing = (
                dict(original_tools[source_index])
                if isinstance(source_index, int)
                and 0 <= source_index < len(original_tools)
                and isinstance(original_tools[source_index], dict)
                else {}
            )
            for field in self.OPENAI_TOOL_FIELDS:
                value = requested.get(field, "")
                if not isinstance(value, str):
                    return {"error": f"tools[{index}].{field} must be text"}
                if value.strip():
                    existing[field] = value.strip()
                else:
                    existing.pop(field, None)
            if not existing.get("type") or not existing.get("value"):
                return {"error": f"tools[{index}] requires type and value"}
            rendered_tools.append(existing)
        if rendered_tools:
            dependencies["tools"] = rendered_tools
            document["dependencies"] = dependencies
        else:
            dependencies.pop("tools", None)
            if dependencies:
                document["dependencies"] = dependencies
            else:
                document.pop("dependencies", None)

        rendered = yaml.safe_dump(
            document,
            allow_unicode=True,
            sort_keys=False,
            width=1000,
        )
        return {
            "ok": True,
            "content": rendered,
            "form": self._openai_form_from_document(document),
        }

    @staticmethod
    def _validate_openai_yaml(content: str) -> str:
        if not str(content or "").strip():
            return "agents/openai.yaml cannot be empty"
        try:
            document = yaml.safe_load(content)
        except yaml.YAMLError as error:
            return f"Invalid agents/openai.yaml: {error}"
        if not isinstance(document, dict):
            return "agents/openai.yaml must contain a YAML mapping"
        for section_name in ("interface", "policy"):
            section = document.get(section_name)
            if section is not None and not isinstance(section, dict):
                return f"{section_name} must be a YAML mapping"
        interface = document.get("interface") or {}
        for field in ("display_name", "short_description", "default_prompt"):
            value = interface.get(field)
            if value is not None and not isinstance(value, str):
                return f"interface.{field} must be a string"
        policy = document.get("policy") or {}
        implicit = policy.get("allow_implicit_invocation")
        if implicit is not None and not isinstance(implicit, bool):
            return "policy.allow_implicit_invocation must be true or false"
        dependencies = document.get("dependencies")
        if dependencies is not None and not isinstance(dependencies, dict):
            return "dependencies must be a YAML mapping"
        tools = (dependencies or {}).get("tools")
        if tools is not None:
            if not isinstance(tools, list):
                return "dependencies.tools must be a YAML list"
            for index, tool in enumerate(tools):
                if not isinstance(tool, dict):
                    return f"dependencies.tools[{index}] must be a YAML mapping"
                for field in SkillEditorApiMixin.OPENAI_TOOL_FIELDS:
                    value = tool.get(field)
                    if value is not None and not isinstance(value, str):
                        return f"dependencies.tools[{index}].{field} must be a string"
        return ""

    def save_skill_editor_data(self, filename, editor_data):
        with file_lock(self.skills_dir):
            return self._save_skill_editor_data(filename, editor_data)

    def _save_skill_editor_data(self, filename, editor_data):
        if not isinstance(editor_data, dict):
            return {"error": "Invalid editor data"}
        skill_content = editor_data.get("skill_content")
        metadata_content = editor_data.get("openai_yaml_content", "")
        save_metadata = editor_data.get("save_openai_yaml") is True
        if not isinstance(skill_content, str):
            return {"error": "SKILL.md content must be text"}
        if save_metadata and not isinstance(metadata_content, str):
            return {"error": "agents/openai.yaml content must be text"}

        files = self._skill_editor_files(filename)
        skill_path = files.get("skill_path", "")
        metadata_path = files.get("openai_yaml_path", "")
        expected = editor_data.get("expected_version")
        if expected is not None and expected != self._editor_version(files):
            return {"error": "文件已被外部修改，草稿已保留。 / File changed externally.",
                    "conflict": True, "current": self.get_skill_editor_data(filename),
                    "diff": "".join(difflib.unified_diff(
                        self.get_skill_editor_data(filename).get("skill_content", "").splitlines(True),
                        skill_content.splitlines(True), fromfile="Disk", tofile="Draft"))[:100000]}
        if not skill_path or not os.path.isfile(skill_path):
            return {"error": "File not found"}
        if save_metadata and not files.get("openai_yaml_supported"):
            return {"error": "This Skill does not support agents/openai.yaml"}
        if save_metadata:
            validation_error = self._validate_openai_yaml(metadata_content)
            if validation_error:
                return {"error": validation_error}

        try:
            with open(skill_path, "rb") as handle:
                original_skill = handle.read()
            metadata_existed = bool(metadata_path and os.path.isfile(metadata_path))
            original_metadata = b""
            if metadata_existed:
                with open(metadata_path, "rb") as handle:
                    original_metadata = handle.read()
        except OSError as error:
            return {"error": str(error)}

        try:
            if save_metadata:
                atomic_write_text(metadata_path, metadata_content)
            atomic_write_text(skill_path, skill_content)
            self._register_library_entry(filename, source="edited")
            return {
                "ok": True,
                "openai_yaml_saved": save_metadata,
                "openai_yaml_created": save_metadata and not metadata_existed,
            }
        except Exception as error:
            rollback_errors = []
            try:
                atomic_write_text(skill_path, original_skill.decode("utf-8"))
            except Exception as rollback_error:
                rollback_errors.append(str(rollback_error))
            if save_metadata:
                try:
                    if metadata_existed:
                        atomic_write_text(
                            metadata_path,
                            original_metadata.decode("utf-8"),
                        )
                    elif os.path.exists(metadata_path):
                        os.remove(metadata_path)
                except Exception as rollback_error:
                    rollback_errors.append(str(rollback_error))
            message = str(error)
            if rollback_errors:
                message += "; rollback failed: " + "; ".join(rollback_errors)
            return {"error": message}
