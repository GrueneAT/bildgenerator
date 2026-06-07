# Plan: Bildgenerator — Eigenes Logo erklären, Vollkorn als Schrift-Option, Beispiel-Seite

<objective>
Three independent UX/documentation improvements on top of the merged z6qfk Barlow font work:
1. A Tailwind hint in the Step-1 logo selection telling groups with their own logo to pick "kein Logo" and add it later via "Bild hinzufügen" (pure markup, no JS).
2. Vollkorn as a second selectable text font, surfaced through a re-introduced minimal 2-option font picker in the Step-3 text section whose options are labelled DESCRIPTIVELY (font type + use) for BOTH fonts — never by brand name. Vollkorn loaded from Google Fonts CDN (no vendoring); default stays Barlow.
3. A static examples help page ("Welche Schrift wofür") with example images, in the hosted flomotlik design-system HTML style, linked from the picker.

Why it matters: users don't recognize brand names ("Vollkorn"/"Barlow"); the descriptive picker + examples page make the font choice self-explanatory, and the logo hint unblocks groups with custom logos who don't know the existing path.

Scope: IN — markup hint, font picker + Vollkorn wiring, examples page, tests, baselines, doc touch-up. OUT — any new logo logic (text only), any change to the default font (stays Barlow), any change to the logo-overlay font (stays Barlow), Vollkorn italic (the design system loads upright 400/900 only).
</objective>

<strategy>
The font infrastructure from z6qfk is already in place (Google-Fonts `<link>`, FontFaceObserver preload, centralized `AppConstants.FONTS`, `loadFont()` re-render). This issue mostly *adds a second font* to that machinery and *re-introduces the tiny picker* that an earlier issue removed — it is additive, low-coupling work, not a rewrite.

Key strategic decisions:
- **Where the font choice lives:** a 2-option `<select id="font-style-select">` in the Step-3 "Text einfügen" section (next to the existing color/line-height selects), driven by a new `AppConstants.FONTS.OPTIONS` map. Reusing the previously-removed `#font-style-select` id is safe — grep confirms zero remaining references. Alternative considered (an "advanced options" panel) rejected: the text section is where users already pick text properties, so the font belongs there.
- **Vollkorn weight:** 900 upright, to match Barlow's heavy default visual weight and the design-system import (`Vollkorn:ital,wght@0,400;0,900`, upright only). Lighter (400) was considered for a softer "quote" look but rejected for visual parity and because the heavy cut reads better at canvas headline sizes. No italic — the DS doesn't load it and requesting it makes Fabric fall back.
- **The one load-bearing trap:** `preloadFonts()` binds every `PRELOAD_FONTS` entry to the single Barlow family. Naively appending Vollkorn entries makes a *Barlow* observer for Vollkorn → it never preloads → serif fallback on first add. So `PRELOAD_FONTS` entries must carry a per-entry `family` and the preload loop must use it. This is encoded explicitly in Task 1.
- **Examples page:** a root static page mirroring `impressum.html` (so `createStaticPage()` copies it to `build/`), but styled with the hosted flomotlik design system as an HTML report — the `design-system` skill governs its authoring.

Tests drive the UI like a user (select the picker option, click `#add-text`), use pixelmatch, and the new visual spec is registered in `playwright.config.js` medium-tests or CI silently skips it. Baselines are regenerated because Vollkorn changes pixels.
</strategy>

<skills>
Read and follow these skills during execution:
- @/opt/claude-config/skills/design-system/SKILL.md — REQUIRED for Task 4 (authoring the examples help page as a flomotlik-design-system HTML report). Read `/opt/claude-config/templates/style-guide.html` for the component vocabulary before writing the page. Do NOT apply this skill to `index.html`/`impressum.html` (those keep the Grüne-AT app styling).
</skills>

<context>
Issue: @.issues/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option-/ISSUE.md
Research: @.issues/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option-/RESEARCH.md
Context: @.issues/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option-/CONTEXT.md

<interfaces>
<!-- Executor: use these contracts directly. Do not re-grep the codebase for them. All cited at file:line, verified. -->

