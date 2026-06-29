# Superpowers Brainstorming Skill

This skill governs **Phase 1: Brainstorming**. It ensures the agent thoroughly analyzes the problem space before committing to any design decisions.

---

## 🧠 Brainstorming Checklist & Guidelines

When in Brainstorming Phase, you must:

### 1. Codebase Exploration & Deep Research
*   **Locate context**: Use grep search to find relevant functions, imports, and variables related to the task.
*   **Read files**: Open the core files to understand the existing logic, patterns, conventions, and style.
*   **Review dependencies**: Check if there are existing packages/utilities that can be reused rather than writing new code from scratch.

### 2. Identify Requirements & Edge Cases
*   **Deconstruct requests**: Separate the user's requirements into functional and non-functional requirements.
*   **Analyze edge cases**: Think about what could fail (e.g., null values, network timeouts, invalid formats, race conditions) and write them down.
*   **Performance check**: Consider how the proposed feature scales with large datasets or high concurrency.

### 3. Formulate Design Alternatives
*   **Draft options**: Formulate 2-3 different technical approaches (e.g., synchronous vs. asynchronous, database index vs. memory cache).
*   **Pros & Cons**: Write a brief comparison of each option, highlighting:
    *   Complexity & Implementation speed.
    *   Maintainability & Robustness.
    *   Performance implications.

### 4. Present to User
*   **No Coding**: Do not modify any codebase files during this phase.
*   **Interactive Review**: Present your findings and design options clearly to the user, highlighting any trade-offs or open questions, and wait for their input.
