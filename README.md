# SkillHub

[中文说明](README_ZH.md) · [Download](https://github.com/w1ndwill/skill_store/releases) · [Changelog](CHANGELOG.md)

SkillHub is a local Windows workspace for collecting reusable AI coding skills, selecting the rules each project needs, and reviewing the exact changes before they are synchronized.

![SkillHub skill library](docs/screenshots/skill-library.png)

Current release: **3.0.2**. The redesigned interface shown here is available on the current development branch and will be included in a future release.

## Why SkillHub

- **One skill library** — Keep Markdown rules, standard `SKILL.md` folders, and multi-skill collections in one searchable library.
- **Project-specific configuration** — Enable only the skills a project needs, preview additions, updates, and removals, then sync them into `.agent/skills/`.
- **Clear collection semantics** — A disabled collection is inactive even if some child selections are remembered. Re-enabling the collection restores those selections without silently applying disabled skills.
- **Reviewable AI assistance** — Draft or improve skills with an OpenAI-compatible API while keeping generated changes staged until you accept them.
- **Safe local workflow** — Imports are validated locally, unmanaged project files are not overwritten, sync operations are backed up, and the most recent sync can be undone.
- **No bundled private skills** — New installations start with an empty writable library outside the source tree.

## Product flow

1. Import a Markdown file, ZIP archive, standard Skill folder, or a collection containing `skills/*/SKILL.md`.
2. Review the normalized metadata and any optional AI-assisted changes.
3. Add a target project and enable the skills it should use.
4. Open the sync preview, inspect the pending changes, and apply them.
5. Continue editing the source skills in SkillHub; project status shows what is current, changed, or missing.

## Interface

### Project configuration and sync preview

![Project skill configuration](docs/screenshots/project-configuration.png)

The project view keeps filters and search visible while the skill list scrolls independently. Status, enable switches, collection controls, and row actions use fixed columns so controls stay aligned.

### AI skill advisor

![AI skill advisor](docs/screenshots/ai-assistant.png)

Start from a concrete task, inspect an existing Skill, or turn a document into a reusable rule. AI access is optional; importing, organizing, and synchronizing skills do not require an API key.

### Collection and child-skill management

![Collection manager](docs/screenshots/collection-manager.png)

Collections preserve child selections when the parent is paused, but paused collections do not affect a project or its generated `AGENTS.md`.

### Markdown detail view

![Skill detail drawer](docs/screenshots/skill-detail.png)

Skill metadata and rendered Markdown can be reviewed without leaving the library. Source editing remains explicit, and deleted skills can be restored from the in-app trash.

## Getting started

Download `SkillHub.exe` from [GitHub Releases](https://github.com/w1ndwill/skill_store/releases). It is portable and does not require installation.

On first launch, SkillHub creates a writable library at `%LOCALAPPDATA%\SkillHub\skills`. Original imports are archived below `.skill-hub/imports/upstream/`; validated copies enter the active library. Runtime configuration, chat sessions, private skills, and sync backups stay outside the public repository.

## Run from source

```powershell
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py
```

Build the portable executable:

```powershell
python -m pip install pyinstaller
pyinstaller SkillHub.spec
```

## Repository layout

```text
├── main.py                  # Backend, file operations, sync and AI bridge
├── static/
│   ├── index.html           # Application structure
│   ├── index.css            # Responsive desktop UI
│   ├── app.js               # Frontend state and interactions
│   ├── lucide.min.js        # Bundled icons
│   └── marked.min.js        # Bundled Markdown renderer
├── docs/
│   ├── screenshots/         # README product screenshots
│   └── RELEASE_3.0.md       # Version 3.0 release notes
├── SkillHub.spec            # PyInstaller build entry
├── app.ico                  # Application icon
└── requirements.txt
```

## Privacy and safety

- API keys are stored only in the local runtime configuration and are displayed in masked form.
- SkillHub does not execute hooks, MCP servers, or installer scripts found in imported repositories.
- ZIP traversal, symbolic-link sources, path collisions, and preview-to-write file changes are rejected.
- `build/`, `dist/`, caches, local configuration, private skills, and private tests are excluded from Git. Release binaries are uploaded separately.

## Tech stack

- Python + [pywebview](https://pywebview.flowrl.com/) using the system WebView2 runtime
- HTML, CSS, and JavaScript with bundled UI dependencies
- Optional OpenAI-compatible chat API and DuckDuckGo web search

## License

[MIT](LICENSE)