// resources/js/constants.js:82-95 — current FONTS block (SINGLE family)
AppConstants.FONTS = {
    FAMILY: "Barlow Semi Condensed",
    DEFAULT_LOGO: "Barlow Semi Condensed",
    DEFAULT_TEXT: "Barlow Semi Condensed",
    WEIGHT_TEXT: 900,    // default canvas text (Black)
    WEIGHT_LOGO: 800,    // logo overlay text (ExtraBold)
    WEIGHT_BOOK: 400,    // body / book (Regular)
    PRELOAD_FONTS: [     // each entry today becomes new FontFaceObserver(FONTS.FAMILY, entry)
        { weight: 900, style: 'italic' },
        { weight: 900 },
        { weight: 400 },
        { weight: 800 }
    ]
}

// resources/js/event-handlers.js:131-176 — setupTextHandler(), the ONLY user-text creation site
//   line 141: const selectedFont = AppConstants.FONTS.DEFAULT_TEXT;   // <-- hardcoded
//   line 144: new fabric.Text(value, { fontFamily: selectedFont,
//   line 145:     fontSize: initialFontSize,
//   line 146:     fontWeight: AppConstants.FONTS.WEIGHT_TEXT,         // <-- always 900
//   line 147:     fontStyle: "normal",                                // <-- always normal
//   ... textAlign/fill/stroke/shadow/lineHeight from existing #text-color/#line-height/#align inputs })

// resources/js/handlers.js:1-19 — loadFont(font): FontFaceObserver-gated fontFamily swap on active object
//   line 3: const customFonts = ['Barlow Semi Condensed'];   // <-- extend with 'Vollkorn'
//   if customFonts.includes(font): new FontFaceObserver(font).load().then(() => {
//       text.set("fontFamily",""); text.set("fontFamily", font); canvas.renderAll(); })
//   NOTE: loadFont currently has NO caller wired to any picker (picker was removed earlier).

// resources/js/wizard.js:21-33 — preloadFonts()
//   const fonts = PRELOAD_FONTS.map(d => new FontFaceObserver(AppConstants.FONTS.FAMILY, d));  // <-- single family, the trap
//   fonts.forEach(f => f.load().then(...).catch(...));

// resources/js/event-handlers.js:20-75 — setupCanvasObjectHandlers(): model for the new change handler
//   binds '#text-color' change, '#line-height' change, 'input[name="align"]' change;
//   each reads canvas.getActiveObject(), checks type === "text", mutates + renderAll.
//   bindHandler(selector, event, fn) is the EventHandlerUtils binding helper.

// scripts/build.js
//   build() @ line 33: await createStaticPage('impressum.html');   // <-- add schriften.html call after this
//   createStaticPage(filename) @ line 107: copies root <filename> to build/<filename>,
//     replacing the fontawesome->style.css <link> block with Gruene-DS + app.min.css, and cache-busting app.min.css.
//     If a page has NO fontawesome->style.css block (e.g. a pure flomotlik report), the regex no-ops — page passes through.
//   createProductionHTML() leaves Google-Fonts <link>s in index.html UNTOUCHED (regex only swaps vendor CSS/JS blocks).

// Design-system Vollkorn import (verified) — /workspace/design-system/design-system/design-system.css:2
//   family=Vollkorn:ital,wght@0,400;0,900  -> weights 400 + 900 UPRIGHT, NO italic. Token --gat-font-emphasis: "Vollkorn", serif.

// index.html head Barlow <link> @ line 25:
//   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,900&display=swap" />
// impressum.html head Barlow <link> @ line 21 (identical).

// index.html:642-652 — Step-1 logo <select id="logo-selection">; <option value="">Logo auswählen...</option> @ 648 = the "kein Logo" path. Logo hint goes after the closing </div> @ 652, before the #logo-toggle div @ 653.
// index.html:794-818 — pattern for a Tailwind <select> in the text section: <label class="block text-sm font-medium text-gray-700 mb-2"> + <select class="gat-select text-method w-full">.
// index.html:887-889 — <button id="add-text"> (the picker goes before this, inside the text-section, in the color/line-height grid area).
// index.html:1184 — <a href="impressum.html" ...> footer-link pattern (relative link).

// FontFaceObserver — bundled in vendors.min.js: new FontFaceObserver(family, { weight, style }).load() -> Promise.
</interfaces>

## Call-site enumeration (font picker / Vollkorn font surface)

Grepped: `font-style-select`, `DEFAULT_TEXT`, `WEIGHT_TEXT`, `PRELOAD_FONTS`, `loadFont`, `preloadFonts`, `Vollkorn`, `Barlow+Semi+Condensed` (Google-Fonts `<link>`), `createStaticPage`.
Surfaces grepped: `resources/js/`, `index.html`, `impressum.html`, `scripts/`, `playwright.config.js`, `visual-regression/`, `tests/`.

