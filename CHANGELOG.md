# RPY Writer — Changelog

## v0.2.0 — Feature Update

### New Features
- **Choice blocks** — consequence blocks now save and generate correctly. Each choice option supports full branching content (dialogue, stat changes, items, etc.)
- **Question block** — new block type (❓) supporting typed answer (player types a response, matched case-insensitively), multiple choice, and true/false. Correct and incorrect branches each support full consequence blocks
- **Shop node** — new canvas node type (🛒) with a dedicated panel. Supports up to 10 items for sale, per-item affordability checking, optional shopkeeper sprite reactions, opening/closing dialogue sequences, and a loop-back option. Connected locations show a "Go to Shop" nav option automatically
- **HUD display options** — each point system now has a selectable display style: progress bar, icon + number counter, number only, or pips (repeated icon up to max). Color picker applies to all modes
- **Game start location** — Story Master now has a separate "Game starts at" field for Day 1, independent of the daily wake-up location

### Bug Fixes
- Choice consequences no longer silently drop on panel close
- Visit tracking switched from `persistent` (global across all playthroughs) to `visit_counts` dict (per-playthrough). First-visit interactions now correctly reset on a new game
- Chapter groups renumber cleanly (1, 2, 3...) when any group is deleted or added
- Final chapter no longer attempts to jump to a non-existent next chapter label

### Known Limitations
- Shop visits do not advance time or trigger progression checks. If you want visiting a shop to cost time, connect it through a location node and use interactions there
- Always-repeat interactions do not increment `action_count`, so they do not contribute to time advance. Only first-visit interactions currently tick the action counter
- Choice consequences and question branches do not support nested choices beyond 3 levels deep
- Chapter and Region groups cannot be mixed in the same project yet

---

## v0.1.0 — Alpha Release
Initial public release.
