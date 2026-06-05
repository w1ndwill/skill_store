# AI Skill Hub Manager v2.0

A Windows desktop tool for managing AI development guidelines. Write your coding rules once, sync them to projects with one click, and let your AI coding tools (Copilot, Cursor, Windsurf, Claude) pick them up automatically.

## Key Features

- **Skill Management** — Write coding standards, design rules, and quality guidelines as Markdown files, and manage them in a unified library.
- **One-Click Sync** — Select a project folder, choose the required skills, and copy them to `.agent/skills/` while automatically generating an `AGENTS.md` index.
- **Status Tracking** — Tracks synchronization status using MD5 hashes to identify updated, synced, or outdated files.
- **AI-Assisted Generation** — Chat with LLMs (like DeepSeek) to search the web and generate new skill files. Includes multi-session history support.
- **Local Runtime** — Runs offline using native WebViews without starting a local server or opening network ports. Features local Lucide icons and Marked parser.

## Quick Start

Download `AI_Skill_Hub_Manager.exe` from the [Releases](https://github.com/w1ndwill/skill_store/releases) page and run it. 

On first launch, the app creates a `skills/` folder next to the executable. Put your `.md` skill files there, or create new ones directly within the application.

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

- **Backend**: Python + `pywebview` (native WebView2).
- **Frontend**: HTML5, CSS3, JavaScript.
- **AI & Search**: DeepSeek API + DuckDuckGo Search.

## Project Structure

```
├── main.py              # Backend bridge, file I/O, AI integrations
├── static/
│   ├── index.html       # UI Layout
│   ├── index.css        # Styles
│   ├── app.js           # Frontend client logic
│   ├── lucide.min.js    # Local icons
│   └── marked.min.js    # Local Markdown parser
├── app.ico              # App icon
└── .gitignore
```

## License

MIT
