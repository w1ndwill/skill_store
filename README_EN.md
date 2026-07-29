# SkillHub

[中文](README.md) · [Download SkillHub](https://github.com/w1ndwill/skill_store/releases) · [MIT License](LICENSE)

SkillHub is a local Windows workspace for organizing reusable AI development rules and maintaining a clear, reviewable, and reversible Skill configuration for each project.

![SkillHub skill library](docs/screenshots/skill-library.png)

Current version: **3.2.0**

## Features

- **Unified Skill library** — Manage Markdown rules, standard `SKILL.md` folders, and collections containing multiple child Skills; add, change, or delete categories from the editor.
- **Per-project configuration** — Select the Skills each project needs without affecting other projects.
- **Sync preview** — Review additions, updates, removals, and conflicts before writing to `.agent/skills/`.
- **Collection controls** — The collection switch controls whether the collection participates in a project; child switches select individual Skills.
- **Document viewer and editor** — Review metadata and rendered Markdown, then open the source explicitly when editing is needed.
- **Clear view-only mode** — Browse Skills without selecting a project; choose a project before changing enablement.
- **SkillOps Agent** — An OpenAI-compatible model autonomously searches, reads, audits, and researches Skills through Function Calling, drafts changes, and writes only after approval.
- **Structured memory and run records** — Relevant project facts, preferences, and decisions are recalled selectively; tool and approval events are stored locally as redacted summaries.
- **Local data model** — Skill libraries, project settings, chat sessions, Agent memory, and sync backups remain on the local machine.
- **Single-instance startup** — A Windows named mutex blocks duplicate launches; a second launch focuses the existing window and exits immediately.
- **Reversible sync** — The most recent sync can be undone when affected project files have not been edited again.

## Interface

### Project Skill configuration

![Project Skill configuration](docs/screenshots/project-configuration.png)

The project view keeps categories, search, sync status, and enable controls together. The bottom action bar summarizes pending changes and opens the preview before synchronization.

### SkillOps Agent

![SkillOps Agent workspace](docs/screenshots/ai-assistant.png)

Give the Agent a Skill lifecycle goal and it autonomously selects read-only inspection, web research, and draft-preview tools. It can read `skillhub.cn/install/skillhub.md`, search the official SkillHub catalog, and safely extract the exact slug package into an isolated preview. Installation is offered only after package hashes, tree hashes, and same-name conflicts have been reviewed. It can also preview and install an original `SKILL.md` from a public GitHub repository with its content locked by SHA-256. Repository-level goals scan `skills/*/SKILL.md` and preserve the result as a Skill collection; only an explicitly selected install name is handled as one Skill. A run receives up to 32 model decisions by default, while repeated identical tool decisions stop early as a no-progress loop. If the model asks for approval in prose after a successful preview, the runtime requires the matching `apply_` call instead of accepting a false completion. Chat text is selectable, with actions for copying one message, a code block, a generated preview, or the whole conversation; the activity panel can be collapsed. The timeline shows filtered argument and result summaries and omits older entries. Memory can be viewed, disabled, or cleared. If the selected model or API does not support Function Calling, the Agent reports that limitation instead of pretending to use tools.

### Skill collections

![Skill collection manager](docs/screenshots/collection-manager.png)

Child Skills can be reviewed and selected independently. A disabled collection does not participate in project configuration, while its child selections remain stored locally.

### Skill documents

![Skill document details](docs/screenshots/skill-detail.png)

The detail panel presents source information, category, tags, metadata, and rendered Markdown before a Skill is enabled.

Enable "Generate bilingual descriptions on import" in Settings to display imported Skill titles and descriptions in the system language. Only those two metadata fields are sent to the configured OpenAI-compatible endpoint; translations stay in a local display cache and never rewrite third-party `SKILL.md`. Official SkillHub catalog installs reuse catalog-provided localized descriptions when available and keep them in the same display-only cache.

## Workflow

1. Import a `.md` file, `.zip` archive, standard Skill folder, or Skill collection.
2. Review the Skill name, description, category, and document body.
3. Add a target project and select the Skills it should use.
4. Open the sync preview and confirm the file changes.
5. Project AI tools consume the generated `AGENTS.md` and `.agent/skills/` content.

## Download and run

Download `SkillHub.exe` from [GitHub Releases](https://github.com/w1ndwill/skill_store/releases). It is a portable application and requires no installation.

On first launch, SkillHub creates the local library at:

```text
%LOCALAPPDATA%\SkillHub\skills
```

Import archives, sync state, and backups are maintained in the local data directory. The source repository does not contain personal Skills, API keys, chat sessions, or project configuration.

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
pyinstaller --clean --noconfirm SkillHub.spec
```

## Repository layout

```text
├── agent_runtime.py         # Agent loop, tool protocol, approvals, memory, and run records
├── main.py                  # Backend, file operations, sync, and Agent tool adapters
├── static/
│   ├── index.html           # Application structure
│   ├── index.css            # Interface styles
│   ├── app.js               # Frontend state and interactions
│   ├── lucide.min.js        # Bundled icon library
│   └── marked.min.js        # Bundled Markdown renderer
├── docs/screenshots/        # README interface screenshots
├── SkillHub.spec            # PyInstaller build entry
├── app.ico                  # Application icon
└── requirements.txt         # Runtime dependencies
```

## Security boundaries

- API keys are stored only in local configuration and are shown in masked form.
- Agent memory and run records exclude API keys, complete sensitive files, and hidden chain of thought.
- Every `apply_` write tool requires explicit approval; same-name targets require an explicit replace, keep-both, or cancel decision.
- Imports do not execute repository hooks, MCP servers, or installer scripts.
- ZIP traversal, symbolic-link sources, and target-path collisions are rejected.
- Unmanaged project files are not silently overwritten.
- Release builds exclude personal Skills, local configuration, tests, chat sessions, Agent memory, and run logs.

## Tech stack

- Python + [pywebview](https://pywebview.flowrl.com/)
- System WebView2 runtime
- HTML, CSS, and JavaScript
- Optional OpenAI-compatible API and DuckDuckGo web search

## License

[MIT](LICENSE)
