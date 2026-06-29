# Superpowers TDD Execution Skill

This skill governs **Phase 3: Execution**. It ensures that implementation is disciplined, test-driven, and tracked incrementally.

---

## 🛠️ Execution & TDD Guidelines

During the Execution Phase, you must strictly adhere to the following cycle for each item in `docs/plans/task.md`:

### 1. The 2-Minute Task Loop (红-绿-重构循环)

```
[Mark as [/]] ──> [Write/run test (Red)] ──> [Implement (Green)] ──> [Run test (Green)] ──> [Refactor] ──> [Mark as [x]]
```

1.  **Select Task**: Pick the next pending item from `docs/plans/task.md`. Change its checkbox to `[/]` (in progress) and save the file.
2.  **Write/Update Test**:
    *   Create or update a test file to describe the desired behavior.
    *   Run the test and verify that it fails (Red stage).
3.  **Implement**:
    *   Write the *minimum* amount of code required to make the test pass.
    *   Keep your changes localized, clean, and follow the existing style.
4.  **Verify & Pass**:
    *   Run the test command. Ensure it passes successfully (Green stage).
5.  **Refactor**:
    *   Clean up any duplicate code, optimize variable names, or improve efficiency.
    *   Rerun the tests to ensure no regressions occur.
6.  **Mark Complete**:
    *   Change the checkbox in `docs/plans/task.md` to `[x]` (completed) and save.

### 2. Guardrails during Execution
*   **One Task at a Time**: Never work on multiple tasks in parallel. Always mark the current task as `[/]` before making edits.
*   **Prevent Scope Creep**: Do not write extra code that is "nice to have" but not defined in the current sub-task or implementation plan.
*   **Keep Git Clean**: Regularly commit your progress with descriptive messages once an item or a set of closely related items is completed.
