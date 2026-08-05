"""Built-in display metadata for upstream Skill collections."""


COLLECTION_DISPLAY_LOCALIZATIONS = {
    "obsidian-skills": {
        "zh": {
            "title": "Obsidian 技能集",
            "description": (
                "用于处理 Obsidian 笔记、Bases、Canvas、命令行操作和网页正文提取的技能集合。"
            ),
            "members": {
                "defuddle": {
                    "title": "网页正文提取（Defuddle）",
                    "description": (
                        "使用 Defuddle CLI 从网页提取干净的 Markdown 正文，移除导航等干扰内容；"
                        "适用于文章、文档和博客链接，不用于直接指向 .md 的链接。"
                    ),
                },
                "json-canvas": {
                    "title": "JSON 画布（JSON Canvas）",
                    "description": (
                        "创建和编辑 JSON Canvas（.canvas）文件，包括节点、连线、分组和关系；"
                        "适用于画布、思维导图和流程图。"
                    ),
                },
                "obsidian-bases": {
                    "title": "Obsidian 数据库视图（Bases）",
                    "description": (
                        "创建和编辑 Obsidian Bases（.base）文件，包括视图、筛选器、公式和汇总；"
                        "适用于表格、卡片和类数据库笔记管理。"
                    ),
                },
                "obsidian-cli": {
                    "title": "Obsidian 命令行（CLI）",
                    "description": (
                        "通过 Obsidian CLI 读取、创建、搜索和管理仓库中的笔记、任务与属性，"
                        "也支持插件和主题开发调试。"
                    ),
                },
                "obsidian-markdown": {
                    "title": "Obsidian Markdown 编辑",
                    "description": (
                        "创建和编辑 Obsidian 风格 Markdown，包括双链、嵌入、Callout、属性、"
                        "标签等 Obsidian 专用语法。"
                    ),
                },
            },
        },
    },
}
