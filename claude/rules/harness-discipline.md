# Harness Discipline

Engineering discipline for reliable multi-step agent work. Applies to any task with more than one step or file. (Harness-engineering primitives: explicit state, verification-before-done, scope, clean restart.)

## Track state explicitly — don't hold it in your head

- For multi-step work, maintain a live status list (TodoWrite, or a plan / feature list) with one entry per unit of work and an explicit status: `not-started` / `in-progress` / `blocked` / `done`.
- Update it as you go; never mark an item `done` from memory.
- Record dependencies — do prerequisite items first; don't start work that is blocked.

## Verify before you claim done — no premature victory

- "Done" requires ALL of: the target behavior is implemented; you actually RAN the verification (tests / build / lint / the app); its output shows it passing; and pre-existing checks still pass (no regression).
- Quote the command and its result as **evidence** — a claim of success without a run is not done.
- If you cannot run verification, say so explicitly and mark the item `blocked`, not `done`.
- When a task lacks tests, use `/ck:test` to add and run them.

## Stay in scope

- Work one feature / objective at a time. Don't edit unrelated files or widen the task without saying why.
- Finish the current item (verified) before starting the next.

## Leave a clean, restartable state

- Before ending, update the status list, note unresolved risks and the next step, and make sure the repo runs from a standard entrypoint.
- Use `/ck:watzup` to produce a session handoff when work spans multiple sessions.
