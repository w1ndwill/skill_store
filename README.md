# SkillHub

A small Windows desktop app for managing AI coding rules across projects.

Current version: **3.0.1** · [3.0 release notes](docs/RELEASE_3.0.md) · [Changelog](CHANGELOG.md)

Write your guidelines as Markdown files, pick which ones a project needs, and sync them over. Tools like Copilot, Cursor, Windsurf, and Claude will read them automatically from the `.agent/skills/` directory.

## What it does

- **Skill library** — Keep all your coding standards, design conventions, and review checklists in one place as `.md` files.
- **AI-free import validation** — Import Markdown, ZIP, one `SKILL.md` folder, or a collection containing `skills/*/SKILL.md` with local metadata normalization, per-skill deduplication, safety checks, and upstream archiving. No API key is required.
- **Direct-copy discovery** — New files copied straight into the active `skills/` directory are detected on refresh or next launch and can be optimized in place or registered unchanged.
- **Collapsed collections** — Standard repositories and bundles containing `.agent/skills/*.md` appear as one parent card; child skills can be enabled independently and only enabled members are synced.
- **Reviewable AI adaptation** — Existing frontmatter is preserved, and AI rewrites stay staged until their unified diff is explicitly accepted.
- **Tagging & filtering** — Assign category tags to skills and filter by them in the UI.
- **One-click sync** — Choose a project folder, tick the skills you want, and they get copied into `.agent/skills/` with an auto-generated `AGENTS.md` index.
- **Sync status** — Compares MD5 hashes so you can tell at a glance which files are up to date, modified, or missing.
- **AI chat** — Talk to an LLM (e.g. DeepSeek) to search the web and draft new skill files. Supports multiple chat sessions.
- **Fully local** — Renders via the system's WebView2 engine. No local server, no open ports.

## Getting started

Grab `SkillHub.exe` from the [Releases](https://github.com/w1ndwill/skill_store/releases) page and run it — no install needed.

On first launch SkillHub creates a writable active library in the user data directory (`%LOCALAPPDATA%\SkillHub\skills` on Windows) and seeds it from the read-only `original-skills/` baseline. Local initialization completes metadata, removes template runtime residue, and resolves bundled-skill collisions without AI. Use **Import Skill** for `.md`, `.zip`, or skill folders; importing also works without AI. Original downloads are archived under the active library's `.skill-hub/imports/upstream/`, while only validated copies enter the active library.

The repository no longer keeps a second active `skills/` copy: `original-skills/` preserves upstream originals, while optimization, imports, and edits happen only in the external active library selected in Settings.

## Build from source

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install -r requirements.txt
python main.py
```

Package into a standalone exe:

```bash
pip install pyinstaller
pyinstaller SkillHub.spec
```

## Tech stack

- Python + [pywebview](https://pywebview.flowrl.com/) (native WebView2)
- HTML / CSS / JS frontend
- DeepSeek API + DuckDuckGo for AI chat & web search

## Project layout

```
├── main.py              # Backend: file I/O, API bridge, AI integration
├── original-skills/     # Read-only upstream originals bundled with the app
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
