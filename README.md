# AI Skill Hub Manager v2.0

A Windows desktop tool for managing AI development guidelines. Write your coding rules once, sync them to any project with one click, and let your AI coding tools (Copilot, Cursor, Claude) pick them up automatically.

## What it does

- **Manage skill files** — a library of Markdown files that define coding standards, design rules, and quality guidelines for AI assistants
- **Sync to projects** — pick a project folder, select which skills to enable, hit sync. The tool copies them into `.agent/skills/` and generates an `AGENTS.md` index
- **Track changes** — MD5-based status indicators show which skills are synced, outdated, or pending changes at a glance
- **AI-powered search** — describe what you need in plain language, and the built-in chat assistant searches the web and generates a complete skill file for you (requires DeepSeek API key)
- **Bilingual** — full Chinese and English UI with one-click switching

## Quick start

Download `AI_Skill_Hub_Manager.exe` from the [Releases](https://github.com/w1ndwill/skill_store/releases) page and double-click to run. Nothing to install.

On first launch it creates a `skills/` folder next to the executable. Put your `.md` skill files there, or create new ones from the app.

## Building from source

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install pywebview ddgs requests
python main.py
```

To compile into a standalone `.exe`:

```bash
pip install pyinstaller
pyinstaller --clean --noconsole --onefile --icon=app.ico --add-data "static;static" --add-data "app.ico;." --hidden-import=ddgs --hidden-import=requests --hidden-import=lxml --hidden-import=httpx --hidden-import=h2 --name AI_Skill_Hub_Manager main.py
```

## Tech stack

- **Backend**: Python with `pywebview` (WebView2) — no Electron, no network ports
- **Frontend**: Plain HTML/CSS/JS, Lucide icons, Marked for Markdown rendering
- **AI**: DeepSeek API for chat and skill generation, DuckDuckGo for web search
- **Packaging**: PyInstaller single-file `.exe`

## Project structure

```
├── main.py              # Backend: API bridge, file I/O, AI integration
├── static/
│   ├── index.html       # UI skeleton
│   ├── index.css        # Styles
│   ├── app.js           # Frontend logic
│   ├── lucide.min.js    # Icons (bundled locally)
│   └── marked.min.js    # Markdown renderer (bundled locally)
├── app.ico              # Application icon
├── config.json          # User settings (auto-generated, git-ignored)
└── .gitignore
```

## License

MIT
