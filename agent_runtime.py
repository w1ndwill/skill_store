"""SkillOps Agent runtime with tool calling, approval gates, and local memory.

This module is UI-agnostic so the agent loop can be tested offline with a fake
model. Runtime artifacts are stored beside the application executable and are
excluded from source control and release packaging.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable

import requests


SENSITIVE_KEY_RE = re.compile(
    r"(api[_-]?key|authorization|password|passwd|secret|access[_-]?token|"
    r"refresh[_-]?token|cookie|private[_-]?key)",
    re.IGNORECASE,
)
SENSITIVE_VALUE_RE = re.compile(
    r"(bearer\s+[A-Za-z0-9._~+/=-]+|sk-[A-Za-z0-9_-]{12,})",
    re.IGNORECASE,
)
SENSITIVE_INLINE_RE = re.compile(
    r"\b(api[_-]?key|authorization|password|passwd|secret|token)\b"
    r"\s*[:=]\s*([^\s,;]+)",
    re.IGNORECASE,
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def atomic_write_json(path: str, value: Any) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    fd, temporary = tempfile.mkstemp(
        prefix=os.path.basename(path) + ".",
        suffix=".tmp",
        dir=os.path.dirname(os.path.abspath(path)),
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except Exception:
        try:
            os.remove(temporary)
        except OSError:
            pass
        raise


def load_json(path: str, default: Any) -> Any:
    if not os.path.isfile(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError, TypeError):
        return default


def sanitize(value: Any, *, max_string: int = 500) -> Any:
    """Redact secrets and limit values before they enter logs or summaries."""
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            if SENSITIVE_KEY_RE.search(str(key)):
                result[str(key)] = "[REDACTED]"
            else:
                result[str(key)] = sanitize(item, max_string=max_string)
        return result
    if isinstance(value, list):
        return [sanitize(item, max_string=max_string) for item in value[:50]]
    if isinstance(value, str):
        cleaned = SENSITIVE_VALUE_RE.sub("[REDACTED]", value)
        cleaned = SENSITIVE_INLINE_RE.sub(r"\1=[REDACTED]", cleaned)
        if len(cleaned) > max_string:
            return cleaned[:max_string] + f"…[truncated {len(cleaned) - max_string} chars]"
        return cleaned
    return value


def summarize_arguments(arguments: dict[str, Any]) -> dict[str, Any]:
    """Return an allowlisted, compact argument summary for UI and run records."""
    summary: dict[str, Any] = {}
    for key, value in arguments.items():
        if SENSITIVE_KEY_RE.search(key):
            summary[key] = "[REDACTED]"
        elif key == "content" and isinstance(value, str):
            summary[key] = {
                "chars": len(value),
                "preview": sanitize(value[:240], max_string=240),
            }
        elif isinstance(value, list):
            summary[key] = {
                "count": len(value),
                "items": sanitize(value[:12], max_string=120),
            }
        else:
            summary[key] = sanitize(value, max_string=240)
    return summary


def summarize_result(result: dict[str, Any]) -> str:
    """Create a bounded UI summary without retaining full tool response bodies."""
    if not isinstance(result, dict):
        return str(sanitize(result, max_string=180))
    if result.get("ok") is False:
        error = result.get("error", {})
        if isinstance(error, dict):
            error_type = str(error.get("type", "ToolExecutionError"))
            message = str(sanitize(error.get("message", ""), max_string=220))
            return f"{error_type}: {message}".strip(": ")
        return str(sanitize(error, max_string=240))

    parts = ["ok"]
    results = result.get("results")
    if isinstance(results, list):
        parts.append(f"{len(results)} results")
        labels = []
        for item in results[:3]:
            if not isinstance(item, dict):
                continue
            label = (
                item.get("title")
                or item.get("name")
                or item.get("filename")
            )
            if label:
                labels.append(str(sanitize(label, max_string=60)))
        if labels:
            parts.append(", ".join(labels))

    count_fields = (
        ("collection_count", "collection"),
        ("installable_count", "installable"),
        ("duplicate_count", "duplicates"),
        ("skills_checked", "checked"),
        ("synced_count", "synced"),
        ("change_count", "changes"),
    )
    for key, label in count_fields:
        value = result.get(key)
        if isinstance(value, int):
            parts.append(f"{label}: {value}")

    for key in ("filename", "install_name", "collection_id", "plan_token"):
        value = result.get(key)
        if isinstance(value, str) and value:
            parts.append(f"{key}: {sanitize(value, max_string=80)}")

    if len(parts) == 1:
        message = result.get("summary") or result.get("message")
        if isinstance(message, str) and message:
            parts.append(str(sanitize(message, max_string=180)))
    return " · ".join(parts[:5])


class ToolCallingUnsupported(RuntimeError):
    pass


class ModelCallError(RuntimeError):
    pass


class OpenAICompatibleModel:
    """Small OpenAI-compatible Chat Completions client."""

    def __init__(
        self,
        api_key: str,
        model: str,
        api_base: str,
        *,
        timeout: int = 90,
        request_post: Callable[..., Any] | None = None,
    ):
        self.api_key = api_key
        self.model = model
        self.api_base = api_base
        self.timeout = timeout
        self.request_post = request_post or requests.post

    def complete(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
    ) -> dict[str, Any]:
        url = self.api_base.strip()
        if not url.endswith("/chat/completions"):
            url = url.rstrip("/") + "/chat/completions"
        response = self.request_post(
            url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": messages,
                "tools": tools,
                "tool_choice": "auto",
                "temperature": 0.2,
                "max_tokens": 4096,
            },
            timeout=self.timeout,
        )
        if response.status_code != 200:
            try:
                body = response.json()
                error = body.get("error", {})
                message = error.get("message") if isinstance(error, dict) else str(error)
            except Exception:
                message = response.text or f"HTTP {response.status_code}"
            normalized = (message or "").lower()
            if any(
                marker in normalized
                for marker in ("tool_choice", "tools is not supported", "function calling")
            ):
                raise ToolCallingUnsupported(
                    "当前模型或 API 接口不支持工具调用（Function Calling）。"
                )
            raise ModelCallError(message or f"HTTP {response.status_code}")
        try:
            message = response.json()["choices"][0]["message"]
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise ModelCallError("模型返回格式无效，缺少 choices[0].message") from exc
        if not isinstance(message, dict):
            raise ModelCallError("模型返回的 message 不是对象")
        return message


def _is_type(value: Any, expected: str) -> bool:
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "null":
        return value is None
    return True


def validate_schema(value: Any, schema: dict[str, Any], path: str = "arguments") -> list[str]:
    errors: list[str] = []
    expected = schema.get("type")
    if expected and not _is_type(value, expected):
        return [f"{path} must be {expected}"]
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path} must be one of {schema['enum']}")
    if isinstance(value, str):
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{path} is too short")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            errors.append(f"{path} is too long")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path} must be at least {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path} must be at most {schema['maximum']}")
    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{path} has too few items")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path} has too many items")
        item_schema = schema.get("items", {})
        for index, item in enumerate(value):
            errors.extend(validate_schema(item, item_schema, f"{path}[{index}]"))
    if isinstance(value, dict):
        properties = schema.get("properties", {})
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"{path}.{key} is required")
        if schema.get("additionalProperties") is False:
            for key in value:
                if key not in properties:
                    errors.append(f"{path}.{key} is not allowed")
        for key, item in value.items():
            if key in properties:
                errors.extend(validate_schema(item, properties[key], f"{path}.{key}"))
    return errors


@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: dict[str, Any]
    handler: Callable[[dict[str, Any]], dict[str, Any]]
    risk: str = "read"

    def schema(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class AgentMemoryStore:
    """Persistent, relevance-filtered project, preference, and decision memory."""

    def __init__(self, path: str):
        self.path = path
        self._data = self._load()

    def _empty(self) -> dict[str, Any]:
        return {
            "version": 1,
            "enabled": True,
            "projects": {},
            "preferences": [],
            "decisions": [],
        }

    def _load(self) -> dict[str, Any]:
        data = load_json(self.path, self._empty())
        if not isinstance(data, dict) or data.get("version") != 1:
            return self._empty()
        base = self._empty()
        base.update(data)
        return base

    @property
    def enabled(self) -> bool:
        return bool(self._data.get("enabled", True))

    def set_enabled(self, enabled: bool) -> dict[str, Any]:
        self._data["enabled"] = bool(enabled)
        atomic_write_json(self.path, self._data)
        return {"ok": True, "enabled": self.enabled}

    def clear(self) -> dict[str, Any]:
        enabled = self.enabled
        self._data = self._empty()
        self._data["enabled"] = enabled
        atomic_write_json(self.path, self._data)
        return {"ok": True, "enabled": enabled}

    def remember(
        self,
        kind: str,
        summary: str,
        *,
        project_path: str = "",
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self.enabled:
            return {"ok": False, "disabled": True}
        if sanitize(summary, max_string=1200) != summary:
            return {"ok": False, "error": "Memory rejected because it may contain a secret"}
        item = {
            "id": uuid.uuid4().hex,
            "kind": kind,
            "summary": sanitize(summary, max_string=1200),
            "project_path": project_path,
            "metadata": sanitize(metadata or {}, max_string=240),
            "created_at": utc_now(),
        }
        if kind == "project":
            key = os.path.normcase(os.path.abspath(project_path or "general"))
            self._data["projects"][key] = item
        elif kind == "preference":
            self._data["preferences"].append(item)
            self._data["preferences"] = self._data["preferences"][-100:]
        else:
            self._data["decisions"].append(item)
            self._data["decisions"] = self._data["decisions"][-200:]
        atomic_write_json(self.path, self._data)
        return {"ok": True, "memory_id": item["id"]}

    def recall(
        self,
        query: str,
        *,
        project_path: str = "",
        limit: int = 6,
    ) -> list[dict[str, Any]]:
        if not self.enabled:
            return []
        candidates = list(self._data["projects"].values())
        candidates += self._data["preferences"] + self._data["decisions"]
        terms = {
            token.casefold()
            for token in re.findall(r"[\w\u4e00-\u9fff]{2,}", query or "")
        }
        normalized_project = os.path.normcase(os.path.abspath(project_path)) if project_path else ""
        ranked = []
        for item in candidates:
            text = json.dumps(item, ensure_ascii=False).casefold()
            score = sum(2 for term in terms if term in text)
            if normalized_project and os.path.normcase(
                os.path.abspath(item.get("project_path") or "general")
            ) == normalized_project:
                score += 5
            if item.get("kind") == "preference":
                score += 1
            if score > 0 or not terms:
                ranked.append((score, item.get("created_at", ""), item))
        ranked.sort(key=lambda entry: (entry[0], entry[1]), reverse=True)
        return [
            {
                "id": item["id"],
                "kind": item["kind"],
                "summary": item["summary"],
                "project_path": item.get("project_path", ""),
                "created_at": item["created_at"],
            }
            for _, _, item in ranked[: max(1, min(limit, 12))]
        ]

    def public_view(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "projects": list(self._data["projects"].values()),
            "preferences": self._data["preferences"][-50:],
            "decisions": self._data["decisions"][-50:],
        }


class AgentTaskStore:
    def __init__(self, path: str, max_tasks: int = 50):
        self.path = path
        self.max_tasks = max_tasks

    def _load_all(self) -> list[dict[str, Any]]:
        value = load_json(self.path, [])
        return value if isinstance(value, list) else []

    def save(self, task: dict[str, Any]) -> None:
        tasks = self._load_all()
        tasks = [item for item in tasks if item.get("run_id") != task.get("run_id")]
        tasks.insert(0, task)
        atomic_write_json(self.path, tasks[: self.max_tasks])

    def load(self, run_id: str) -> dict[str, Any] | None:
        return next(
            (item for item in self._load_all() if item.get("run_id") == run_id),
            None,
        )

    def list_public(self) -> list[dict[str, Any]]:
        return [
            {
                "run_id": item.get("run_id"),
                "session_id": item.get("session_id"),
                "goal": item.get("goal"),
                "status": item.get("status"),
                "updated_at": item.get("updated_at"),
                "step_count": item.get("step_count", 0),
            }
            for item in self._load_all()
        ]


class RunRecorder:
    """Append one minimal, sanitized record when a run reaches a terminal state."""

    def __init__(self, path: str):
        self.path = path

    def append(self, task: dict[str, Any]) -> None:
        record = {
            "run_id": task.get("run_id"),
            "goal_summary": sanitize(task.get("goal", ""), max_string=500),
            "started_at": task.get("created_at"),
            "ended_at": task.get("updated_at"),
            "tool_names": [
                event.get("tool")
                for event in task.get("timeline", [])
                if event.get("type") == "tool_call"
            ],
            "tool_events": [
                {
                    "tool": event.get("tool"),
                    "arguments": event.get("arguments", {}),
                    "status": event.get("status"),
                }
                for event in task.get("timeline", [])
                if event.get("type") in ("tool_call", "approval")
            ],
            "approvals": [
                {
                    "tool": event.get("tool"),
                    "decision": event.get("decision"),
                    "at": event.get("at"),
                }
                for event in task.get("timeline", [])
                if event.get("type") == "approval"
            ],
            "final_status": task.get("status"),
            "error_type": task.get("error_type", ""),
            "memory_ids": task.get("memory_ids", []),
            "step_count": task.get("step_count", 0),
        }
        os.makedirs(os.path.dirname(os.path.abspath(self.path)), exist_ok=True)
        with open(self.path, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(sanitize(record), ensure_ascii=False) + "\n")


class AgentRuntime:
    TERMINAL_STATES = {"completed", "failed", "rejected", "max_steps"}
    MAX_IDENTICAL_DECISIONS = 4
    MAX_WRITE_POLICY_CORRECTIONS = 2
    PREVIEW_WRITE_TOOLS = {
        "draft_skill_change": "apply_skill_change",
        "preview_remote_skill_install": "apply_remote_skill_install",
        "preview_remote_skill_collection": "apply_remote_skill_collection",
        "preview_skillhub_catalog_install": "apply_skillhub_catalog_install",
        "preview_project_sync": "apply_project_sync",
    }

    def __init__(
        self,
        model: Any,
        tools: list[ToolDefinition],
        task_store: AgentTaskStore,
        memory: AgentMemoryStore,
        recorder: RunRecorder,
        *,
        max_steps: int = 32,
        language: str = "zh",
    ):
        self.model = model
        self.tools = {tool.name: tool for tool in tools}
        self.task_store = task_store
        self.memory = memory
        self.recorder = recorder
        self.max_steps = max(1, min(int(max_steps), 64))
        self.language = language

    def _system_prompt(self, memory_hits: list[dict[str, Any]]) -> str:
        language = "中文" if self.language == "zh" else "English"
        memory_text = json.dumps(memory_hits, ensure_ascii=False)
        return (
            "你是 SkillOps Agent，专门负责 AI 编程 Skill 的生命周期管理。"
            "你必须通过注册工具获取事实，不得声称执行了未调用的工具。"
            "先简要说明当前阶段，再自主选择必要工具；优先只读检查和预览。"
            "任何 apply_ 写操作都必须等待用户明确批准。"
            "当用户明确要求安装、导入、保存或同步，且对应预览已成功时，"
            "你必须调用匹配的 apply_ 工具来发起产品审批门；"
            "不得只在自然语言中询问批准，也不得把尚未申请审批的任务标记为完成。"
            "如果预览明确返回 requires_user_choice，则先让用户选择冲突策略，"
            "不得擅自覆盖或保留副本。"
            "不要输出隐藏思维链，只输出简洁计划、可验证操作理由和结果。"
            "当工具失败时如实说明；当 API 不支持工具调用时不得伪造。"
            f"最终回答使用{language}。相关记忆（可能为空）：{memory_text}"
        )

    @staticmethod
    def _goal_requests_write(goal: str) -> bool:
        normalized = str(goal or "").casefold()
        read_only_markers = (
            "仅预览",
            "只预览",
            "不要写入",
            "不要安装",
            "无需安装",
            "preview only",
            "read only",
            "read-only",
            "do not install",
            "don't install",
        )
        if any(marker in normalized for marker in read_only_markers):
            return False
        write_markers = (
            "安装",
            "导入",
            "保存",
            "创建",
            "写入",
            "应用",
            "同步",
            "install",
            "import",
            "save",
            "create",
            "write",
            "apply",
            "sync",
        )
        return any(marker in normalized for marker in write_markers)

    def _requires_write_followup(self, task: dict[str, Any]) -> bool:
        followup = task.get("required_write_followup")
        return (
            isinstance(followup, dict)
            and bool(followup.get("apply_tool"))
            and self._goal_requests_write(task.get("goal", ""))
        )

    def start(
        self,
        goal: str,
        *,
        session_id: str = "",
        project_path: str = "",
    ) -> dict[str, Any]:
        goal = (goal or "").strip()
        if not goal:
            return {"error": "目标不能为空"}
        goal = sanitize(goal, max_string=4000)
        memory_hits = self.memory.recall(goal, project_path=project_path)
        now = utc_now()
        task = {
            "version": 1,
            "run_id": uuid.uuid4().hex,
            "session_id": session_id,
            "goal": goal,
            "project_path": project_path,
            "status": "running",
            "phase": "分析目标并选择工具",
            "created_at": now,
            "updated_at": now,
            "step_count": 0,
            "messages": [
                {"role": "system", "content": self._system_prompt(memory_hits)},
                {"role": "user", "content": goal},
            ],
            "timeline": [
                {
                    "type": "plan",
                    "at": now,
                    "summary": "分析目标、检索相关记忆并选择最小必要工具。",
                }
            ],
            "memory_ids": [item["id"] for item in memory_hits],
            "memory_used": memory_hits,
            "pending": None,
            "final_answer": "",
            "recorded": False,
            "last_decision_signature": "",
            "identical_decision_count": 0,
            "required_write_followup": None,
            "write_policy_correction_count": 0,
        }
        self.task_store.save(task)
        return self._advance(task)

    def approve(self, run_id: str) -> dict[str, Any]:
        task = self.task_store.load(run_id)
        if not task:
            return {"error": "Agent task not found"}
        if task.get("status") != "waiting_approval" or not task.get("pending"):
            return {"error": "Agent task is not waiting for approval"}
        pending = task["pending"]
        tool = self.tools.get(pending["name"])
        if not tool:
            return self._fail(task, "UnknownTool", f"Unknown tool: {pending['name']}")
        persisted_name = (
            pending.get("call", {}).get("function", {}).get("name")
            if isinstance(pending.get("call"), dict)
            else ""
        )
        if persisted_name != pending["name"]:
            return self._fail(
                task,
                "InvalidPersistedCall",
                "Persisted approval call does not match the registered tool",
            )
        validation_errors = validate_schema(
            pending.get("arguments"),
            tool.parameters,
        )
        if validation_errors:
            return self._fail(
                task,
                "InvalidPersistedArguments",
                "; ".join(validation_errors),
            )
        task["timeline"].append(
            {
                "type": "approval",
                "at": utc_now(),
                "tool": tool.name,
                "decision": "approved",
                "status": "approved",
            }
        )
        task["status"] = "running"
        task["phase"] = f"执行已批准操作：{tool.name}"
        task["pending"] = None
        self._execute_tool(task, pending["call"], tool, pending["arguments"])
        remaining = pending.get("remaining", [])
        if remaining:
            paused = self._process_calls(task, remaining)
            if paused:
                return self._public(task)
        return self._advance(task)

    def reject(self, run_id: str, reason: str = "") -> dict[str, Any]:
        task = self.task_store.load(run_id)
        if not task:
            return {"error": "Agent task not found"}
        if task.get("status") != "waiting_approval" or not task.get("pending"):
            return {"error": "Agent task is not waiting for approval"}
        pending = task["pending"]
        task["timeline"].append(
            {
                "type": "approval",
                "at": utc_now(),
                "tool": pending["name"],
                "decision": "rejected",
                "status": "rejected",
                "reason": sanitize(reason, max_string=240),
            }
        )
        task["messages"].append(
            {
                "role": "tool",
                "tool_call_id": pending["call"]["id"],
                "content": json.dumps(
                    {
                        "ok": False,
                        "error": {
                            "type": "UserRejected",
                            "message": reason or "User rejected the write operation",
                        },
                    },
                    ensure_ascii=False,
                ),
            }
        )
        self.memory.remember(
            "decision",
            f"用户拒绝了 {pending['name']}：{reason or '未提供原因'}",
            project_path=task.get("project_path", ""),
        )
        task["pending"] = None
        task["status"] = "rejected"
        task["phase"] = "用户已拒绝写操作，任务安全结束"
        task["final_answer"] = "写操作已拒绝，未修改任何文件。"
        task["updated_at"] = utc_now()
        self._persist_and_record(task)
        return self._public(task)

    def resume(self, run_id: str) -> dict[str, Any]:
        task = self.task_store.load(run_id)
        if not task:
            return {"error": "Agent task not found"}
        if task.get("status") == "waiting_approval":
            return self._public(task)
        if task.get("status") in self.TERMINAL_STATES:
            return self._public(task)
        return self._advance(task)

    def get(self, run_id: str) -> dict[str, Any]:
        task = self.task_store.load(run_id)
        if not task:
            return {"error": "Agent task not found"}
        return self._public(task)

    def _advance(self, task: dict[str, Any]) -> dict[str, Any]:
        while task["step_count"] < self.max_steps:
            task["phase"] = "模型决策"
            task["updated_at"] = utc_now()
            self.task_store.save(task)
            try:
                message = self.model.complete(
                    task["messages"],
                    [tool.schema() for tool in self.tools.values()],
                )
            except ToolCallingUnsupported as exc:
                return self._fail(task, "ToolCallingUnsupported", str(exc))
            except requests.exceptions.Timeout:
                return self._fail(task, "Timeout", "Agent 模型请求超时")
            except Exception as exc:
                return self._fail(task, type(exc).__name__, str(exc))

            assistant = {
                "role": "assistant",
                "content": message.get("content") or "",
            }
            raw_calls = message.get("tool_calls") or []
            if not isinstance(raw_calls, list):
                return self._fail(
                    task,
                    "InvalidModelResponse",
                    "模型返回的 tool_calls 不是数组",
                )
            calls = []
            for raw_call in raw_calls:
                normalized = dict(raw_call) if isinstance(raw_call, dict) else {}
                normalized["id"] = normalized.get("id") or (
                    f"call_{uuid.uuid4().hex[:16]}"
                )
                normalized["type"] = "function"
                function = normalized.get("function")
                normalized["function"] = (
                    dict(function) if isinstance(function, dict) else {}
                )
                calls.append(normalized)
            if calls:
                assistant["tool_calls"] = calls
            task["messages"].append(assistant)
            task["step_count"] += 1

            if not calls:
                if self._requires_write_followup(task):
                    followup = task["required_write_followup"]
                    correction_count = int(
                        task.get("write_policy_correction_count", 0)
                    )
                    if correction_count >= self.MAX_WRITE_POLICY_CORRECTIONS:
                        return self._fail(
                            task,
                            "WriteApprovalNotRequested",
                            (
                                "Agent 已完成预览，但未调用对应写工具发起审批，"
                                "因此不能声称安装任务已完成。"
                                if self.language == "zh"
                                else (
                                    "The Agent completed a preview but did not call "
                                    "the matching write tool to request approval."
                                )
                            ),
                        )
                    task["write_policy_correction_count"] = correction_count + 1
                    apply_tool = followup["apply_tool"]
                    task["phase"] = f"要求发起写入审批：{apply_tool}"
                    task["messages"].append(
                        {
                            "role": "system",
                            "content": (
                                "运行时策略校验：用户明确要求写入，且 "
                                f"{followup['preview_tool']} 已成功。你必须立即调用 "
                                f"{apply_tool}，使用最近一次预览返回的精确令牌、哈希"
                                "和目标参数来发起审批。不要用文字询问批准。"
                            ),
                        }
                    )
                    task["timeline"].append(
                        {
                            "type": "policy",
                            "at": utc_now(),
                            "summary": (
                                f"预览成功后未发起审批，要求调用 {apply_tool}。"
                            ),
                            "status": "corrected",
                        }
                    )
                    task["updated_at"] = utc_now()
                    self.task_store.save(task)
                    continue
                task["status"] = "completed"
                task["phase"] = "已完成"
                task["final_answer"] = message.get("content") or "任务已完成。"
                task["updated_at"] = utc_now()
                task["timeline"].append(
                    {
                        "type": "final",
                        "at": task["updated_at"],
                        "summary": sanitize(task["final_answer"], max_string=1000),
                    }
                )
                self._persist_and_record(task)
                return self._public(task)

            decision_signature = json.dumps(
                [
                    {
                        "name": call.get("function", {}).get("name", ""),
                        "arguments": call.get("function", {}).get(
                            "arguments",
                            "{}",
                        ),
                    }
                    for call in calls
                ],
                ensure_ascii=False,
                sort_keys=True,
            )
            if decision_signature == task.get("last_decision_signature"):
                task["identical_decision_count"] = (
                    int(task.get("identical_decision_count", 0)) + 1
                )
            else:
                task["last_decision_signature"] = decision_signature
                task["identical_decision_count"] = 1
            if (
                task["identical_decision_count"]
                >= self.MAX_IDENTICAL_DECISIONS
            ):
                return self._fail(
                    task,
                    "NoProgress",
                    (
                        "Agent 连续重复相同工具决策，已停止以避免无进展循环。"
                        if self.language == "zh"
                        else (
                            "The Agent repeated the same tool decision and "
                            "stopped to avoid a no-progress loop."
                        )
                    ),
                )

            paused = self._process_calls(task, calls)
            if paused:
                return self._public(task)

        task["status"] = "max_steps"
        task["phase"] = "达到最大步骤数"
        task["error_type"] = "MaxStepsExceeded"
        task["final_answer"] = f"Agent 已达到最大 {self.max_steps} 步，已安全停止。"
        task["updated_at"] = utc_now()
        task["timeline"].append(
            {
                "type": "error",
                "at": task["updated_at"],
                "summary": task["final_answer"],
            }
        )
        self._persist_and_record(task)
        return self._public(task)

    def _process_calls(self, task: dict[str, Any], calls: list[dict[str, Any]]) -> bool:
        for index, call in enumerate(calls):
            function = call.get("function") if isinstance(call, dict) else None
            name = function.get("name", "") if isinstance(function, dict) else ""
            arguments_raw = function.get("arguments", "{}") if isinstance(function, dict) else "{}"
            tool = self.tools.get(name)
            if not tool:
                self._append_tool_error(
                    task,
                    call,
                    "UnknownTool",
                    f"Tool '{name}' is not registered",
                    name=name,
                )
                continue
            try:
                arguments = (
                    json.loads(arguments_raw)
                    if isinstance(arguments_raw, str)
                    else arguments_raw
                )
            except (TypeError, ValueError) as exc:
                self._append_tool_error(
                    task,
                    call,
                    "InvalidArguments",
                    f"Tool arguments are not valid JSON: {exc}",
                    name=name,
                )
                continue
            errors = validate_schema(arguments, tool.parameters)
            if errors:
                self._append_tool_error(
                    task,
                    call,
                    "InvalidArguments",
                    "; ".join(errors),
                    name=name,
                    arguments=arguments if isinstance(arguments, dict) else {},
                )
                continue
            if tool.risk == "write":
                now = utc_now()
                task["status"] = "waiting_approval"
                task["phase"] = f"等待批准：{name}"
                task["pending"] = {
                    "name": name,
                    "call": call,
                    "arguments": arguments,
                    "remaining": calls[index + 1 :],
                    "summary": summarize_arguments(arguments),
                }
                task["timeline"].append(
                    {
                        "type": "tool_call",
                        "at": now,
                        "tool": name,
                        "arguments": summarize_arguments(arguments),
                        "status": "waiting_approval",
                    }
                )
                task["updated_at"] = now
                self.task_store.save(task)
                return True
            self._execute_tool(task, call, tool, arguments)
        return False

    def _execute_tool(
        self,
        task: dict[str, Any],
        call: dict[str, Any],
        tool: ToolDefinition,
        arguments: dict[str, Any],
    ) -> None:
        now = utc_now()
        event = {
            "type": "tool_call",
            "at": now,
            "tool": tool.name,
            "arguments": summarize_arguments(arguments),
            "status": "running",
        }
        task["timeline"].append(event)
        task["phase"] = f"执行工具：{tool.name}"
        started = time.monotonic()
        try:
            result = tool.handler(arguments)
            if not isinstance(result, dict):
                result = {"ok": True, "result": result}
            if result.get("error") and not isinstance(result.get("error"), dict):
                result = {
                    "ok": False,
                    "error": {
                        "type": "ToolExecutionError",
                        "message": str(result["error"]),
                    },
                }
            if result.get("ok"):
                apply_tool = self.PREVIEW_WRITE_TOOLS.get(tool.name)
                if apply_tool and not result.get("requires_user_choice"):
                    task["required_write_followup"] = {
                        "preview_tool": tool.name,
                        "apply_tool": apply_tool,
                    }
                    task["write_policy_correction_count"] = 0
                elif (
                    isinstance(task.get("required_write_followup"), dict)
                    and task["required_write_followup"].get("apply_tool")
                    == tool.name
                ):
                    task["required_write_followup"] = None
                    task["write_policy_correction_count"] = 0
            event["status"] = "error" if result.get("ok") is False else "ok"
        except Exception as exc:
            result = {
                "ok": False,
                "error": {
                    "type": type(exc).__name__,
                    "message": sanitize(str(exc), max_string=500),
                },
            }
            event["status"] = "error"
        event["duration_ms"] = int((time.monotonic() - started) * 1000)
        event["result_summary"] = summarize_result(result)
        task["messages"].append(
            {
                "role": "tool",
                "tool_call_id": call.get("id") or f"call_{uuid.uuid4().hex[:12]}",
                "content": json.dumps(result, ensure_ascii=False),
            }
        )
        task["updated_at"] = utc_now()
        self.task_store.save(task)

    def _append_tool_error(
        self,
        task: dict[str, Any],
        call: dict[str, Any],
        error_type: str,
        message: str,
        *,
        name: str,
        arguments: dict[str, Any] | None = None,
    ) -> None:
        result = {"ok": False, "error": {"type": error_type, "message": message}}
        task["messages"].append(
            {
                "role": "tool",
                "tool_call_id": call.get("id") or f"call_{uuid.uuid4().hex[:12]}",
                "content": json.dumps(result, ensure_ascii=False),
            }
        )
        task["timeline"].append(
            {
                "type": "tool_call",
                "at": utc_now(),
                "tool": name or "(unknown)",
                "arguments": summarize_arguments(arguments or {}),
                "status": "error",
                "result_summary": summarize_result(result),
            }
        )
        self.task_store.save(task)

    def _fail(
        self,
        task: dict[str, Any],
        error_type: str,
        message: str,
    ) -> dict[str, Any]:
        task["status"] = "failed"
        task["phase"] = "执行失败"
        task["error_type"] = error_type
        task["final_answer"] = sanitize(message, max_string=1000)
        task["updated_at"] = utc_now()
        task["timeline"].append(
            {
                "type": "error",
                "at": task["updated_at"],
                "summary": task["final_answer"],
                "error_type": error_type,
            }
        )
        self._persist_and_record(task)
        return self._public(task)

    def _persist_and_record(self, task: dict[str, Any]) -> None:
        self.task_store.save(task)
        if task.get("status") in self.TERMINAL_STATES and not task.get("recorded"):
            self.recorder.append(task)
            task["recorded"] = True
            self.task_store.save(task)

    def _public(self, task: dict[str, Any]) -> dict[str, Any]:
        pending = task.get("pending")
        return {
            "run_id": task.get("run_id"),
            "status": task.get("status"),
            "phase": task.get("phase"),
            "step_count": task.get("step_count", 0),
            "max_steps": self.max_steps,
            "timeline": task.get("timeline", []),
            "pending_approval": (
                {
                    "tool": pending.get("name"),
                    "arguments": pending.get("summary", {}),
                }
                if pending
                else None
            ),
            "final_answer": task.get("final_answer", ""),
            "memory_used": task.get("memory_used", []),
            "error_type": task.get("error_type", ""),
        }
