"""Skill catalog metadata parsing and aggregation."""

import os
import re

from skillhub.domain.frontmatter import split_markdown_frontmatter
def parse_markdown_metadata(file_path: str) -> dict:
    filename = os.path.basename(file_path)
    default_title = os.path.splitext(filename)[0]
    metadata = {
        "filename": filename,
        "title": default_title,
        "emoji": "\U0001f4c4",
        "category": "未分类",
        "tags": ["常规"],
        "description": "此技能暂无详细描述信息。"
    }
    if not os.path.exists(file_path):
        return metadata
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return metadata

    frontmatter, _body = split_markdown_frontmatter(content)
    if frontmatter:
        metadata["title"] = (
            frontmatter.get("title")
            or frontmatter.get("name")
            or metadata["title"]
        )
        metadata["emoji"] = frontmatter.get("emoji") or metadata["emoji"]
        metadata["category"] = frontmatter.get("category") or metadata["category"]
        if frontmatter.get("tags"):
            metadata["tags"] = [
                item.strip()
                for item in frontmatter["tags"].strip("[]").split(",")
                if item.strip()
            ]
        if frontmatter.get("description"):
            metadata["description"] = re.sub(
                r"\s+",
                " ",
                frontmatter["description"],
            ).strip()
        return metadata

    lines = content.splitlines()
    h1_found = False
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if not h1_found and s.startswith("#"):
            metadata["title"] = s.lstrip("#").strip()
            h1_found = True
        elif h1_found and not s.startswith("#") and not s.startswith("-") and not s.startswith("*"):
            metadata["description"] = s
            break

    return metadata

def upsert_metadata(entries: list, metadata: dict):
    """Add metadata once per filename, replacing stale entries when needed."""
    filename = metadata.get("filename")
    if not filename:
        entries.append(metadata)
        return
    for idx, item in enumerate(entries):
        if (item.get("filename") or "").casefold() == filename.casefold():
            entries[idx] = metadata
            return
    entries.append(metadata)

def collect_folder_skill_metadata(folder_path: str) -> list:
    """Return metadata for .agent/skills/*.md files bundled by a folder skill."""
    bundled_skills_dir = os.path.join(folder_path, ".agent", "skills")
    if not os.path.isdir(bundled_skills_dir):
        return []

    metadata = []
    for item in sorted(os.listdir(bundled_skills_dir)):
        if not item.lower().endswith(".md"):
            continue
        fp = os.path.join(bundled_skills_dir, item)
        if os.path.isfile(fp):
            meta = parse_markdown_metadata(fp)
            meta["filename"] = item
            meta["is_dir"] = False
            metadata.append(meta)
    return metadata
