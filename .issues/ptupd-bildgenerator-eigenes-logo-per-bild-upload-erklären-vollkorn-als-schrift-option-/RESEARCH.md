# Research: Bildgenerator — Eigenes Logo erklären, Vollkorn als Schrift-Option, Beispiel-Seite

**Researched:** 2026-06-07
**Issue:** ptupd
**Confidence:** HIGH (all findings verified against real code at cited file:line; design-system Vollkorn weights verified against the hosted CSS source)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Entscheidung 1 — Eigenes Logo:** Kurzer, gut sichtbarer Hinweis im Wizard-Schritt der Logo-Auswahl: Gruppen mit eigenem Logo wählen **„kein Logo"** und fügen es über **„Bild hinzufügen"** selbst ein. Reiner UI-/Texthinweis, keine neue Logik (der Weg funktioniert schon heute). Platzierung an der richtigen Stelle der Logo-Auswahl, Tailwind, kein Inline-Style.
- **Entscheidung 2 — Vollkorn mit BESCHREIBENDER Beschriftung:** Auswahl wird **nicht mit Markennamen** beschriftet. Zwei Optionen, beschreibend benannt (Vorschlag): **„Standardschrift — Headlines & Fließtext"** → Barlow Semi Condensed (Default); **„Betonte Serifenschrift — für Zitate & Akzente"** → Vollkorn. Kurzer Hinweis an der Auswahl, wann welche Schrift sinnvoll ist, mit Verweis auf die Beispiel-Seite. Technische Einbindung wie Barlow: Google Fonts CDN (Vollkorn SIL OFL, **kein Vendoring**), Canvas/Fabric.js mit `fontFamily`/`fontWeight`/`fontStyle` + FontFaceObserver. **Default bleibt Barlow.**
- **Entscheidung 3 — Beispiel-Seite:** Eigene Hilfe-/Beispiel-Seite „Welche Schrift wofür" mit Beispielbildern, im flomotlik/Grüne-Design-System-HTML-Stil (gehostetes Stylesheet). Verlinkt von der Schrift-Auswahl. Beispielbilder: generierte Bildgenerator-Outputs.
- **Entscheidung 4 — Konsistenz & Tests:** Beschreibende Labels gelten für **beide** Schriften. Visual-Regression/Unit-Tests für neue Auswahl-UI + Vollkorn-Rendering ergänzen; Suite grün. Repo-Regeln: kein Inline-Style, Tests treiben die UI wie ein:e Nutzer:in, pixelmatch. **Kein Werkzeug-Attribut in Commits/Code.**

### Claude's Discretion
- Ort/Form der Schrift-Auswahl-UI (Wizard-Text-Schritt vs. erweiterte Optionen) — Research empfiehlt unten konkret.
- Finale Wortlaute der beschreibenden Labels & des Erklärhinweises.
- Welche konkreten Beispielbilder die Beispiel-Seite zeigt und wie sie erzeugt werden.

### Deferred Ideas (OUT OF SCOPE)
- Keine genannt. Keine neue Logo-Logik (nur Text). Keine Änderung am Default (bleibt Barlow).
</user_constraints>

## Summary

Three independent, low-coupling changes on top of the merged z6qfk Barlow work. The font infrastructure (Google Fonts `<link>`, FontFaceObserver preload, centralized `AppConstants.FONTS`) is already in place; this issue mostly **adds a second font** to that existing machinery and **re-introduces a tiny picker** that was previously removed.

**Feature 1 (logo hint)** is pure markup: a Tailwind-styled hint added to the Step-1 logo-selection block in `index.html` (around lines 636–652). No JS. The `value=""` option labelled "Logo auswählen..." IS the "kein Logo" path; the toggle `#logo-toggle` also disables the logo. The hint just tells users to leave the logo off and use "Bild hinzufügen" (Step 3, `index.html:910-913`).