Found:
- `resources/js/event-handlers.js:141,146,147` — hardcoded `selectedFont`/`fontWeight`/`fontStyle` in `setupTextHandler()` — IN SCOPE (Task 2).
- `resources/js/handlers.js:3` — `customFonts = ['Barlow Semi Condensed']` in `loadFont()` — IN SCOPE (Task 2, extend with `'Vollkorn'`).
- `resources/js/wizard.js:22` — `preloadFonts()` binds all `PRELOAD_FONTS` to single Barlow family — IN SCOPE (Task 1, make per-family).
- `resources/js/constants.js:89-94` — `PRELOAD_FONTS` array — IN SCOPE (Task 1, per-entry `family` + Vollkorn entries + new `OPTIONS` map).
- `index.html:25` / `impressum.html:21` — Barlow Google-Fonts `<link>` — IN SCOPE (Task 1, add adjacent Vollkorn `<link>` in BOTH).
- `#font-style-select` id — grep returns ZERO current references in JS/HTML → safe to (re)introduce (Task 2).
- `scripts/build.js:33` — `createStaticPage('impressum.html')` — IN SCOPE (Task 4, add `schriften.html` call). `createProductionHTML` passes Google-Fonts `<link>`s through untouched — no build change needed for the Vollkorn `<link>`.
- `resources/js/main.js:203-217` — logo overlay text (`DEFAULT_LOGO`, `WEIGHT_LOGO`) — OUT OF SCOPE (logo font stays Barlow; do not touch).
- No additional CLI/flag/script surfaces (browser app; no CLI flags involved).

Key files:
@resources/js/constants.js — FONTS block (OPTIONS map, per-family PRELOAD_FONTS)
@resources/js/event-handlers.js — setupTextHandler + new picker change handler
@resources/js/handlers.js — loadFont customFonts
@resources/js/wizard.js — preloadFonts per-family loop
@index.html — Vollkorn <link>, logo hint, font picker
@impressum.html — Vollkorn <link>
@scripts/build.js — createStaticPage('schriften.html')
@playwright.config.js — register new visual spec
</context>

<commit_format>
Format: conventional with issue prefix (per .issues/config.yaml: commits.format=conventional, prefix=true)
Pattern: ptupd: {type}({scope}): {description}
Examples:
- ptupd: feat(fonts): add Vollkorn as descriptive text-font option
- ptupd: feat(ui): add own-logo hint to logo selection
- ptupd: feat(docs): add font-usage examples page
- ptupd: test(visual): cover font picker and Vollkorn rendering
No tool attribution anywhere (no "claude", no "Generated with", no Co-Authored-By) — workspace + repo rule.
</commit_format>

<tasks>

