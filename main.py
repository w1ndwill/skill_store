import os
import sys
import json
import shutil
import hashlib
import webview

# ============================================================
# Constants & Config Paths
# ============================================================

# Resolve base directory (supports PyInstaller --onefile)
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Config always lives next to the real script/exe, not inside _MEIPASS
if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_PATH = os.path.join(APP_DIR, "config.json")

SKILL_TRANSLATIONS = {
    "zh": {
        "Git提交规范.md": {
            "title": "Git提交规范",
            "tags": ["Git", "协作", "基础"],
            "description": "遵循 Angular 规范 of Git Commit 消息标准，让项目的版本演进历史清晰、规范且可追溯。"
        },
        "frontend_optimization.md": {
            "title": "前端性能优化技能指南",
            "tags": ["性能", "优化", "前端"],
            "description": "现代 Web 应用全方位性能优化指南，旨在提升用户体验、Lighthouse 评分及核心网页指标。"
        },
        "handoff.md": {
            "title": "流程接力与工作交接技能指南",
            "tags": ["交接", "工作流", "常规"],
            "description": "AI 开发上下文无损交接与接力指南，有效解决长会话记忆衰退及多阶段开发无缝恢复问题。"
        },
        "process_optimization.md": {
            "title": "流程优化技能指南",
            "tags": ["流程", "优化", "常规"],
            "description": "系统化软件开发与系统运行流程优化指南，覆盖本地开发、构建部署及运行时执行效率。"
        },
        "python_env_isolation.md": {
            "title": "Python 虚拟环境与依赖管理规范",
            "tags": ["常规", "Python", "环境隔离"],
            "description": "指导 AI 助手在开发 Python 项目时自动创建和使用本地专属虚拟环境，杜绝全局环境污染与依赖冲突。"
        },
        "run_recording.md": {
            "title": "运行记录与可观测性技能指南",
            "tags": ["日志", "可观测性", "常规"],
            "description": "高质量系统运行记录与可观测性指南，涵盖结构化日志分级、异常监控以及诊断审计规范。"
        },
        "代码移交标准.md": {
            "title": "代码移交标准",
            "tags": ["团队协作", "工作流", "规范"],
            "description": "用于保障代码开发完成后，平滑、无缝地移交给其他开发者或运维团队的主动审查与交接清单。"
        },
        "前端性能优化规范.md": {
            "title": "前端性能优化规范",
            "tags": ["前端", "优化", "性能"],
            "description": "涵盖图片延迟加载、虚拟列表、代码分割、静态资源缓存以及打包体积压缩的本地开发与交付指南。"
        },
        "superpowers-template": {
            "title": "Superpowers 主控模版",
            "tags": ["主控", "模板", "项目级"],
            "description": "Superpowers 技能体系的主控模板文件夹，包含全局的 Agent 工作流与核心规划/脑暴/执行规约。"
        }
    },
    "en": {
        "Git提交规范.md": {
            "title": "Git Commit Guideline",
            "tags": ["Git", "Collaboration", "Basic"],
            "description": "Follow Angular specs for Git Commit messages, making version history clear, standardized, and traceable."
        },
        "frontend_optimization.md": {
            "title": "Frontend Performance Optimization Skill Guide",
            "tags": ["Performance", "Optimization", "Frontend"],
            "description": "Comprehensive performance optimization guide for modern web apps, aimed at improving user experience, Lighthouse scores, and Core Web Vitals."
        },
        "handoff.md": {
            "title": "Handoff & Context Resume Skill Guide",
            "tags": ["Handoff", "Context", "Resume"],
            "description": "AI development context handoff and resume guide, effectively solving long session memory decay and multi-stage seamless recovery."
        },
        "process_optimization.md": {
            "title": "Process Optimization Skill Guide",
            "tags": ["Process", "Optimization", "Efficiency"],
            "description": "Systematic software development and execution process optimization guide, covering local dev, build deployment, and runtime efficiency."
        },
        "python_env_isolation.md": {
            "title": "Python Virtual Env & Dependency Management Specification",
            "tags": ["Python", "Virtual Env", "Isolation"],
            "description": "Guides AI assistants to automatically create and use local virtual environments when developing Python projects, preventing global package conflicts."
        },
        "run_recording.md": {
            "title": "Run Recording & Logging Skill Guide",
            "tags": ["Observability", "Logging", "Diagnostics"],
            "description": "High-quality system logging and observability guide, covering structured log levels, exception monitoring, and diagnostics/auditing."
        },
        "代码移交标准.md": {
            "title": "Code Handoff Standards",
            "tags": ["Collaboration", "Workflow", "Handoff"],
            "description": "An active review and handoff checklist to ensure smooth, seamless transition of code to other developers or ops teams."
        },
        "前端性能优化规范.md": {
            "title": "Frontend Performance Optimization Standards",
            "tags": ["Frontend", "Performance", "Optimization"],
            "description": "Local development and delivery guide covering image lazy loading, virtual lists, code splitting, asset caching, and bundle compression."
        },
        "superpowers-template": {
            "title": "Superpowers Master Template",
            "tags": ["Master", "Template", "Project-Level"],
            "description": "Master template folder for Superpowers skill system, containing global Agent workflows and planning/brainstorming/execution rules."
        }
    }
}


