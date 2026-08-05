"""Supported Agent Skill targets and their source-metadata contracts."""

SKILL_LIBRARY_STATE_DIR = ".skill-hub"
DEFAULT_GLOBAL_SKILL_TARGETS = ("codex",)
GLOBAL_SKILL_TARGETS = {
    "codex": {
        "label": "Codex",
        "kind": "link",
        "path_parts": (".codex", "skills"),
    },
    "claude_code": {
        "label": "Claude Code",
        "kind": "link",
        "path_parts": (".claude", "skills"),
    },
    "antigravity": {
        "label": "Antigravity",
        "kind": "link",
        "path_parts": (".gemini", "config", "skills"),
    },
    "gemini_cli": {
        "label": "Gemini CLI",
        "kind": "link",
        "path_parts": (".gemini", "skills"),
    },
    "vscode": {
        "label": "VS Code / Copilot",
        "kind": "link",
        "path_parts": (".copilot", "skills"),
    },
    "claude_desktop": {
        "label": "Claude Desktop",
        "kind": "export",
    },
}

CODEX_FRONTMATTER_KEYS = {
    "name",
    "description",
    "license",
    "allowed-tools",
    "metadata",
}
CODEX_ADAPTER_MANIFEST = ".skillhub-codex-adapter.json"
VSCODE_FRONTMATTER_KEYS = {
    "name",
    "description",
    "argument-hint",
    "user-invocable",
    "disable-model-invocation",
    "context",
}
CLAUDE_CODE_FRONTMATTER_KEYS = {
    "name",
    "description",
    "argument-hint",
    "disable-model-invocation",
    "user-invocable",
    "allowed-tools",
    "model",
    "context",
    "agent",
    "hooks",
}
GEMINI_FRONTMATTER_KEYS = {"name", "description"}
ANTIGRAVITY_FRONTMATTER_KEYS = {"name", "description"}
CLAUDE_UPLOAD_FRONTMATTER_KEYS = {"name", "description"}


def normalize_global_skill_targets(targets) -> list:
    if not isinstance(targets, (list, tuple)):
        return list(DEFAULT_GLOBAL_SKILL_TARGETS)
    return list(dict.fromkeys(
        str(target)
        for target in targets
        if str(target) in GLOBAL_SKILL_TARGETS
    ))