<task type="auto">
  <name>Task 1: Provision Vollkorn (font links + per-family preload + OPTIONS map)</name>
  <files>resources/js/constants.js, resources/js/wizard.js, index.html, impressum.html</files>
  <action>
  Provision the second font so it is actually preloaded and selectable. NO UI yet (Task 2).

  1. `index.html` (after the Barlow `<link>` at line 25) and `impressum.html` (after the Barlow `<link>` at line 21): add an adjacent Vollkorn Google-Fonts `<link>`, mirroring the Barlow one. Use weights matching the design system, upright only, NO italic:
     `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vollkorn:wght@400;900&display=swap" />`
     (The DS import `ital,wght@0,400;0,900` is upright 400+900; `wght@400;900` requests the same upright cuts. Do NOT add `1,400`/`1,900` — italic is not loaded and would cause Fabric fallback.) The preconnect lines already exist; reuse them. Do NOT vendor any font files.

  2. `resources/js/constants.js` FONTS block (82-95):
     a. Add an `OPTIONS` array — descriptive labels (type + use), NOT brand names. Proposed (executor may refine wording, keep short to avoid `gat-select` overflow; keep `id`/`family`/`weight`/`style` exactly):
        OPTIONS: [
            { id: 'standard', label: 'Standardschrift — Headlines & Fließtext', family: 'Barlow Semi Condensed', weight: 900, style: 'normal' },
            { id: 'accent',   label: 'Betonte Serifenschrift — für Zitate & Akzente', family: 'Vollkorn', weight: 900, style: 'normal' }
        ]
        Keep `DEFAULT_TEXT` = "Barlow Semi Condensed" (default option is `standard`). Vollkorn accent weight is 900 (parity with the heavy Barlow default).
     b. Rewrite `PRELOAD_FONTS` so each entry carries an explicit `family` (load-bearing fix — see step 3). Keep all existing Barlow descriptors and ADD Vollkorn 900 + 400 upright:
        PRELOAD_FONTS: [
            { family: 'Barlow Semi Condensed', weight: 900, style: 'italic' },
            { family: 'Barlow Semi Condensed', weight: 900 },
            { family: 'Barlow Semi Condensed', weight: 400 },
            { family: 'Barlow Semi Condensed', weight: 800 },
            { family: 'Vollkorn', weight: 900 },
            { family: 'Vollkorn', weight: 400 }
        ]

  3. `resources/js/wizard.js` `preloadFonts()` (21-33): change the map so the observer family comes from each entry, NOT the single `FONTS.FAMILY`. Pass only the remaining descriptor (weight/style) as the second arg:
        const fonts = AppConstants.FONTS.PRELOAD_FONTS.map(({ family, ...desc }) =>
            new FontFaceObserver(family, desc));
     Keep the existing `.load().then(...).catch(...)` logging loop unchanged. THIS IS THE #1 ERROR-PRONE SPOT: leaving `FONTS.FAMILY` here gives Vollkorn a Barlow observer, so it never preloads and renders as a serif fallback on first add.

  No tool-attribution comments anywhere.
  </action>
  <verify>
  <automated>grep -q "family=Vollkorn" index.html && grep -q "family=Vollkorn" impressum.html && grep -q "OPTIONS" resources/js/constants.js && grep -A12 "PRELOAD_FONTS" resources/js/constants.js | grep -q "Vollkorn" && grep -q "family" resources/js/wizard.js && node --check resources/js/constants.js && node --check resources/js/wizard.js && npm test</automated>
  </verify>
  <done>
  - Vollkorn Google-Fonts `<link>` (upright 400;900, no italic) present in both index.html and impressum.html, adjacent to the Barlow link
  - constants.js FONTS has an OPTIONS array of 2 descriptive (non-brand) labels; standard→Barlow 900, accent→Vollkorn 900; DEFAULT_TEXT unchanged
  - PRELOAD_FONTS entries each carry a `family`; Vollkorn 400+900 entries added
  - preloadFonts() builds FontFaceObserver from each entry's `family` (not the single FONTS.FAMILY)
  - `node --check` passes on both files; `npm test` (Jest) green
  - No tool-attribution strings anywhere
  </done>
</task>

