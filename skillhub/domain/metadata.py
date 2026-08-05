"""Conservative display metadata inference for imported Skill documents."""

import os
import re

from .frontmatter import split_markdown_frontmatter


def clean_frontmatter_value(value: str, fallback: str = "") -> str:
    cleaned = re.sub(r"[\r\n]+", " ", str(value or fallback)).strip()
    return cleaned.replace("|", "/")


def markdown_title_and_description(
    body: str,
    fallback_title: str,
    language: str,
) -> tuple:
    title = fallback_title
    description = ""
    found_title = False
    for line in (body or "").splitlines():
        value = line.strip()
        if not value:
            continue
        if not found_title and value.startswith("#"):
            title = value.lstrip("#").strip() or fallback_title
            found_title = True
            continue
        if value.startswith(("#", "-", "*", "```", ">")):
            continue
        description = value[:200]
        break
    if not description:
        description = (
            "Imported skill guideline. Review its scope before enabling it."
            if language == "en"
            else "导入的技能规范；启用前请确认其适用范围。"
        )
    return title, description


def infer_skill_metadata(content: str, filename: str, language: str = "zh") -> dict:
    """Infer conservative display metadata without requiring an AI service."""
    frontmatter, body = split_markdown_frontmatter(content)
    fallback_title = os.path.splitext(os.path.basename(filename))[0]
    body_title, body_description = markdown_title_and_description(
        body, fallback_title, language
    )
    title = frontmatter.get("title") or frontmatter.get("name") or body_title
    description = frontmatter.get("description") or body_description
    haystack = f"{title}\n{description}\n{body}".lower()

    rules = [
        (("python", "pip", "poetry", "venv"), "Python", "编程开发", "🐍"),
        (("git", "commit", "pull request"), "Git", "编程开发", "🌿"),
        (("frontend", "react", "vue", "css", "前端"), "前端", "前端开发", "⚡"),
        (("security", "安全", "漏洞", "secret"), "安全", "工程质量", "🛡️"),
        (("test", "tdd", "测试"), "测试", "工程质量", "🧪"),
        (("deploy", "docker", "kubernetes", "部署"), "部署", "工程效率", "🚀"),
        (("log", "observability", "日志", "监控"), "可观测性", "工程质量", "📊"),
        (("workflow", "planning", "handoff", "工作流", "规划"), "工作流", "工作流", "🔄"),
        (("database", "sql", "数据库"), "数据库", "编程开发", "🗄️"),
        (("api", "接口"), "API", "编程开发", "🔌"),
    ]
    tags = []
    category = "Uncategorized" if language == "en" else "未分类"
    emoji = frontmatter.get("emoji") or "📄"
    for keywords, tag, inferred_category, inferred_emoji in rules:
        if any(keyword in haystack for keyword in keywords):
            tags.append(tag)
            if category in ("未分类", "Uncategorized"):
                category = inferred_category
                emoji = frontmatter.get("emoji") or inferred_emoji
    raw_tags = frontmatter.get("tags", "")
    if raw_tags:
        tags = [item.strip() for item in raw_tags.split(",") if item.strip()]
    if not tags:
        tags = ["General" if language == "en" else "常规"]
    return {
        "title": clean_frontmatter_value(title, fallback_title),
        "emoji": clean_frontmatter_value(frontmatter.get("emoji"), emoji),
        "category": clean_frontmatter_value(frontmatter.get("category"), category),
        "tags": tags[:6],
        "description": clean_frontmatter_value(description),
        "body": body,
        "frontmatter": frontmatter,
    }
