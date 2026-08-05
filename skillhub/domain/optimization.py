"""Conservative AI optimization invariants."""

import re

from skillhub.domain.frontmatter import split_markdown_frontmatter_source


AI_OPTIMIZATION_MAX_ADDED_LINES = 6
AI_OPTIMIZATION_MIN_ADDED_CHARS = 300
AI_OPTIMIZATION_MAX_ADDED_CHARS = 2000
def guard_conservative_ai_optimization(original: str, optimized: str) -> str:
    """Keep source semantics immutable while accepting bounded explanatory additions."""
    original_raw, original_body, original_has = split_markdown_frontmatter_source(
        original
    )
    _optimized_raw, optimized_body, _optimized_has = split_markdown_frontmatter_source(
        optimized
    )
    if not original_has:
        raise ValueError("AI semantic guard requires normalized frontmatter")

    def meaningful_lines(body: str) -> list:
        return [
            re.sub(r"[ \t]+", " ", line.strip())
            for line in (body or "").splitlines()
            if line.strip()
        ]

    original_lines = meaningful_lines(original_body)
    optimized_lines = meaningful_lines(optimized_body)
    cursor = 0
    for original_line in original_lines:
        try:
            cursor = optimized_lines.index(original_line, cursor) + 1
        except ValueError as error:
            raise ValueError(
                "AI changed, removed, or reordered existing Skill instructions"
            ) from error

    added_lines = len(optimized_lines) - len(original_lines)
    if added_lines > AI_OPTIMIZATION_MAX_ADDED_LINES:
        raise ValueError("AI added too many new instruction lines")

    original_size = len("\n".join(original_lines))
    optimized_size = len("\n".join(optimized_lines))
    added_char_budget = max(
        AI_OPTIMIZATION_MIN_ADDED_CHARS,
        min(AI_OPTIMIZATION_MAX_ADDED_CHARS, original_size // 2),
    )
    if optimized_size - original_size > added_char_budget:
        raise ValueError("AI additions are too large for conservative optimization")

    frontmatter_newline = "\r\n" if "\r\n" in original_raw else "\n"
    body_newline = "\r\n" if "\r\n" in original_body else frontmatter_newline
    normalized_body = (
        optimized_body.replace("\r\n", "\n")
        .replace("\r", "\n")
        .rstrip("\n")
        .replace("\n", body_newline)
    )
    preserved = original_raw.rstrip("\r\n")
    return (
        f"---{frontmatter_newline}{preserved}{frontmatter_newline}"
        f"---{frontmatter_newline}{frontmatter_newline}"
        f"{normalized_body}{body_newline}"
    )
