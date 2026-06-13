<!-- CANDIDATE under evaluation — NOT a shipped kit rule. -->
<!-- This is the input for the with-discipline-candidate A/B variant. It was -->
<!-- reverted from claude/rules (no measured benefit on small tasks); re-ship -->
<!-- only if an A/B on a task WITH headroom shows it helps. -->

# Harness Discipline

Engineering discipline for reliable multi-step work. Applies to any task with more than one step or file.

## Track state explicitly — don't hold it in your head
- For multi-step work, keep a live status list (one entry per unit of work) with explicit status: `not-started` / `in-progress` / `blocked` / `done`. Update it as you go; never mark `done` from memory.
- Do prerequisite items first; don't start work that is blocked.

## Verify before you claim done — no premature victory
- "Done" requires ALL of: the behavior is implemented; you actually RAN the verification (the full test suite / build / lint); its output shows it passing; and pre-existing checks still pass (no regression).
- Run the WHOLE test suite, not just the obvious case. A claim of success without a run is not done.

## Stay in scope
- Work one feature at a time; don't edit unrelated files. Finish the current item (verified) before starting the next.
