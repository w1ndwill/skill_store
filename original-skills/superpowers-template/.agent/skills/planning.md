# Superpowers Planning Skill

This skill governs **Phase 2: Planning**. It ensures a disciplined, step-by-step roadmap is documented and approved before any implementation begins.

---

## 📝 Planning Guidelines & File Scaffolding

Before writing any implementation code, you must create or update two central plan artifacts under the `docs/plans/` directory:

### 1. `implementation_plan.md` (技术实施方案)
This document describes the technical architecture and choices. It must include:
*   **Goal & Objectives**: A clear definition of what is being built or solved.
*   **Proposed Changes**: A structured breakdown of changes grouped by component (e.g., frontend, API layer, database) with clear markers:
    *   `[NEW]` for new files.
    *   `[MODIFY]` for modified files.
    *   `[DELETE]` for files to be removed.
*   **Verification Plan**: Details on how the changes will be verified (e.g., unit test command, manual test scenarios).

### 2. `task.md` (互动任务清单)
This is the interactive checklist of tasks. You must strictly follow these rules:
*   **Granularity**: Each task item should represent a small, isolated step taking **no more than 2-5 minutes** to execute.
*   **Format**: Use Markdown checklists:
    *   `- [ ]` for pending tasks.
    *   `- [/]` for the active, in-progress task.
    *   `- [x]` for successfully completed and verified tasks.
*   **TDD Steps**: Explicitly include "Write/update unit test" as a task step *before* or *during* the implementation of each feature item.

---

## 🚦 Transition Rule
Once both files are written under `docs/plans/`, present them to the user for feedback. **STOP and wait for the user's explicit approval** before transitioning to Phase 3 (Execution).
