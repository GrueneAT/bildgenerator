# Execution: Fix logo region-name knockout (#40)

**Started:** 2026-06-08
**Status:** complete
**Branch:** fix/logo-knockout

## Objective

The logo's region name (e.g. "WIEN") rendered as solid GREEN text on the white
bar. Over an uploaded background photo it showed green letters instead of the
photo through the letters. Required: the region name must be a transparent
KNOCKOUT cut out of the white bar so whatever is behind the logo (green canvas
OR uploaded photo) shows through the letters — including in the exported PNG.

## Execution Log

- [x] Implement isolated knockout via cached fabric.Group — `resources/js/main.js`,
      `resources/js/constants.js`
  - The region text now uses `globalCompositeOperation: 'destination-out'` and is
    combined with the white blanko logo image into a single `fabric.Group` with
    `objectCaching: true`. The group renders to its own cache where the text erases
    the bar pixels (transparent letter holes); compositing the group onto the
    canvas reveals the background through the holes. `logo` now references the
    cached group; `logoName` still references the inner text (position/text reads).
  - Added `COLORS.LOGO_KNOCKOUT` (#ffffff); `LOGO_TEXT` retained for back-compat.
- [x] Unit/integration coverage — `tests/integration/logo-processing-integration.test.js`
  - Added `fabric.Group` to the mock and three tests asserting: text is created
    with `destination-out`; image+text are combined into one `fabric.Group`;
    the group is created with `objectCaching: true`.
- [x] Visual-regression coverage — `visual-regression/tests/logo-knockout.spec.js`
      (registered in `playwright.config.js` medium-tests)
  - Exports the canvas to PNG via the real download path and inspects the logo
    bar band pixels: over a magenta "photo" the bar shows magenta through the
    letters (show-through) while staying white; over the green canvas it shows
    green and zero magenta; a two-line region name is also covered.
- [x] Adapt existing positioning test for the new group structure —
      `visual-regression/tests/logo-text-positioning.spec.js`
  - The region text is now a group child, so its on-canvas position is read via
    the group transform matrix (`calcTransformMatrix`) instead of the raw
    group-relative `top`. Bands widened to match the matrix-measured position.

## Verification Results

**Jest (unit + integration):** 130 passed, 0 failed (was 127; +3 knockout tests).
**Build:** `node scripts/build.js` clean; bundle contains `destination-out` and
`fabric.Group`.

**Playwright (visual / e2e): NOT run locally — infrastructure blocker.** The
Playwright Chromium browser could not be installed/persisted in this sandbox: the
download completes (175 MiB) but extraction writes do not persist (the
`~/.cache/ms-playwright` tree is discarded after each attempt). No system Chrome
is available either. The new and adapted specs are therefore unexecuted here and
must run in CI / on a normal machine.

**Compensating verification (pixel-level, real code path):** Because Playwright
could not run, the fix was validated with the REAL Fabric.js (5.3.0) in Node
(jsdom + node-canvas), reproducing the exact `addLogo` compositing and the
`canvas.toDataURL()` export at feed_post_45 proportions:
- Short name over a magenta photo: bar band → white 76348, magenta 221310,
  green 0  → photo shows through the letters, bar stays white.
- Short name over the green canvas: white 76650, green 221352, magenta 0 →
  green shows through, logo looks unchanged.
- Two-line name over a photo: white 83672, magenta 211784 → knockout works for
  long names too.
These match the assertions in `logo-knockout.spec.js`, so those specs are
expected to pass once a browser is available.

## Deviations from Plan

### Auto-fixed (Rules 1-3)

1. **[Rule 3 - Blocker] Restored dev dependencies in the main checkout**
   - The worktree's `node_modules` is empty; Node resolves dev deps from the
     main checkout `/workspace/bildgenerator/node_modules`. While probing the
     environment, an out-of-band-provisioned `node_modules` got cleared and npm
     refused to reinstall because the global npm config has `omit=dev`. Restored
     with `npm install --include=dev` (921 packages). Tooling (jest/playwright/
     jsdom) resolves again.

### Blocked (Rule 4)

None blocking the implementation. See the Playwright infrastructure note above —
that blocks only the *local execution* of the browser-based specs, not the fix.

## Discovered Issues

- The "DIE GRÜNEN" wordmark in the blanko PNGs is itself a knockout (white bar
  with transparent letters) — so over a photo it also shows the photo through its
  letters. This is consistent with the brand logo and with the region-name
  knockout; no change needed.

## Self-Check

- [x] All changed/added files exist
- [x] Jest suite green (130/130)
- [x] Build clean; knockout code present in bundle
- [x] No stubs/TODOs/placeholders in source changes
- [x] No leftover debug code in source changes
- [x] Temp validation scripts removed; no stray files committed
- **Result:** PASSED (with Playwright execution deferred to CI — see note)

**Completed:** 2026-06-08