<task type="auto">
  <name>Task 2: Re-introduce the descriptive font picker and wire it into text creation + active-object updates</name>
  <files>index.html, resources/js/event-handlers.js, resources/js/handlers.js</files>
  <action>
  Add the 2-option picker UI and make BOTH new text and the currently selected text use the chosen font. Default stays Barlow.

  1. `index.html` Step-3 text section: add a labelled `<select id="font-style-select">` inside the existing color/line-height grid (the grid containing `#text-color`/`#line-height`, ~lines 788-820), BEFORE the `#add-text` button at line 887. Mirror the existing select markup exactly (Tailwind only, NO inline style):
        <div>
          <label for="font-style-select" class="block text-sm font-medium text-gray-700 mb-2">Schriftart:</label>
          <select class="gat-select text-method w-full" name="font-style-select" id="font-style-select">
            <option value="standard">Standardschrift — Headlines & Fließtext</option>
            <option value="accent">Betonte Serifenschrift — für Zitate & Akzente</option>
          </select>
        </div>
     The option `value`s MUST equal the `OPTIONS[].id` values from Task 1 (`standard`, `accent`). `standard` is the first/default option. Below the grid (or directly under this select), add a short Tailwind hint paragraph with a link to the examples page (Task 4 creates `schriften.html`):
        <p class="text-sm text-gray-600 mt-2">Standardschrift für Überschriften und Fließtext, betonte Serifenschrift für Zitate und Akzente. <a href="schriften.html" target="_blank" rel="noopener" class="text-gruene-primary hover:underline">Beispiele ansehen</a>.</p>

  2. `resources/js/event-handlers.js` `setupTextHandler()` (131-176): replace the hardcoded font at lines 141/146/147. Read the selected option id from `#font-style-select`, look it up in `AppConstants.FONTS.OPTIONS` (fall back to the first/standard option if not found), and use its `family`/`weight`/`style`:
        const optId = jQuery('#font-style-select').val();
        const opt = (AppConstants.FONTS.OPTIONS.find(o => o.id === optId)) || AppConstants.FONTS.OPTIONS[0];
        const selectedFont = opt.family;
     Then in the `new fabric.Text(...)` object: `fontFamily: selectedFont`, `fontWeight: opt.weight`, `fontStyle: opt.style`. Keep all other properties (textAlign/fill/shadow/lineHeight/etc.) untouched.

  3. `resources/js/handlers.js` `loadFont()` (line 3): extend `customFonts` to include Vollkorn:
        const customFonts = ['Barlow Semi Condensed', 'Vollkorn'];
     This makes the FontFaceObserver gate fire for Vollkorn (prevents serif fallback on font switch).

  4. `resources/js/event-handlers.js` `setupCanvasObjectHandlers()` (20-75): add a `#font-style-select` `change` handler following the existing `#text-color`/`#line-height` model. On change, if the active object is a text object, look up the option, set `fontWeight` and `fontStyle` directly, then route the family change through `loadFont(opt.family)` (which clears+resets fontFamily after the FontFaceObserver resolves and calls renderAll). Set weight/style BEFORE calling loadFont so the re-render uses them. Use `bindHandler('#font-style-select', 'change', fn)`. Guard `type === "text"` like the sibling handlers. Do not touch the logo overlay object.

  Tailwind only, no inline styles. No tool-attribution comments.
  </action>
  <verify>
  <automated>cd /workspace/bildgenerator/.worktrees/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option- && grep -q 'id="font-style-select"' index.html && grep -q 'href="schriften.html"' index.html && grep -q "OPTIONS.find" resources/js/event-handlers.js && grep -q "'Vollkorn'" resources/js/handlers.js && grep -q "font-style-select" resources/js/event-handlers.js && node --check resources/js/event-handlers.js && node --check resources/js/handlers.js && npm test</automated>
  </verify>
  <done>
  - `#font-style-select` with 2 descriptive (non-brand) options exists in the Step-3 text section; values are `standard`/`accent`; no inline styles
  - Short hint paragraph with a link to `schriften.html` present
  - setupTextHandler reads the picked OPTION and applies its family/weight/style to new text; default is Barlow (`standard`)
  - loadFont customFonts includes 'Vollkorn'
  - A `#font-style-select` change handler updates the active text object's family (via loadFont) + weight + style
  - `node --check` passes; `npm test` green
  </done>
</task>

<task type="auto">
  <name>Task 3: Add the own-logo hint to the Step-1 logo selection</name>
  <files>index.html</files>
  <action>
  Pure markup, no JS. In `index.html` Step-1, after the logo `<select>` wrapper `</div>` at line 652 and before the `#logo-toggle` div at line 653, add a short, visible Tailwind hint telling groups with their own logo to leave the logo off and add it via "Bild hinzufügen". Tailwind only, NO inline style; match the surrounding `text-sm text-gray-600/700` style:
        <p class="mt-2 text-sm text-gray-600">Eigenes Logo? Wähle „Logo auswählen…" (kein Logo) und füge dein Logo später über „Bild hinzufügen" selbst auf die Fläche ein.</p>
  Keep wording aligned with the issue. Do not add new logic or change the logo `<select>`/toggle behaviour. No tool-attribution comments.
  </action>
  <verify>
  <automated>cd /workspace/bildgenerator/.worktrees/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option- && grep -q "Eigenes Logo" index.html && grep -q "Bild hinzufügen" index.html && node scripts/build.js >/dev/null 2>&1 && grep -q "Eigenes Logo" build/index.html</automated>
  </verify>
  <done>
  - A visible Tailwind hint paragraph sits directly under the logo `<select>` in Step 1
  - Wording covers: pick "kein Logo" then add via "Bild hinzufügen"; no inline styles
  - Hint survives the build into build/index.html
  </done>
</task>