**Feature 2 (Vollkorn + descriptive picker)** is the core work. Today the text font is hardcoded at `event-handlers.js:141` (`const selectedFont = AppConstants.FONTS.DEFAULT_TEXT`). There is NO picker in the DOM. The change: add a 2-option `<select>` in the Step-3 text section, add a `FONT_OPTIONS` map to `constants.js` (descriptive label → family/weight/style), read it in the `#add-text` handler, add a `change` handler that re-renders the active text object via the existing `loadFont()` pattern (`handlers.js:1-19`), add the Vollkorn Google-Fonts `<link>` to `index.html` + `impressum.html`, and extend `PRELOAD_FONTS`/FontFaceObserver to cover the second family. Vollkorn is a serif → must wait on FontFaceObserver before canvas render or it falls back.

**Feature 3 (examples page)** is a new static HTML page at repo root (mirroring `impressum.html`, which `scripts/build.js:createStaticPage` already copies to `build/`), styled with the hosted flomotlik design system, linked from the picker hint. Example images are generated bildgenerator PNGs — easiest via the visual-regression Playwright harness (which already drives the real app like a user) or hand-exported and committed under `resources/`.

**Primary recommendation:** Put the picker in the Step-3 "Text hinzufügen" section (`index.html`, between the color/line-height grid at ~line 820 and the `#add-text` button at line 887), driven by a new `AppConstants.FONTS.OPTIONS` array. Default option = Barlow. Mirror z6qfk's font wiring exactly for Vollkorn. Vollkorn weights: **400 + 900 upright** (match the design-system import `Vollkorn:ital,wght@0,400;0,900` — no italic is actually loaded there).

## Codebase Analysis

### Relevant Code
| File | Purpose | Relevance |
|------|---------|-----------|
| `resources/js/constants.js:82-95` | `AppConstants.FONTS` block (FAMILY, DEFAULT_TEXT, DEFAULT_LOGO, WEIGHT_TEXT=900, WEIGHT_LOGO=800, WEIGHT_BOOK=400, PRELOAD_FONTS) | Add `OPTIONS` map + Vollkorn preload entries here |
| `resources/js/event-handlers.js:131-176` | `setupTextHandler()` — `#add-text` click; line 141 hardcodes `selectedFont` | Read picker value instead of hardcoding |
| `resources/js/event-handlers.js:20-75` | `setupCanvasObjectHandlers()` — text-color/line-height/etc. change handlers | Add a `#font-style-select` change handler here (or in handlers.js) |
| `resources/js/handlers.js:1-19` | `loadFont(font)` — FontFaceObserver-gated `fontFamily` swap on active text object | Existing re-render pattern; extend `customFonts` array to include Vollkorn |
| `resources/js/wizard.js:21-33` | `preloadFonts()` — builds FontFaceObserver per `PRELOAD_FONTS` entry, all on `FONTS.FAMILY` (single family) | Must extend to preload a SECOND family (Vollkorn) |
| `resources/js/main.js:203-217` | Logo overlay text creation (`DEFAULT_LOGO`, `WEIGHT_LOGO`) | Do NOT touch — logo font stays Barlow |
| `index.html:22-25` | Barlow Google-Fonts preconnect + stylesheet `<link>` | Add Vollkorn `<link>` adjacent |
| `index.html:636-652` | Step-1 logo-selection `<select>` (`#logo-selection`, `value=""` = kein Logo) | Feature 1 hint goes here |
| `index.html:653-663` | `#logo-toggle` checkbox ("Logo am unteren Rand hinzufügen") | Context for the hint wording |
| `index.html:772-890` | Step-3 `#text-section` (textarea, color, line-height, shadow, align, `#add-text`) | Feature 2 picker goes here (~before line 887) |
| `index.html:908-913` | "Bild hinzufügen" (`#add-image` label) in Step-3 elements section | The path the hint refers to |
| `impressum.html:18-21` | Barlow Google-Fonts `<link>` in static page head | Mirror Vollkorn `<link>` here too |
| `scripts/build.js:63-123` | `createProductionHTML()` + `createStaticPage()` | Confirms Google-Fonts `<link>` survives build untouched; pattern for new examples page |

