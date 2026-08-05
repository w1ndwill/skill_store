"""Generation and safe merging of the managed AGENTS.md section."""

import os

from skillhub.domain.naming import normalize_relative_path


AGENTS_MANAGED_START = "<!-- AI_SKILL_HUB:START -->"
AGENTS_MANAGED_END = "<!-- AI_SKILL_HUB:END -->"
def markdown_table_value(value) -> str:
    return str(value or "").replace("|", "\\|").replace("\r", " ").replace("\n", " ")

def build_agents_managed_section(metadata: list, language: str) -> str:
    """Build the application-owned AGENTS.md section."""
    is_zh = language == "zh"
    title = "项目 AI 开发规约与技能索引" if is_zh else "Project AI Rules & Skill Index"
    intro = (
        "以下技能由 **SkillHub** 自动维护。"
        if is_zh
        else "The following skills are managed by **SkillHub**."
    )
    has_superpowers = any(
        meta.get("filename") == "superpowers-template" for meta in metadata
    )
    headers = (
        "| 技能名称 | 分类 | 标签 | 简述 | 本地链接 |"
        if is_zh
        else "| Skill | Category | Tags | Description | Local Link |"
    )
    lines = [
        AGENTS_MANAGED_START,
        f"## {title}",
        "",
        intro,
        "",
    ]
    if has_superpowers:
        lines.extend([
            (
                "按任务匹配并读取相关技能；专项技能优先于通用工作流。"
                "仅在中大型实现、高风险修改或存在实质性设计取舍时使用 Superpowers，"
                "简单问答、只读检查和明确的小修改无需执行完整四阶段流程。"
                if is_zh
                else
                "Match and read only the skills relevant to the task; specialized skills "
                "take precedence over general workflows. Use Superpowers for medium or "
                "large implementations, high-risk changes, or meaningful design tradeoffs; "
                "simple questions, read-only checks, and clearly scoped small edits do not "
                "require the full four-phase workflow."
            ),
            "",
        ])
    lines.extend([
        headers,
        "| :--- | :--- | :--- | :--- | :--- |",
    ])
    if not metadata:
        empty_text = "暂未启用任何技能" if is_zh else "No skills enabled"
        lines.append(f"| *{empty_text}* | - | - | - | - |")
    else:
        for meta in metadata:
            filename = meta.get("filename", "")
            title_text = meta.get("title", filename)
            emoji = meta.get("emoji", "")
            category = meta.get("category", "未分类" if is_zh else "Uncategorized")
            tags = ", ".join(meta.get("tags", []))
            description = meta.get("description", "")
            if meta.get("folder_kind") == "standard":
                link_name = f"{filename}/SKILL.md"
            elif meta.get("is_dir", False):
                link_name = f"{filename}.md"
            else:
                link_name = filename
            link = normalize_relative_path(os.path.join(".agent", "skills", link_name))
            label = f"{emoji} {title_text}".strip()
            lines.append(
                "| {label} | {category} | `{tags}` | {description} | [{link_name}]({link}) |".format(
                    label=markdown_table_value(label),
                    category=markdown_table_value(category),
                    tags=markdown_table_value(tags),
                    description=markdown_table_value(description),
                    link_name=markdown_table_value(link_name),
                    link=link.replace(" ", "%20"),
                )
            )
    lines.extend(["", AGENTS_MANAGED_END])
    return "\n".join(lines)

def merge_agents_managed_section(existing: str, managed_section: str) -> str:
    """Replace only the app-owned AGENTS section and preserve user content."""
    start = existing.find(AGENTS_MANAGED_START)
    end = existing.find(AGENTS_MANAGED_END)
    if start >= 0 and end >= start:
        end += len(AGENTS_MANAGED_END)
        before = existing[:start].rstrip()
        after = existing[end:].lstrip("\r\n")
        parts = [part for part in (before, managed_section, after.rstrip()) if part]
        return "\n\n".join(parts).rstrip() + "\n"

    legacy_generated = (
        ("AI Skill Hub Manager" in existing or "SkillHub" in existing)
        and ".agent/skills/" in existing
        and (
            "Currently Enabled Development Skills" in existing
            or "当前项目已启用的开发技能" in existing
        )
    )
    if legacy_generated or not existing.strip():
        return managed_section.rstrip() + "\n"
    return existing.rstrip() + "\n\n" + managed_section.rstrip() + "\n"
