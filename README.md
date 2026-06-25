# AI Skill Hub Manager

A small Windows desktop app for managing AI coding rules across projects.

Write your guidelines as Markdown files, pick which ones a project needs, and sync them over. Tools like Copilot, Cursor, Windsurf, and Claude will read them automatically from the `.agent/skills/` directory.

## What it does

- **Skill library** — Keep all your coding standards, design conventions, and review checklists in one place as `.md` files.
- **Tagging & filtering** — Assign category tags to skills and filter by them in the UI.
- **One-click sync** — Choose a project folder, tick the skills you want, and they get copied into `.agent/skills/` with an auto-generated `AGENTS.md` index.
- **Sync status** — Compares MD5 hashes so you can tell at a glance which files are up to date, modified, or missing.
- **AI chat** — Talk to an LLM (e.g. DeepSeek) to search the web and draft new skill files. Supports multiple chat sessions.
- **Fully local** — Renders via the system's WebView2 engine. No local server, no open ports.

## Getting started

Grab `AI_Skill_Hub_Manager.exe` from the [Releases](https://github.com/w1ndwill/skill_store/releases) page and run it — no install needed.

On first launch it creates a `skills/` folder next to the exe. Drop your `.md` files in there, or create new ones from the app.

## Build from source

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install pywebview ddgs requests
python main.py
```

Package into a standalone exe:

```bash
pip install pyinstaller
pyinstaller AI_Skill_Hub_Manager.spec
```

## Tech stack

- Python + [pywebview](https://pywebview.flowrl.com/) (native WebView2)
- HTML / CSS / JS frontend
- DeepSeek API + DuckDuckGo for AI chat & web search

## Project layout

```
├── main.py              # Backend: file I/O, API bridge, AI integration
├── static/
│   ├── index.html       # Page structure
│   ├── index.css        # Styles
│   ├── app.js           # Frontend logic
│   ├── lucide.min.js    # Icons (bundled)
│   └── marked.min.js    # Markdown parser (bundled)
├── app.ico              # App icon
└── .gitignore
```

## License

MIT