<task type="auto">
  <name>Task 4: Create the font-usage examples page and ship it in the build</name>
  <files>schriften.html, scripts/build.js, resources/images/examples/ (new PNGs)</files>
  <action>
  Create a static help page explaining which font for what, with example images, styled as a flomotlik design-system HTML report. FOLLOW the `design-system` skill: read `/opt/claude-config/templates/style-guide.html` for the component vocabulary FIRST, then `<link>` the hosted stylesheet `https://flomotlik.github.io/claude-code/design-system.css` plus the two Google-Fonts preconnect lines. Use only documented design-system components — no invented classes, no inline styles.

  1. `schriften.html` at repo ROOT (mirrors impressum.html's role as a root static page). Head: favicon (copy from impressum.html), the flomotlik preconnects + design-system.css `<link>`. Body content:
     - Title + short intro: "Welche Schrift wofür".
     - Section "Standardschrift — Headlines & Fließtext" (Barlow Semi Condensed): when to use it, with an example image.
     - Section "Betonte Serifenschrift — für Zitate & Akzente" (Vollkorn): when to use it, with an example image.
     - Keep labels DESCRIPTIVE; you may mention the technical names once in body prose, but the headings/UI vocabulary stay descriptive.
     - A back-link to the app (`index.html`).

  2. Example images: generate two real bildgenerator outputs (one headline in the standard font, one quote/accent in Vollkorn) and commit them under `resources/images/examples/` (e.g. `standard-headline.png`, `accent-quote.png`). Generate them by driving the app via the Playwright harness (preferred — reuse `setupBasicTemplate` + the picker + `#add-text`, then export the canvas) OR hand-export from the running app. These are app-generated outputs (not third-party assets) — committing them does NOT violate no-vendoring. Reference them from `schriften.html` with relative paths (`resources/images/examples/...`).

  3. `scripts/build.js`: in `build()` right after `await createStaticPage('impressum.html');` (line 33), add `await createStaticPage('schriften.html');`. `createStaticPage` copies the root file to `build/` and cache-busts app.min.css; since schriften.html has no fontawesome→style.css block, the CSS-swap regex no-ops and the flomotlik `<link>` passes through untouched. Ensure `resources/` (including the new images) is copied by the existing `copyAssets()` step.

  No tool-attribution anywhere (no "claude", no wordmark, no Co-Authored-By) — the design-system skill also forbids personal-name branding.
  </action>
  <verify>
  <automated>cd /workspace/bildgenerator/.worktrees/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option- && test -f schriften.html && grep -q "flomotlik.github.io/claude-code/design-system.css" schriften.html && grep -q "createStaticPage('schriften.html')" scripts/build.js && ls resources/images/examples/*.png >/dev/null 2>&1 && node scripts/build.js >/dev/null 2>&1 && test -f build/schriften.html && grep -q "flomotlik" build/schriften.html</automated>
  </verify>
  <done>
  - `schriften.html` exists at repo root, links the hosted flomotlik design-system.css, uses only design-system components, no inline styles
  - Page explains standard font (headlines/body) vs accent serif (quotes/accents) with two committed example PNGs under resources/images/examples/
  - build.js calls `createStaticPage('schriften.html')`; `build/schriften.html` is produced and still links the flomotlik DS
  - Back-link to index.html present; no tool attribution / personal wordmark
  </done>
</task>

<task type="auto">
  <name>Task 5: Visual + integration tests, register spec, regenerate baselines, full suite green</name>
  <files>visual-regression/tests/font-picker.spec.js, playwright.config.js, visual-regression/reference-images/ (new/updated PNGs)</files>
  <action>
  Add tests that drive the UI like a user and lock in the new behaviour. Do NOT manipulate the canvas directly — select the picker option and click `#add-text` (repo rule). Use pixelmatch (already in test-utils `compareWithReference`).

  1. New spec `visual-regression/tests/font-picker.spec.js` (model after `text-system.spec.js`): use `setupTestEnvironment` + `setupBasicTemplate`, advance to Step 3, open the text section, then:
     - Test A (default/Barlow): fill `#text`, click `#add-text`, `compareWithReference(page, 'text-font-standard')`.
     - Test B (Vollkorn accent): `await page.selectOption('#font-style-select', 'accent')`, fill `#text`, click `#add-text`, wait for font load, `compareWithReference(page, 'text-font-accent')`. This asserts Vollkorn actually renders (serif, not fallback).
     Allow generous `waitForTimeout` after add (mirror text-system's 2000ms) so the FontFaceObserver gate settles.

  2. Register the spec in `playwright.config.js` `medium-tests` project `testMatch` (add `"**/font-picker.spec.js"`) — REQUIRED or CI silently skips it (repo rule).

  3. Optional but recommended: a Jest unit test `tests/unit/font-options.test.js` asserting `AppConstants.FONTS.OPTIONS` lookup returns the right family/weight/style for `standard` and `accent`, and that DEFAULT_TEXT matches the standard option's family. (Loads constants.js the same way existing unit tests load app code.)

  4. Regenerate baselines: `npm run generate-references` (builds + runs Playwright with GENERATE_REFERENCE=true). Review the diff — default-Barlow baselines should be stable (default unchanged); the two new `text-font-*` references are expected new files. Commit new/updated reference PNGs.

  5. Run the full suite green: `npm test` (Jest), `npm run test:visual` (Playwright visual), `npm run test:e2e` (e2e). Fix any regression before finishing.

  No tool-attribution comments in tests.
  </action>
  <verify>
  <automated>cd /workspace/bildgenerator/.worktrees/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option- && test -f visual-regression/tests/font-picker.spec.js && grep -q "font-picker.spec.js" playwright.config.js && node --check visual-regression/tests/font-picker.spec.js && npm test && npm run test:visual && npm run test:e2e</automated>
  </verify>
  <done>
  - `font-picker.spec.js` drives the UI as a user (selects option, clicks #add-text), uses pixelmatch via compareWithReference
  - Spec is registered in playwright.config.js medium-tests testMatch
  - New reference images committed; existing Barlow baselines stable
  - `npm test`, `npm run test:visual`, `npm run test:e2e` all green
  </done>
</task>

<task type="auto">
  <name>Task 6: Update repo CLAUDE.md font documentation</name>
  <files>CLAUDE.md</files>
  <action>
  Update the repo `CLAUDE.md` so the documented behaviour matches the new picker. In the "Template System" → Key Features list, replace the single "Default text font: Barlow Semi Condensed..." line with a note that text font is now user-selectable via a descriptive 2-option picker (standard = Barlow Semi Condensed, default; accent serif = Vollkorn), both via Google Fonts CDN, and reference the `schriften.html` examples page. Keep it concise; no tool attribution. (Workspace CLAUDE.md needs no change — no new vendoring, conventions already covered.)
  </action>
  <verify>
  <automated>cd /workspace/bildgenerator/.worktrees/ptupd-bildgenerator-eigenes-logo-per-bild-upload-erklären-vollkorn-als-schrift-option- && grep -qi "Vollkorn" CLAUDE.md && grep -qi "schriften.html" CLAUDE.md</automated>
  </verify>
  <done>
  - Repo CLAUDE.md documents the selectable text font (standard Barlow default + accent Vollkorn) and the examples page
  - No tool-attribution strings
  </done>
</task>

</tasks>

<verification>
After all tasks, run the full gate from the worktree root:
- `npm test` — Jest unit/integration green (includes font-options lookup)
- `npm run build` — clean build; build/index.html has Vollkorn link + logo hint, build/schriften.html present and links the flomotlik DS
- `npm run test:visual` — Playwright visual regression green (font-picker spec runs in medium-tests; pixelmatch)
- `npm run test:e2e` — e2e green
- Manual sanity: open the app, Step 3 → pick "Betonte Serifenschrift…", add text → renders Vollkorn (serif), not a fallback; default add stays Barlow
- grep the diff for tool-attribution strings (claude / Generated with / Co-Authored-By) — none present
</verification>

<success_criteria>
Maps 1:1 to ISSUE.md acceptance criteria:
- Logo selection contains a visible short hint about own-logo via "kein Logo" + "Bild hinzufügen" (Task 3)
- Vollkorn selectable, loaded via Google Fonts (no vendoring), canvas render + FontFaceObserver correct — no serif fallback (Tasks 1, 2, 5)
- Font picker is DESCRIPTIVELY labelled (type/use) for BOTH fonts, never brand name, with a short explanatory hint (Tasks 1, 2)
- Vollkorn use-cases mirror the templates (accent/emphasis); Barlow stays default (Tasks 1, 2)
- Examples page explains font usage with example images in the design-system style, linked from the picker (Tasks 2, 4)
- Visual-regression/tests adjusted; full suite green (Task 5)
- No tool attribution in commits/code (all tasks)
</success_criteria>
