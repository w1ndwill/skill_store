"""Lossless Markdown frontmatter parsing and target-view rendering."""

import json
import re


def split_markdown_frontmatter(content: str) -> tuple:
    """Return a simple frontmatter mapping and the Markdown body."""
    text = (content or "").lstrip("\ufeff")
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    metadata = {}
    lines = parts[1].splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line or line[:1].isspace() or ":" not in line:
            index += 1
            continue
        key, value = line.split(":", 1)
        key = key.strip().lower()
        value = value.strip()
        if value in (">", ">-", ">+", "|", "|-", "|+"):
            style = value[0]
            continuation = []
            index += 1
            while index < len(lines):
                next_line = lines[index]
                if next_line and not next_line[:1].isspace():
                    break
                continuation.append(next_line.strip())
                index += 1
            if style == ">":
                value = " ".join(part for part in continuation if part)
            else:
                value = "\n".join(continuation).strip()
            metadata[key] = value
            continue
        metadata[key] = value.strip("\"'")
        index += 1
    return metadata, parts[2].lstrip("\r\n")


def split_markdown_frontmatter_source(content: str) -> tuple:
    """Return raw frontmatter, body, and whether a valid frontmatter block exists."""
    text = (content or "").lstrip("\ufeff")
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return "", text, False
    closing_index = next(
        (
            index
            for index, line in enumerate(lines[1:], start=1)
            if line.strip() == "---"
        ),
        -1,
    )
    if closing_index < 0:
        return "", text, False
    raw_frontmatter = "".join(lines[1:closing_index])
    body = "".join(lines[closing_index + 1:]).lstrip("\r\n")
    return raw_frontmatter, body, True


def remove_markdown_frontmatter_field(content: str, field_name: str) -> str:
    """Remove every top-level field occurrence while preserving source layout."""
    text = content or ""
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].lstrip("\ufeff").strip() != "---":
        return text
    closing_index = next(
        (
            index
            for index, line in enumerate(lines[1:], start=1)
            if line.strip() == "---"
        ),
        -1,
    )
    if closing_index < 0:
        return text

    field_pattern = re.compile(
        rf"^{re.escape((field_name or '').strip())}\s*:\s*(.*)$",
        re.IGNORECASE,
    )
    kept = [lines[0]]
    index = 1
    changed = False
    while index < closing_index:
        line_without_ending = lines[index].rstrip("\r\n")
        match = field_pattern.match(line_without_ending)
        if not match:
            kept.append(lines[index])
            index += 1
            continue
        changed = True
        block_style = match.group(1).strip() in (">", ">-", ">+", "|", "|-", "|+")
        index += 1
        if block_style:
            while index < closing_index:
                continuation = lines[index].rstrip("\r\n")
                if continuation and not continuation[:1].isspace():
                    break
                index += 1

    if not changed:
        return text
    kept.extend(lines[closing_index:])
    return "".join(kept)


def frontmatter_top_level_keys(raw_frontmatter: str) -> set:
    """Return top-level YAML-like keys without rewriting nested values."""
    keys = set()
    for line in (raw_frontmatter or "").splitlines():
        if not line or line[:1].isspace() or ":" not in line:
            continue
        key = line.split(":", 1)[0].strip().lower()
        if re.fullmatch(r"[a-zA-Z0-9_.-]+", key):
            keys.add(key)
    return keys


def preserve_frontmatter_with_missing_fields(content: str, fields: list) -> tuple:
    """Add missing top-level fields while retaining all existing YAML verbatim."""
    raw_frontmatter, body, has_frontmatter = split_markdown_frontmatter_source(content)
    if not has_frontmatter:
        lines = ["---"]
        lines.extend(f"{key}: {value}" for key, value in fields)
        lines.extend(["---", "", body.rstrip(), ""])
        return "\n".join(lines), [key for key, _value in fields]

    existing_keys = frontmatter_top_level_keys(raw_frontmatter)
    missing = [
        (key, value)
        for key, value in fields
        if key.lower() not in existing_keys
    ]
    if not missing:
        return (content or "").lstrip("\ufeff"), []

    newline = "\r\n" if "\r\n" in (content or "") else "\n"
    preserved = raw_frontmatter.rstrip("\r\n")
    additions = newline.join(f"{key}: {value}" for key, value in missing)
    merged = preserved
    if merged:
        merged += newline
    merged += additions
    normalized = (
        f"---{newline}{merged}{newline}---{newline}{newline}"
        f"{body.rstrip()}{newline}"
    )
    return normalized, [key for key, _value in missing]


def _frontmatter_field_blocks(raw_frontmatter: str) -> list:
    """Return top-level YAML-like fields with their original source blocks."""
    blocks = []
    current_key = ""
    current_lines = []
    for line in (raw_frontmatter or "").splitlines(keepends=True):
        match = re.match(r"^([a-zA-Z0-9_.-]+)\s*:", line)
        if match:
            if current_key:
                blocks.append((current_key, "".join(current_lines)))
            current_key = match.group(1).casefold()
            current_lines = [line]
        elif current_key:
            current_lines.append(line)
    if current_key:
        blocks.append((current_key, "".join(current_lines)))
    return blocks


def build_agent_skill_view(
    content: str,
    fallback_name: str,
    fallback_description: str,
    allowed_keys: set,
    forced_name: str = "",
) -> tuple:
    """Build a target-compatible SKILL.md without changing its body."""
    text = (content or "").lstrip("\ufeff")
    lines = text.splitlines(keepends=True)
    has_frontmatter = bool(lines and lines[0].strip() == "---")
    closing_index = -1
    if has_frontmatter:
        closing_index = next(
            (
                index for index, line in enumerate(lines[1:], start=1)
                if line.strip() == "---"
            ),
            -1,
        )
        has_frontmatter = closing_index >= 0
    if has_frontmatter:
        raw_frontmatter = "".join(lines[1:closing_index])
        closing_line = lines[closing_index]
        if closing_line.endswith("\r\n"):
            closing_ending = "\r\n"
        elif closing_line.endswith(("\n", "\r")):
            closing_ending = closing_line[-1]
        else:
            closing_ending = ""
        body_suffix = closing_ending + "".join(lines[closing_index + 1:])
    else:
        raw_frontmatter = ""
        body_suffix = "\n\n" + text

    blocks = _frontmatter_field_blocks(raw_frontmatter)
    existing_keys = {key for key, _block in blocks}
    newline = "\r\n" if "\r\n" in text else "\n"
    if forced_name:
        blocks = [(key, block) for key, block in blocks if key != "name"]
        blocks.insert(0, (
            "name",
            f"name: {json.dumps(forced_name, ensure_ascii=False)}{newline}",
        ))
        existing_keys.add("name")
    elif "name" not in existing_keys:
        blocks.append((
            "name",
            f"name: {json.dumps(fallback_name, ensure_ascii=False)}{newline}",
        ))
    if "description" not in existing_keys:
        blocks.append((
            "description",
            "description: "
            f"{json.dumps(fallback_description, ensure_ascii=False)}{newline}",
        ))
    kept = [block for key, block in blocks if key in allowed_keys]
    removed = sorted({key for key, _block in blocks if key not in allowed_keys})
    frontmatter = "".join(kept).rstrip("\r\n")
    rendered = f"---{newline}{frontmatter}{newline}---{body_suffix}"
    return rendered, removed
