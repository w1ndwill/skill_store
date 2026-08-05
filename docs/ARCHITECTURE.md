# SkillHub Architecture

SkillHub uses a layered desktop architecture. `main.py` is the composition root: it
assembles the PyWebView API, initializes process-local state, creates the window, and
starts the application. Business behavior must not be implemented there.

## Layers

- `skillhub/domain`: pure metadata, naming, compatibility, import-safety, and
  AGENTS index rules. Domain modules must not import UI, network, application, or
  infrastructure modules.
- `skillhub/application`: use-case services expressed against small repository
  ports. Application modules must not import PyWebView or concrete infrastructure.
- `skillhub/infrastructure`: filesystem persistence, configuration, sessions,
  Windows integration, target adapters, publication, and rollback primitives.
- `skillhub/presentation/api`: PyWebView-facing adapters. Each mixin owns one
  bounded responsibility and delegates reusable rules to lower layers.
- `main.py`: compatibility exports plus dependency composition and process startup.

## API composition

The desktop `Api` combines independent adapters for configuration, AI-provider
calls, Agent catalog/remote/change/runtime workflows, chat, Skill authoring,
library and collection management, import preparation/candidates/apply, project
registration, project synchronization, and global target publication.

No presentation adapter may import `main`. Cross-adapter collaboration happens
through `self` only at the composition boundary; reusable logic belongs in domain,
application, or infrastructure services.

## Safety invariants

- Skill source semantics and frontmatter are preserved; client-specific metadata
  is written only to isolated adapters.
- Import and Agent writes are bound to previews and current hashes.
- Project synchronization is planned before apply and supports rollback and undo.
- Global publication never overwrites conflicting real directories and rolls back
  partial multi-target failures.
- Mutable configuration and runtime state live under the stable per-user SkillHub
  data directory; adjacent legacy configuration is migrated on first load.
- Runtime logs and memory do not persist credentials or complete sensitive values.

## Merge gate

Before merge, run the tracked tests, focused legacy behavior suites, PyInstaller
build, archive-module inspection, and a real packaged-app GUI walkthrough. The
architecture tests enforce a small composition root, layer direction, bounded API
modules, and resolved module dependencies.
