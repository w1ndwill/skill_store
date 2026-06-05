# AI Skill Hub Manager v2.0

A Windows desktop tool for managing AI development guidelines. Write your coding rules once, sync them to any project with one click, and let your AI coding tools (Copilot, Cursor, Windsurf, Claude) pick them up automatically.

## Key Features

- **Apple-Style UI** — A clean, modern user interface inspired by macOS, featuring native-feeling card-grouped settings, a dark theme, and smooth transitions.
- **Manage Skill Files** — A unified library of Markdown files that define coding standards, design rules, and quality guidelines for AI assistants.
- **One-Click Sync** — Select a project folder, choose which skills to enable, and sync. The tool copies them to `.agent/skills/` and automatically generates an `AGENTS.md` index file.
- **Track Changes** — MD5-based status indicators show at a glance which skills are synced, outdated, or pending removal.
- **AI Skill Assistant** — Chat with an LLM (such as DeepSeek) to research the web and generate complete skill files from simple descriptions. Includes persistent chat session history.
- **Zero Installation & Offline First** — Bundles Lucide icons and Marked parser locally. It does not open local ports or run a local web server (using native WebViews).

## Quick Start

Download `AI_Skill_Hub_Manager.exe` from the [Releases](https://github.com/w1ndwill/skill_store/releases) page and run it. 

On first launch, it will create a `skills/` folder next to the executable. Put your `.md` skill files there, or create them directly inside the app.

## Building from Source

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install pywebview ddgs requests
python main.py
```

To compile into a standalone `.exe` using PyInstaller:

```bash
pip install pyinstaller
pyinstaller AI_Skill_Hub_Manager.spec
```

## Tech Stack

- **Backend**: Python + `pywebview` (native WebView2) — no Electron, no background network servers.
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6).
- **AI & Search**: DeepSeek API (with custom model support) + DuckDuckGo Search API.

## Project Structure

```
├── main.py              # Backend bridge, file I/O, AI integrations
├── static/
│   ├── index.html       # UI Layout
│   ├── index.css        # Styles & Design System
│   ├── app.js           # Frontend client logic
│   ├── lucide.min.js    # Bundled icons
│   └── marked.min.js    # Bundled Markdown parser
├── app.ico              # App icon
└── .gitignore
```

## License

MIT
