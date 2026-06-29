# Superpowers Verification Skill

This skill governs **Phase 4: Verification**. It ensures that the completed work meets high-quality engineering standards and is thoroughly documented before final sign-off.

---

## 🔍 Verification & Code Review Guidelines

When all tasks in `docs/plans/task.md` are marked as `[x]`, enter the Verification Phase and follow these steps:

### 1. Execute Full Test Suite
*   Run the complete automated test suite (not just the test file you wrote during execution).
*   Verify that no existing tests were broken (zero regressions).

### 2. Systematic Code Review
Analyze all modified files against this checklist:
*   **Documentation**: Did you add docstrings/comments to new functions? Are existing comments accurate?
*   **Errors & Edge Cases**: Are all exceptions handled properly? No silent failures?
*   **Logging**: Did you use structured logging rather than generic print/console statements?
*   **Style**: Does the code match the existing project coding style and formatting conventions?
*   **Simplicity**: Are there any unnecessary complexities or dead code?

### 3. Create or Update `docs/plans/walkthrough.md`
Generate a comprehensive walkthrough report summarizing the accomplishments:
*   **Summary of Changes**: A high-level description of what was added, modified, or removed.
*   **Validation Results**: Paste the output of the test runs, showing that all tests passed successfully.
*   **UI/UX (if applicable)**: If the changes involve front-end layouts or visual states, embed relevant screenshots or video paths to demonstrate the visual updates.
*   **Open Questions/Next Steps**: Document any future improvements or considerations that were identified during development but out of scope for this task.

---

## 🎉 Sign-Off
Once the `walkthrough.md` is complete, present the final results to the user for ultimate review and approval.