### Interfaces
<interfaces>
// From resources/js/constants.js:82-95 — current FONTS block (single family)
AppConstants.FONTS = {
    FAMILY: "Barlow Semi Condensed",
    DEFAULT_LOGO: "Barlow Semi Condensed",
    DEFAULT_TEXT: "Barlow Semi Condensed",
    WEIGHT_TEXT: 900,    // default canvas text (Black)
    WEIGHT_LOGO: 800,    // logo overlay text (ExtraBold)
    WEIGHT_BOOK: 400,    // body / book equivalent (Regular)
    PRELOAD_FONTS: [     // each entry becomes `new FontFaceObserver(FAMILY, entry)`
        { weight: 900, style: 'italic' },
        { weight: 900 },
        { weight: 400 },
        { weight: 800 }
    ]
}
// NOTE: PRELOAD_FONTS entries today implicitly all belong to FONTS.FAMILY
// (see wizard.js:22). To preload a second family, either add a family field
// per entry or add a parallel preload list.

// From resources/js/event-handlers.js:131-176 — the ONLY text-creation site for user text
EventHandlerUtils.setupTextHandler()  // binds '#add-text' click
//   line 141:  const selectedFont = AppConstants.FONTS.DEFAULT_TEXT;   // <-- hardcoded
//   line 143:  new fabric.Text(value, { fontFamily: selectedFont,
//                  fontSize: canvas.width/2,
//                  fontWeight: AppConstants.FONTS.WEIGHT_TEXT,   // line 146 (always 900)
//                  fontStyle: "normal",                          // line 147
//                  ... })

// From resources/js/handlers.js:1-19 — existing FontFaceObserver-gated re-render
function loadFont(font)  // operates on canvas.getActiveObject()
//   customFonts = ['Barlow Semi Condensed']  // line 3 — extend with 'Vollkorn'
//   if (customFonts.includes(font)) { new FontFaceObserver(font).load().then(() => {
//        text.set("fontFamily",""); text.set("fontFamily", font); canvas.renderAll(); }) }
//   NOTE: this fn currently has NO caller wired to a picker (picker was removed).

// From resources/js/wizard.js:21-33 — font preload
function preloadFonts()
//   const fonts = AppConstants.FONTS.PRELOAD_FONTS.map(
//       d => new FontFaceObserver(AppConstants.FONTS.FAMILY, d));   // single family
//   fonts.forEach(f => f.load().then(...).catch(...));

// From resources/js/event-handlers.js:20-72 — canvas object change handlers (model to follow)
//   '#text-color' { change }, '#line-height' { change }, 'input[name="align"]' { change }
//   each reads canvas.getActiveObject(), checks type==="text", calls setValue(prop, val).

// setValue(prop, value) — global helper used by all the above to mutate active text +
//   renderAll (defined in resources/js/ helpers; used at event-handlers.js:24,42,49,etc.)

// FontFaceObserver — bundled vendor (vendors.min.js). Constructor:
//   new FontFaceObserver(family, { weight, style }).load() -> Promise
</interfaces>

