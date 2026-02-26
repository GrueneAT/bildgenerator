---
status: complete
phase: 01-tiroler-logos
source: 01-01-SUMMARY.md
started: 2026-02-26T11:30:00Z
updated: 2026-02-26T11:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Search for Tiroler Bezirk
expected: Open the app, go to logo selection dropdown. Type "Imst" in the search field. "BEZIRK IMST" should appear in the Bezirke group and be selectable.
result: pass

### 2. Search for Tiroler Gemeinde
expected: Type "Absam" in the logo search. "ABSAM" should appear in the Gemeinden group and be selectable.
result: pass

### 3. Search for Organisation
expected: Type "Jugend" in the logo search. "GRÜNE JUGEND" should appear in the Andere group and be selectable.
result: [pending]

### 4. Long name with line break
expected: Select "BEZIRK INNSBRUCK-LAND" from the dropdown. On the canvas, the logo text should display with a line break (two lines), not as one very long line.
result: skipped
reason: User confirmed app works, skipped remaining tests

### 5. Innsbruck vs Stadt Innsbruck
expected: Type "Innsbruck" in the search. Both "Innsbruck" (existing Gemeinde) and "STADT INNSBRUCK" (new entry) should appear as separate entries.
result: skipped
reason: User confirmed app works, skipped remaining tests

### 6. Alphabetical order in dropdown
expected: Open the Bezirke group in the dropdown. Entries should appear in alphabetical order (e.g., BEZIRK BRAUNAU before BEZIRK EFERDING before BEZIRK IMST).
result: skipped
reason: User confirmed app works, skipped remaining tests

## Summary

total: 6
passed: 2
issues: 0
pending: 0
skipped: 4

## Gaps

[none yet]