# ============================================================
# Helpers
# ============================================================

def get_file_md5(file_path: str) -> str:
    if not os.path.exists(file_path) or os.path.isdir(file_path):
        return ""
    with open(file_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def check_dir_sync_status(src_dir: str, dst_root: str) -> str:
    """
    Check the synchronization status of a folder skill in a project.
    Returns:
      "synced": all files in src_dir exist in dst_root and have matching MD5s.
      "out_of_sync": at least one file exists in dst_root but has mismatched MD5 or some files are missing.
      "unloaded": none of the files in src_dir exist in dst_root.
    """
    total_files = 0
    matched_files = 0
    missing_files = 0
    mismatched_files = 0

    for root, dirs, files in os.walk(src_dir):
        for f in files:
            src_file = os.path.join(root, f)
            rel_path = os.path.relpath(src_file, src_dir)
            
            # Skip checking root README.md and AGENTS.md to avoid constant out-of-sync status
            if rel_path.lower() in ("readme.md", "agents.md"):
                continue
                
            total_files += 1
            dst_file = os.path.join(dst_root, rel_path)

            if os.path.exists(dst_file):
                if get_file_md5(src_file) == get_file_md5(dst_file):
                    matched_files += 1
                else:
                    mismatched_files += 1
            else:
                missing_files += 1

    if total_files == 0:
        return "unloaded"
    if matched_files == total_files:
        return "synced"
    if matched_files > 0 or mismatched_files > 0:
        return "out_of_sync"
    return "unloaded"


def copy_dir_recursive(src: str, dst: str):
    """Recursively copy files from src to dst, creating directories as needed."""
    for root, dirs, files in os.walk(src):
        for f in files:
            src_file = os.path.join(root, f)
            rel_path = os.path.relpath(src_file, src)
            dst_file = os.path.join(dst, rel_path)
            
            # Prevent overwriting the project-level README.md and AGENTS.md if they already exist
            if rel_path.lower() in ("readme.md", "agents.md") and os.path.exists(dst_file):
                continue
                
            os.makedirs(os.path.dirname(dst_file), exist_ok=True)
            shutil.copy2(src_file, dst_file)


def remove_dir_if_matching(src_dir: str, dst_root: str):
    """
    Recursively remove files in dst_root that match files in src_dir (same rel_path and MD5).
    Then recursively clean up empty folders.
    """
    # 1. Delete matching files
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            src_file = os.path.join(root, f)
            rel_path = os.path.relpath(src_file, src_dir)
            
            # Explicitly protect the project-level main README.md and AGENTS.md from any accidental deletion
            if rel_path.lower() in ("readme.md", "agents.md"):
                continue
                
            dst_file = os.path.join(dst_root, rel_path)
            if os.path.exists(dst_file) and not os.path.isdir(dst_file):
                if get_file_md5(src_file) == get_file_md5(dst_file):
                    try:
                        os.remove(dst_file)
                    except Exception:
                        pass

    # 2. Clean up empty subdirectories recursively
    # Walk bottom-up so we clean leaf directories first
    for root, dirs, files in os.walk(src_dir, topdown=False):
        for d in dirs:
            src_sub = os.path.join(root, d)
            rel_path = os.path.relpath(src_sub, src_dir)
            dst_sub = os.path.join(dst_root, rel_path)
            if os.path.exists(dst_sub) and os.path.isdir(dst_sub):
                try:
                    if not os.listdir(dst_sub):
                        os.rmdir(dst_sub)
                except Exception:
                    pass


def parse_markdown_metadata(file_path: str) -> dict:
    filename = os.path.basename(file_path)
    default_title = os.path.splitext(filename)[0]
    metadata = {
        "filename": filename,
        "title": default_title,
        "emoji": "\U0001f4c4",
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

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            for line in parts[1].splitlines():
                if ":" in line:
                    key, value = line.split(":", 1)
                    key = key.strip().lower()
                    value = value.strip()
                    if key == "title":
                        metadata["title"] = value
                    elif key == "emoji":
                        metadata["emoji"] = value
                    elif key == "tags":
                        metadata["tags"] = [t.strip() for t in value.split(",")]
                    elif key == "description":
                        metadata["description"] = value
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


# ============================================================
# pywebview JavaScript API Bridge
# ============================================================

class Api:
    def __init__(self):
        self._window = None
        # Load configuration on startup (with migration)
        config = self._load_config()
        self.skills_dir = config.get("skills_dir")
        self.projects = config.get("projects", [])
        self.language = config.get("language", "zh")
        self.theme = config.get("theme", "light")
        self.default_scan_dir = config.get("default_scan_dir", os.path.expanduser("~"))

    def set_window(self, window):
        self._window = window

    def _load_config(self) -> dict:
        default_skills_dir = os.path.join(APP_DIR, "skills")
        default_config = {
            "skills_dir": default_skills_dir,
            "projects": [],
            "language": "zh",
            "theme": "light",
            "default_scan_dir": os.path.expanduser("~")
        }

        # Automatic Migration from projects.json if config.json does not exist
        old_projects_path = os.path.join(APP_DIR, "projects.json")
        if not os.path.exists(CONFIG_PATH) and os.path.exists(old_projects_path):
            try:
                with open(old_projects_path, "r", encoding="utf-8") as f:
                    old_projects = json.load(f)
                migrated_config = {
                    "skills_dir": default_skills_dir,
                    "projects": old_projects,
                    "language": "zh",
                    "theme": "light",
                    "default_scan_dir": os.path.expanduser("~")
                }
                with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                    json.dump(migrated_config, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    config = json.load(f)
                    if "skills_dir" not in config or not config["skills_dir"]:
                        config["skills_dir"] = default_skills_dir
                    if "projects" not in config:
                        config["projects"] = []
                    return config
            except Exception:
                return default_config
        return default_config

    def _save_config(self):
        try:
            config = {
                "skills_dir": self.skills_dir,
                "projects": self.projects,
                "language": self.language,
                "theme": self.theme,
                "default_scan_dir": self.default_scan_dir
            }
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    # --- System Config ---

    def get_config(self):
        """Return the current system configuration (skills_dir, projects)."""
        os.makedirs(self.skills_dir, exist_ok=True)
        return {
            "skills_dir": self.skills_dir,
            "projects": self.projects,
            "language": self.language,
            "theme": self.theme,
            "default_scan_dir": self.default_scan_dir
        }

    def change_skills_dir(self):
        """Open native folder picker and change the Global Skill Library path."""
        try:
            result = self._window.create_file_dialog(
                webview.FOLDER_DIALOG,
                directory=self.skills_dir if os.path.isdir(self.skills_dir) else "C:\\"
            )
        except Exception:
            result = None
        if not result or len(result) == 0:
            return None
        new_path = os.path.normpath(result[0])
        self.skills_dir = new_path
        self._save_config()
        os.makedirs(self.skills_dir, exist_ok=True)
        return {"skills_dir": self.skills_dir}

    def pick_default_scan_dir(self):
        """Open native folder picker and select Default Projects starting directory."""
        try:
            result = self._window.create_file_dialog(
                webview.FOLDER_DIALOG,
                directory=self.default_scan_dir if os.path.isdir(self.default_scan_dir) else "C:\\"
            )
        except Exception:
            result = None
        if not result or len(result) == 0:
            return None
        new_path = os.path.normpath(result[0])
        self.default_scan_dir = new_path
        self._save_config()
        return {"default_scan_dir": self.default_scan_dir}

    def save_settings(self, settings):
        """Save config settings (skills_dir, language, theme, default_scan_dir)."""
        if "skills_dir" in settings:
            self.skills_dir = os.path.normpath(settings["skills_dir"])
            os.makedirs(self.skills_dir, exist_ok=True)
        if "language" in settings:
            self.language = settings["language"]
        if "theme" in settings:
            self.theme = settings["theme"]
        if "default_scan_dir" in settings:
            self.default_scan_dir = os.path.normpath(settings["default_scan_dir"])
        
        self._save_config()
        return {
            "skills_dir": self.skills_dir,
            "language": self.language,
            "theme": self.theme,
            "default_scan_dir": self.default_scan_dir
        }

    # --- Skills ---

    def get_skills(self):
        """Return list of all global skill metadata (files and directories)."""
        skills = []
        os.makedirs(self.skills_dir, exist_ok=True)
        if os.path.exists(self.skills_dir):
            for item in sorted(os.listdir(self.skills_dir)):
                fp = os.path.join(self.skills_dir, item)
                if os.path.isdir(fp):
                    # Check for README.md metadata inside the folder skill
                    readme_fp = os.path.join(fp, "README.md")
                    if os.path.exists(readme_fp):
                        meta = parse_markdown_metadata(readme_fp)
                    else:
                        meta = {
                            "title": item,
                            "emoji": "📦",
                            "tags": ["主控", "模板", "项目级"] if self.language == "zh" else ["Master", "Template", "Project-Level"],
                            "description": "主控模板文件夹" if self.language == "zh" else "Master template folder"
                        }
                    meta["filename"] = item
                    meta["is_dir"] = True
                    skills.append(meta)
                elif os.path.isfile(fp) and item.endswith(".md"):
                    meta = parse_markdown_metadata(fp)
                    meta["is_dir"] = False
                    skills.append(meta)
        return skills

    def get_skill_content(self, filename):
        """Return raw content of a skill file or the README.md inside a skill directory."""
        fp = os.path.join(self.skills_dir, filename)
        if os.path.isdir(fp):
            fp = os.path.join(fp, "README.md")
        if not os.path.exists(fp):
            return {"error": "File not found"}
        try:
            with open(fp, "r", encoding="utf-8") as f:
                return {"content": f.read()}
        except Exception as e:
            return {"error": str(e)}

    def save_skill(self, filename, content):
        """Save content to a global skill file or a skill directory's README.md."""
        fp = os.path.join(self.skills_dir, filename)
        if os.path.isdir(fp):
            fp = os.path.join(fp, "README.md")
        try:
            with open(fp, "w", encoding="utf-8") as f:
                f.write(content)
            return {"ok": True}
        except Exception as e:
            return {"error": str(e)}

    def delete_skill(self, filename):
        """Delete a global skill file or directory physically."""
        fp = os.path.join(self.skills_dir, filename)
        try:
            if os.path.exists(fp):
                if os.path.isdir(fp):
                    shutil.rmtree(fp)
                else:
                    os.remove(fp)
                return {"ok": True}
            return {"error": "文件不存在" if self.language == "zh" else "File does not exist"}
        except Exception as e:
            return {"error": str(e)}

    def create_skill(self, filename):
        """Create a new skill file with a dynamic bilingual template based on current settings."""
        if not filename.endswith(".md"):
            filename += ".md"
        fp = os.path.join(self.skills_dir, filename)
        if os.path.exists(fp):
            return {"error": "该文件已存在" if self.language == "zh" else "This file already exists"}
        
        if self.language == "en":
            template = """---
title: New Skill Guideline
emoji: 💡
tags: Rules, Basic
description: A brief description of the purpose and development constraints of this skill guideline.
---

# 💡 New Skill Guideline

Write down the specific development guidelines, design principles, and quality red lines for this skill here.

## 🎯 Core Rules & Details
- **Rule 1**: ...
- **Rule 2**: ...
"""
        else:
            template = """---
title: 新增技能指南
emoji: 💡
tags: 规范, 基础
description: 简短说明此项技能指南的目的与开发约束规范。
---

# 💡 新增技能指南

在这里编写针对此项技能的具体开发指南、设计原则与质量红线规约。

## 🎯 核心规范细节
- **第一条**: ...
- **第二条**: ...
"""
        try:
            os.makedirs(self.skills_dir, exist_ok=True)
            with open(fp, "w", encoding="utf-8") as f:
                f.write(template)
            return {"ok": True, "filename": filename}
        except Exception as e:
            return {"error": str(e)}

    # --- Projects ---

    def get_projects(self):
        """Return projects list with per-skill sync status."""
        result = []
        global_skills = self.get_skills()
        for proj in self.projects:
            path = proj["path"]
            entry = {"name": proj["name"], "path": path, "skills_status": {}}
            if not os.path.isdir(path):
                entry["error"] = "路径不存在" if self.language == "zh" else "Path does not exist"
                result.append(entry)
                continue
            
            # First, check status of all global skills (files & directories) in this project
            for skill in global_skills:
                fname = skill["filename"]
                is_dir = skill.get("is_dir", False)
                if is_dir:
                    global_fp = os.path.join(self.skills_dir, fname)
                    entry["skills_status"][fname] = check_dir_sync_status(global_fp, path)
                else:
                    global_fp = os.path.join(self.skills_dir, fname)
                    target_fp = os.path.join(path, ".agent", "skills", fname)
                    if os.path.exists(global_fp):
                        if os.path.exists(target_fp):
                            if get_file_md5(global_fp) == get_file_md5(target_fp):
                                entry["skills_status"][fname] = "synced"
                            else:
                                entry["skills_status"][fname] = "out_of_sync"
                        else:
                            entry["skills_status"][fname] = "unloaded"
                    else:
                        if os.path.exists(target_fp):
                            entry["skills_status"][fname] = "orphan"
            
            # Second, scan the project's own skills dir for any other files not in global
            skills_dir = os.path.join(path, ".agent", "skills")
            if os.path.exists(skills_dir):
                for item in os.listdir(skills_dir):
                    if item.endswith(".md"):
                        if item not in entry["skills_status"]:
                            entry["skills_status"][item] = "orphan"
                            
            result.append(entry)
        return result

    def add_project_via_dialog(self):
        """Open native folder picker and add as project."""
        # Determine starting folder
        start_dir = self.default_scan_dir if os.path.isdir(self.default_scan_dir) else "C:\\"
        if self.projects:
            last_path = self.projects[-1]["path"]
            parent = os.path.dirname(last_path)
            if os.path.isdir(parent):
                start_dir = parent

        try:
            result = self._window.create_file_dialog(
                webview.FOLDER_DIALOG,
                directory=start_dir
            )
        except Exception:
            result = None
        if not result or len(result) == 0:
            return None
        path = os.path.normpath(result[0])
        name = os.path.basename(path) or ("未命名项目" if self.language == "zh" else "Unnamed Project")
        
        if any(p["path"].lower() == path.lower() for p in self.projects):
            return {"error": "该项目已关联"}
        self.projects.append({"name": name, "path": path})
        self._save_config()
        return {"name": name, "path": path}

    def delete_project(self, path):
        """Remove project association (does NOT delete any files)."""
        self.projects = [p for p in self.projects if p["path"].lower() != path.lower()]
        self._save_config()
        return {"ok": True}

    # --- Sync ---

    def sync_skills(self, project_path, enabled_skills):
        """Sync selected skills to a project and regenerate AGENTS.md."""
        if not os.path.isdir(project_path):
            return {"error": "项目路径不存在" if self.language == "zh" else "Project path does not exist"}

        target_dir = os.path.join(project_path, ".agent", "skills")
        os.makedirs(target_dir, exist_ok=True)

        enabled_set = set(enabled_skills)
        active_metadata = []
        global_skills = self.get_skills()

        # 1. Sync enabled skills (files and folders)
        for fname in enabled_set:
            src = os.path.join(self.skills_dir, fname)
            if not os.path.exists(src):
                continue
            
            if os.path.isdir(src):
                # Copy folder contents recursively directly into project root
                copy_dir_recursive(src, project_path)
                
                # Fetch metadata from README.md inside the folder, if exists
                readme_fp = os.path.join(src, "README.md")
                if os.path.exists(readme_fp):
                    meta = parse_markdown_metadata(readme_fp)
                    # Also write it to target_dir / fname + ".md" for project-side local reference
                    dst_ref = os.path.join(target_dir, fname + ".md")
                    shutil.copy2(readme_fp, dst_ref)
                else:
                    meta = {
                        "title": fname,
                        "emoji": "📦",
                        "tags": ["主控", "模板", "项目级"] if self.language == "zh" else ["Master", "Template", "Project-Level"],
                        "description": "主控模板文件夹" if self.language == "zh" else "Master template folder"
                    }
                meta["filename"] = fname
                meta["is_dir"] = True
                active_metadata.append(meta)
            else:
                # Copy file to .agent/skills/
                dst = os.path.join(target_dir, fname)
                shutil.copy2(src, dst)
                
                meta = parse_markdown_metadata(src)
                meta["is_dir"] = False
                active_metadata.append(meta)

        # 2. Remove unselected file-based skills and references of unselected folder skills
        if os.path.exists(target_dir):
            for item in os.listdir(target_dir):
                if item.endswith(".md"):
                    base_name, ext = os.path.splitext(item)
                    is_enabled = (item in enabled_set) or (base_name in enabled_set)
                    if not is_enabled:
                        try:
                            os.remove(os.path.join(target_dir, item))
                        except Exception:
                            pass

        # 3. Safe cleanup of unselected directory-based skills
        for skill in global_skills:
            fname = skill["filename"]
            if skill.get("is_dir", False) and fname not in enabled_set:
                src = os.path.join(self.skills_dir, fname)
                remove_dir_if_matching(src, project_path)

        # Generate AGENTS.md in active language
        if self.language == "en":
            md = """# 🤖 Project AI Development Rules & Skill Index (AGENTS.md)

The AI collaboration rules for this project have been loaded by the **AI Skill Hub Manager** native desktop client. These guideline files are stored in the project's local directory and can be used to provide a unified architecture design specification, development guidelines, and quality red lines for AI tools such as GitHub Copilot, Cursor, Windsurf, and local Agent architectures.

## 🎯 Currently Enabled Development Skills & Rules

| Skill Name | Categories | Description | Local Link |
| :--- | :--- | :--- | :--- |
"""
            if active_metadata:
                for meta in active_metadata:
                    filename = meta["filename"]
                    emoji = meta.get("emoji", "📄")
                    title = meta.get("title", filename)
                    tags = meta.get("tags", [])
                    desc = meta.get("description", "")
                    
                    # Apply English translation if available
                    trans = SKILL_TRANSLATIONS.get("en", {}).get(filename)
                    if trans:
                        title = trans.get("title", title)
                        tags = trans.get("tags", tags)
                        desc = trans.get("description", desc)
                    
                    tags_str = ", ".join(tags)
                    if meta.get("is_dir", False):
                        link = f".agent/skills/{filename}.md"
                        link_text = f"{filename}.md"
                    else:
                        link = f".agent/skills/{filename}"
                        link_text = filename
                    desc_escaped = desc.replace("|", "\\|")
                    md += f"| {emoji} {title} | `{tags_str}` | {desc_escaped} | [{link_text}]({link}) |\n"
            else:
                md += "| *No skills loaded yet* | - | - | - |\n"

            md += "\n---\n*💡 Tip: This index file is automatically generated and maintained by the AI Skill Hub Manager desktop client. The loaded status is synchronized with the global skill library in real-time.*\n"
        else:
            md = """# 🤖 项目 AI 开发规约与技能索引 (AGENTS.md)

本项目的 AI 协同规则已由 **AI Skill Hub Manager** 原生桌面客户端装载。这些规约文件被存放在项目本地目录中，可用于为 GitHub Copilot、Cursor、Windsurf 以及本地 Agent 架构等 AI 工具提供统一的架构设计规范、开发准则与质量红线。

## 🎯 当前项目已启用的开发技能与规约

| 技能名称 | 分类标签 | 技能简述 | 本地关联链接 |
| :--- | :--- | :--- | :--- |
"""
            if active_metadata:
                for meta in active_metadata:
                    filename = meta["filename"]
                    emoji = meta.get("emoji", "📄")
                    title = meta.get("title", filename)
                    tags = meta.get("tags", [])
                    desc = meta.get("description", "")
                    
                    # Apply Chinese translation if available
                    trans = SKILL_TRANSLATIONS.get("zh", {}).get(filename)
                    if trans:
                        title = trans.get("title", title)
                        tags = trans.get("tags", tags)
                        desc = trans.get("description", desc)
                        
                    tags_str = ", ".join(tags)
                    if meta.get("is_dir", False):
                        link = f".agent/skills/{filename}.md"
                        link_text = f"{filename}.md"
                    else:
                        link = f".agent/skills/{filename}"
                        link_text = filename
                    desc_escaped = desc.replace("|", "\\|")
                    md += f"| {emoji} {title} | `{tags_str}` | {desc_escaped} | [{link_text}]({link}) |\n"
            else:
                md += "| *暂未装载任何技能* | - | - | - |\n"

            md += "\n---\n*💡 提示：本索引文件由 AI Skill Hub Manager 桌面客户端自动生成与维护，装载状态与全局技能库实时对齐。*\n"

        try:
            with open(os.path.join(project_path, "AGENTS.md"), "w", encoding="utf-8") as f:
                f.write(md)
        except Exception as e:
            return {"error": str(e)}

        return {"ok": True, "synced_count": len(active_metadata)}


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    # Safe stream handling for pythonw.exe
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w")

    api = Api()
    icon_path = os.path.join(APP_DIR, 'app.ico')
    if not os.path.exists(icon_path):
        icon_path = os.path.join(BASE_DIR, 'app.ico')

    def _set_window_icon():
        """Use Win32 API to set window icon for taskbar/dock display."""
        import ctypes
        import time
        try:
            user32 = ctypes.windll.user32
            # Retry a few times since the window may not be ready immediately
            hwnd = None
            for _ in range(10):
                hwnd = user32.FindWindowW(None, 'AI Skill Hub Manager')
                if hwnd:
                    break
                time.sleep(0.3)
            if not hwnd:
                return
            IMAGE_ICON = 1
            LR_LOADFROMFILE = 0x00000010
            WM_SETICON = 0x0080
            hicon_big = user32.LoadImageW(0, icon_path, IMAGE_ICON, 48, 48, LR_LOADFROMFILE)
            hicon_small = user32.LoadImageW(0, icon_path, IMAGE_ICON, 16, 16, LR_LOADFROMFILE)
            if hicon_big:
                user32.SendMessageW(hwnd, WM_SETICON, 1, hicon_big)
            if hicon_small:
                user32.SendMessageW(hwnd, WM_SETICON, 0, hicon_small)
        except Exception:
            pass

    window = webview.create_window(
        'AI Skill Hub Manager',
        url=os.path.join(BASE_DIR, 'static', 'index.html'),
        js_api=api,
        width=1400,
        height=900,
        min_size=(1100, 750),
        background_color='#f6f8fa'
    )
    api.set_window(window)
    webview.start(debug=False, func=_set_window_icon)