### Design-System Vollkorn provisioning (verified)
The Grüne-AT design system (`/workspace/design-system/design-system/design-system.css:2`) imports:
```
@import "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,900&family=Vollkorn:ital,wght@0,400;0,900&display=swap";
```
- **Vollkorn weights actually loaded: 400 and 900, UPRIGHT only** (`0,400;0,900`). Despite the `ital` axis being declared, NO italic Vollkorn cut is requested in the DS. The token is `--gat-font-emphasis: "Vollkorn", serif`.
- **Recommendation:** Add a standalone Vollkorn `<link>` to the bildgenerator HTML matching the DS exactly: `family=Vollkorn:ital,wght@0,400;0,900`. Use **weight 900** for the canvas accent text to match Barlow's heavy default visual weight (both pickers' default weight stays consistent at the heavy cut), or 400 if a lighter accent is preferred — pick one in the plan and pin it in `OPTIONS`. Do NOT request italic unless the plan explicitly wants it (DS doesn't load it; requesting `1,...` would add an unloaded descriptor and Fabric would fall back).
- The bildgenerator already links `design-system.css` (`index.html:29`), so Vollkorn is *technically* already pulled in by the DS `@import` at runtime. **However**, relying on that alone is fragile (the DS `@import` is for DS CSS, not guaranteed for canvas use, and `display=swap` + FontFaceObserver expectations differ). Mirror z6qfk's explicit, self-contained `<link>` so the canvas font is provisioned by the app itself, not a transitive DS import.

### Reusable Components
- `loadFont()` (handlers.js) — ready-made FontFaceObserver-gated re-render for the active text object; the planner should wire the picker's `change` event to it (after extending `customFonts` to include `'Vollkorn'`).
- `setValue(prop, value)` global helper — used by all existing text-property change handlers; could be used for simple props but `loadFont` is the correct one for `fontFamily` because of the FontFaceObserver gate.
- `createStaticPage(filename)` (build.js:107) — already generic; supports any new root-level static HTML page (currently only `impressum.html`). Add the examples page filename to the `build()` sequence (build.js:33).
- `compareWithReference()` + `setupTestEnvironment()` + `setupBasicTemplate()` (visual-regression/tests/test-utils.js) — drive the real app for new visual tests.

### Potential Conflicts
- `preloadFonts()` (wizard.js:22) maps every `PRELOAD_FONTS` entry onto the SINGLE `FONTS.FAMILY`. Naively adding Vollkorn entries to `PRELOAD_FONTS` would create `FontFaceObserver("Barlow Semi Condensed", {weight:400})` for a Vollkorn entry — WRONG. The planner must change the preload to carry a family per entry (e.g. `{ family, weight, style }`) or add a second preload loop. This is the single most error-prone spot.
- The picker `<select>` must NOT carry inline styles — use the existing `gat-select text-method w-full` classes (see `index.html:794-798` for the color select pattern).
- Removing/renaming the previously-removed `#font-style-select` id: grep confirms NO current `#font-style-select` references remain in JS/HTML, so reusing that id is safe and won't clash.

### Code Patterns in Use
- Centralized constants in `AppConstants` (constants.js), exposed via `window.AppConstants`.
- jQuery event binding via `EventHandlerUtils.bindHandler(selector, event, fn)` and `bindHandlers(map)`.
- All canvas text mutations go through `setValue(...)` or direct `text.set(...)` + `canvas.renderAll()`.
- Tailwind utility classes only; custom CSS only in `resources/css/style.css` (CLAUDE.md rule).
- Static pages: plain HTML at repo root, copied to `build/` by `createStaticPage`, design-system + app CSS swapped in at build.

## Standard Stack
| Library | Version | Purpose | Why Standard | Confidence |
|---------|---------|---------|--------------|------------|
| Google Fonts CDN | n/a | Serve Barlow Semi Condensed + Vollkorn (SIL OFL) | Already used for Barlow (z6qfk); CLAUDE.md mandates CDN, no vendoring | HIGH |
| FontFaceObserver | bundled in `vendors.min.js` | Gate canvas render until web font ready | Already used (`wizard.js`, `handlers.js`) | HIGH |
| Fabric.js | bundled | Canvas text objects (`fontFamily`/`fontWeight`/`fontStyle`) | Core canvas lib | HIGH |
| flomotlik design system | `https://flomotlik.github.io/claude-code/design-system.css` | Style the examples page (Feature 3) | Hosted, per workspace memory + RESEARCH.html convention | HIGH |
| Grüne-AT design system | `https://grueneat.github.io/design-system/design-system.css` | App-facing brand CSS (already linked) | Already in `index.html:29` | HIGH |

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wait for web font before canvas render | Custom `document.fonts.ready` polling | `FontFaceObserver` (already bundled, already used) | z6qfk established this; consistent handling |
| Re-render active text on font change | New mutation code | Existing `loadFont()` (handlers.js:1-19) | Already FontFaceObserver-gated and correct |
| Ship the examples page into `build/` | New copy logic | `createStaticPage()` (build.js:107) | Generic; already copies impressum.html |
| Style the examples page | Bespoke CSS | Hosted flomotlik `design-system.css` + component classes | Workspace convention; no vendoring |
| Provision Vollkorn | Self-host font files in repo | Google Fonts `<link>` | SIL OFL but CLAUDE.md forbids vendoring; mirror Barlow |

## Architecture Patterns
### Recommended Approach
The recommended approach maps to the five flow steps in RESEARCH.html:

- **Step 1 — `constants.js`:** add `FONTS.OPTIONS` (array of `{ id, label, family, weight, style }`), e.g.
   `[{ id:'standard', label:'Standardschrift — Headlines & Fließtext', family:'Barlow Semi Condensed', weight:900, style:'normal' }, { id:'accent', label:'Betonte Serifenschrift — für Zitate & Akzente', family:'Vollkorn', weight:900, style:'normal' }]`. Keep `DEFAULT_TEXT` = Barlow. Change `PRELOAD_FONTS` to carry a `family` per entry (or add Vollkorn preload entries with explicit family) and add Vollkorn 400/900.
- **Step 2 — `index.html` / `impressum.html`:** (a) Step-1 logo block: add the Tailwind hint paragraph; (b) Step-3 text section: add the `<select id="font-style-select" class="gat-select text-method w-full">` with two `<option>`s (descriptive labels), a short hint paragraph, and a link to the examples page; (c) head: add Vollkorn `<link>` next to Barlow's (lines 22-25). Mirror in `impressum.html` head.
- **Step 3 — `event-handlers.js`:** replace hardcoded `selectedFont`/`fontWeight`/`fontStyle` (lines 141,146,147) with values read from the selected `OPTIONS` entry (via `#font-style-select`). Add a `#font-style-select` `change` handler (in `setupCanvasObjectHandlers`) that, for the active text object, applies the option's family/weight/style through `loadFont()` (extend `customFonts` to include `'Vollkorn'`) + sets weight/style. Also extend `wizard.js` `preloadFonts()` to preload BOTH families (Barlow + Vollkorn) per their weights/styles.
- **Step 4 — examples page + build:** new `schriften.html` (or similar) at repo root; add to `build.js` `build()` via `createStaticPage('schriften.html')`. Link it from the picker hint.
- **Step 5 — Tests + baselines:** new visual-regression spec for Vollkorn canvas text + picker; register it in `playwright.config.js` (medium-tests). Optional Jest unit test for the `OPTIONS` lookup. Regenerate references (`npm run generate-references`) — Vollkorn changes pixels so new/updated baselines are expected.

### Anti-Patterns to Avoid
- **Mapping Vollkorn weights onto `FONTS.FAMILY` in `preloadFonts()`** — produces wrong FontFaceObserver descriptors; Vollkorn won't be preloaded. (See Potential Conflicts.)
- **Brand-name labels** ("Vollkorn"/"Barlow") in the UI — explicitly forbidden by CONTEXT.md; use descriptive labels.
- **Requesting Vollkorn italic** (`1,400`/`1,900`) when the DS only loads upright — Fabric would fall back / load an extra unused descriptor. Only request italic if the plan deliberately adds it.
- **Inline styles** anywhere — CLAUDE.md hard rule; Tailwind/`gat-*` classes only. (Note: the existing chevron `style="transform: rotate(-90deg)"` at index.html:769/905 is legacy; do not add new inline styles.)
- **Manipulating the canvas directly in visual tests** — CLAUDE.md: drive the UI like a user (select the picker option, click `#add-text`).
- **Vendoring Vollkorn font files** — forbidden; CDN only.
- **Tool attribution in commits/code/comments** — forbidden workspace-wide.

## Common Pitfalls
### Serif fallback on canvas (Vollkorn not loaded at render time)
**What goes wrong:** First `#add-text` with Vollkorn renders in a fallback serif because the web font isn't ready.
**Why it happens:** Google Fonts `display=swap` + canvas snapshots the glyphs at draw time; Fabric doesn't auto-re-render when the font finishes loading.
**How to avoid:** Preload Vollkorn (400+900) in `preloadFonts()`; on picker change use `loadFont()`'s FontFaceObserver gate (extend `customFonts` to include `'Vollkorn'`) which clears+resets `fontFamily` then `renderAll()`.
**Warning signs:** Flaky visual-regression diffs on Vollkorn text; first-add looks like Times, subsequent adds correct.

### preloadFonts family mismatch
**What goes wrong:** Vollkorn never preloads because all `PRELOAD_FONTS` entries are bound to Barlow.
**Why:** `wizard.js:22` hardcodes `FONTS.FAMILY` as the observer family.
**How to avoid:** Carry `family` per preload entry or add a separate Vollkorn preload loop.
**Warning signs:** Console shows only Barlow "Font loaded" logs; Vollkorn first-render fallback.

### Build drops the examples page
**What goes wrong:** New page exists in source but not in `build/` → 404 on GitHub Pages.
**Why:** `createStaticPage` is called explicitly per filename (build.js:33); new pages aren't auto-discovered.
**How to avoid:** Add `await createStaticPage('schriften.html')` to `build()`. Verify it lands in `build/`.

### Descriptive labels too long for the select
**What goes wrong:** Long labels overflow/wrap the `gat-select`.
**How to avoid:** Keep labels to the proposed length ("Standardschrift — Headlines & Fließtext"); put the longer "when to use which" guidance in the adjacent hint paragraph, not the `<option>`.

### Visual baselines must be regenerated
**What goes wrong:** Existing text-system baselines may shift if any default font path changes; new Vollkorn test has no baseline.
**How to avoid:** `npm run generate-references` (z6qfk did this), review the diff, commit updated/new reference PNGs. Default stays Barlow so existing Barlow baselines should be stable — verify.

## Environment Availability
| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js + npm | build, jest, playwright | Yes (repo uses it) | `npm run build`, `npm test`, `npm run test:visual` |
| Playwright (Chromium) | visual regression | Per repo devDeps | `npm run test:visual`, `npm run generate-references` |
| Internet (Google Fonts, design-system CDN) | font + DS CSS at runtime | Required | CLAUDE.md: no offline target; apps may assume connectivity |
| Jest + jsdom | unit/integration | Per repo devDeps (`jest@29`, `jest-environment-jsdom`) | `tests/**/*.test.js` |

## Tests + Build (concrete)
- **Unit/integration (Jest):** `jest.config.js` → `testMatch: tests/**/*.test.js`, env jsdom, setup `tests/setup.js`. Existing: `tests/unit/{validation,canvas-utils-snap,logo-toggle}.test.js`, `tests/integration/*`. A `tests/unit/font-options.test.js` could assert the `OPTIONS` lookup returns correct family/weight/style for each id. Run: `npm test`.
- **Visual regression (Playwright):** specs in `visual-regression/tests/`, util in `test-utils.js` (`setupTestEnvironment`, `setupBasicTemplate`, `compareWithReference` using pixelmatch + pngjs). References in `visual-regression/reference-images/`. **Every new spec MUST be registered in `playwright.config.js`** project `testMatch` arrays (fast/medium/complex) or it's silently skipped in CI — put a font-picker spec in **medium-tests** (text-system is there). Drive it like a user: `selectOption('#font-style-select', 'accent')` → `fill('#text', ...)` → `click('#add-text')` → `compareWithReference(page, 'text-vollkorn')`.
- **Generate baselines:** `npm run generate-references` (= `npm run build && GENERATE_REFERENCE=true playwright test visual-regression/tests/`). `GENERATE_REFERENCE_MODE` is read from `process.env.GENERATE_REFERENCE` in test-utils.js:11.
- **Build:** `npm run build` (`scripts/build.js`) → builds Tailwind prod CSS (`build-css-prod`), bundles CSS/JS, writes `build/index.html` + `build/impressum.html` (+ new page), copies `resources/`. Google-Fonts `<link>`s in source HTML pass through to `build/` **untouched** (build.js regex only replaces the FontAwesome→style.css CSS block and the JS bundles — see build.js:77-89, 114-117). So adding the Vollkorn `<link>` to source HTML is sufficient.

## Feature 1 — exact placement (logo hint)
- Logo selection lives in **Step 1**, `index.html:636-652`. The `value=""` option "Logo auswählen..." (line 648) is effectively "kein Logo"; `#logo-toggle` (line 653-663) also removes the logo entirely.
- The "Bild hinzufügen" path the hint references is in **Step 3**, `index.html:910-913` (`#add-image`).
- **Recommendation:** add a Tailwind hint `<p>`/callout directly under the logo `<select>` (after line 652, before the toggle div at 653) — e.g. a `text-sm text-gray-600` paragraph or a `gat-callout` (the DS provides callout classes; `gat-callout` is used elsewhere per git history). Wording per the issue: „Eigenes Logo? Wähle ‚Logo auswählen…' (kein Logo) und füge dein Logo später über ‚Bild hinzufügen' selbst ein." No JS.

## Feature 3 — examples page (concrete)
- **Pattern:** copy `impressum.html` structure (root-level static page, same head: favicon, Barlow+Vollkorn Google-Fonts `<link>`, FontAwesome, Grüne-AT DS, output.css, style.css). For the design-system-report look, ALSO link the hosted flomotlik system `https://flomotlik.github.io/claude-code/design-system.css` (Feature 3 is explicitly "HTML-Report-Stil"). Note both DS stylesheets can coexist, but verify no class collisions; simplest is to make `schriften.html` a clean report page using ONLY the flomotlik DS classes for the examples content.
- **Deploy:** add `await createStaticPage('schriften.html')` to `build.js` `build()` (after the impressum call, line 33). `.nojekyll` + GitHub Pages already deploy `build/`.
- **Link from app:** add an anchor in the picker hint (Step 3) to `schriften.html` (relative link, like `impressum.html` at index.html:1184).
- **Example images:** two viable routes — (a) **commit pre-rendered PNGs** under `resources/images/` (e.g. `resources/images/examples/headline-barlow.png`, `quote-vollkorn.png`) referenced by the page; generate them by running the app and exporting, or via the Playwright harness; (b) generate them in a visual-regression test and copy the outputs. Route (a) is simplest and deterministic for a help page. These are app-generated outputs (not third-party assets), so committing them does NOT violate no-vendoring.

## Project Constraints (from CLAUDE.md)
- **No vendoring** of third-party deps (workspace `/workspace/CLAUDE.md`) — Vollkorn via Google Fonts CDN; design-system CSS via CDN; no font files in repo.
- **No tool attribution** in commits/code/comments (workspace + repo memory).
- **Never inline styles; Tailwind only**; custom CSS only in `resources/css/style.css` when absolutely necessary (repo CLAUDE.md).
- **Visual tests must drive the UI as a user** — never manipulate canvas/elements directly (repo CLAUDE.md).
- **Always use pixelmatch** for visual comparisons (repo CLAUDE.md) — already the convention in test-utils.js.
- **Documentation files go in repo root** (repo CLAUDE.md) — the examples page and any docs at root.
- **New visual test files MUST be registered in `playwright.config.js`** or they're skipped in CI (repo CLAUDE.md).
- **New vendor JS/CSS must be added to build bundler arrays** — N/A here (no new vendor libs; FontFaceObserver already bundled).

## Sources
### HIGH confidence
- Codebase: `constants.js`, `event-handlers.js`, `handlers.js`, `wizard.js`, `main.js`, `index.html`, `impressum.html`, `scripts/build.js`, `visual-regression/tests/*`, `playwright.config.js`, `jest.config.js`, `package.json` (all read directly, cited file:line).
- `/workspace/design-system/design-system/design-system.css:2` — verified Vollkorn import = `Vollkorn:ital,wght@0,400;0,900` (400+900 upright, no italic), token `--gat-font-emphasis: "Vollkorn", serif`.
- Git history: z6qfk commits (`b3d9ab6` "load Barlow Semi Condensed from Google Fonts", `fbc75aa` research, `86daa9b` plan, `1051e7b` "regenerate baselines for Barlow") confirm the established font-wiring + baseline-regeneration pattern.
- Workspace/repo CLAUDE.md + MEMORY.md for constraints.

### MEDIUM confidence
- Exact final Vollkorn canvas weight (400 vs 900) for the accent option — design system loads both; planner should pick one and pin it in `OPTIONS`. Recommend 900 for visual parity with the heavy default unless a lighter quote look is wanted.

### LOW confidence (needs validation)
- Whether existing Barlow text-system baselines stay pixel-stable after adding the picker (default unchanged, so expected stable) — confirm by running `npm run test:visual` before regenerating.

## Metadata
**Confidence breakdown:**
- Codebase wiring: HIGH (read every cited line).
- Vollkorn provisioning: HIGH (DS import verified; mirrors Barlow).
- Picker placement: HIGH (Step-3 text section structure read in full).
- Examples page: HIGH for mechanism (createStaticPage), MEDIUM for image-generation route (two valid options, planner picks).
- Test impact: HIGH for structure, LOW for exact baseline deltas.

**Research date:** 2026-06-07
**Sub-agents used:** none (direct investigation; full tool access)
**Raw research files:** n/a (single-pass direct research)
