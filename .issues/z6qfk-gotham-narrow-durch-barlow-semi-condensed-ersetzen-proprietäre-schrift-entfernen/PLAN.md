# Plan: Gotham Narrow durch Barlow Semi Condensed ersetzen (proprietäre Schrift entfernen)

<objective>
What this plan accomplishes: Replace the proprietary, vendored **Gotham Narrow** font (4 `.otf` files) with the free **Barlow Semi Condensed** (Google Fonts CDN) across the entire Fabric.js/Tailwind/vanilla-JS image generator, then regenerate all 76 visual-regression baselines so the suite is green again.

Why it matters: Gotham Narrow is a license/legal liability AND violates the workspace No-Vendoring rule (`/workspace/CLAUDE.md`). Barlow Semi Condensed is the Grüne-AT design-system house font (SIL OFL, free), loaded the same way the DS loads it (Google Fonts), keeping the generator brand-consistent with zero vendored fonts.

Scope:
- IN: font swap (CDN embed + all runtime/build/test/doc references) + regeneration of all visual-regression baselines + repo doc updates.
- OUT: colors, logos, layout tokens, any other design-system migration; linking the full `design-system.css` as the font source (it is already linked for `--gat-*` color tokens and MUST stay — do not touch it).

This issue HAS a CONTEXT.md; all three locked decisions are honored below. The weight mapping (Decision 2, left to research) is resolved: default TEXT = Barlow Semi Condensed **900 upright**, default LOGO = **800**, italic preload = **900 italic**, Book equivalent = **400**.
</objective>

<strategy>
The swap is mechanically straightforward but has one structural pivot: Gotham was modeled as **four distinct `@font-face` family names** ("Gotham Narrow Ultra/… Ultra Italic/… Book/… Bold"); Barlow Semi Condensed is **ONE family with numeric weights**. The code today selects fonts purely by `fontFamily` string and never sets `fontWeight` (`fontStyle` is hardcoded `"normal"` everywhere). So a naive find-replace of the family string would silently render Barlow **400** instead of the punchy 900/800 — every headline would look thin. The plan therefore sets `fontFamily: "Barlow Semi Condensed"` AND adds explicit `fontWeight` (and `fontStyle` for the italic preload) at every selection site.

Options considered: (a) one family + numeric `fontWeight` — chosen: matches the Google Fonts model and the DS, no extra CSS layer; (b) four self-hosted `@font-face` aliases mapping to Barlow weights — rejected: re-introduces a CSS layer and is essentially re-vendoring complexity. The weight mapping maps **up** (Ultra→900, Bold→800) because Barlow is lighter/narrower than Gotham at equal nominal weight; visual sign-off is the final arbiter, and since 900 is the heaviest available, the only remaining hierarchy lever is logo=800 vs text=900.

Two hard ordering constraints drive the task sequence: (1) the font must be **loadable in BOTH dev and the production build** before any runtime reference flips, because the visual suite runs against `build/` (`make serve-build`), and `scripts/build.js` rewrites the CSS `<link>` block — the Google-Fonts `<link>` must sit ABOVE the FontAwesome link so it survives the rewrite. (2) Baselines are regenerated only AFTER the swap is complete, because Barlow's narrower metrics shift line breaks and textbox heights — every text/logo baseline changes, so all 76 are regenerated wholesale. Network risk (Google Fonts reachable from CI/local) was verified reachable in this environment; re-vendoring is forbidden, so if a runner is offline that is a blocker to raise, never a workaround.
</strategy>

<skills>
No workspace `.claude/skills/` apply to this repo. The binding rules are in the two CLAUDE.md files (workspace No-Vendoring + No-tool-attribution; repo visual-regression + Tailwind + pixelmatch rules) — already summarized in `<context>` and the task actions.
</skills>

<context>
Issue: @.issues/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen/ISSUE.md
Research: @.issues/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen/RESEARCH.md

Work in the worktree root `/workspace/bildgenerator/.worktrees/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen/`. All paths below are repo-relative.

Binding constraints (from CLAUDE.md, do not violate):
- **No vendoring:** Barlow via Google Fonts CDN only. NO new `.otf`. The 4 Gotham `.otf` are deleted. If a test runner cannot reach `fonts.googleapis.com`/`fonts.gstatic.com`, that is a BLOCKER to raise — re-vendoring is forbidden. (Verified reachable in this environment: css2 -> HTTP 200.)
- **No tool attribution** in commits/code/comments — no "claude", no "Generated with", no `Co-Authored-By`.
- **Visual regression:** never manipulate canvas/elements directly; drive the UI like a user. Existing specs already do this — DO NOT rewrite specs, only regenerate baselines. ALWAYS pixelmatch (already wired in `test-utils.js`).
- **DS-CDN `<link>` stays:** `index.html:25` / `impressum.html:19` link `https://grueneat.github.io/design-system/design-system.css` — Tailwind colors depend on its `--gat-*` tokens. Do NOT remove or modify it. Adding a second scoped Google-Fonts `<link>` is intentional and harmless (browser dedupes).

The locked import URL (Decision 1, use EXACTLY this href):
`https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,900&display=swap`

Resolved weight mapping (Decision 2):
| Role | Family | weight | style |
|------|--------|--------|-------|
| `DEFAULT_TEXT` (canvas text default) | Barlow Semi Condensed | **900** | normal |
| `DEFAULT_LOGO` (logo overlay text) | Barlow Semi Condensed | **800** | normal |
| italic preload (no default path) | Barlow Semi Condensed | **900** | italic |
| Book equivalent (preload) | Barlow Semi Condensed | **400** | normal |

<interfaces>
<!-- Executor: use these contracts directly. Do not explore the codebase for them. -->

// === resources/js/constants.js:82-91 — AppConstants.FONTS (single source of truth) ===
FONTS: {
    DEFAULT_LOGO: "Gotham Narrow Bold",   // consumed at main.js:205 (logo overlay text)
    DEFAULT_TEXT: "Gotham Narrow Ultra",  // ALSO hardcoded at event-handlers.js:141
    PRELOAD_FONTS: [
        'Gotham Narrow Ultra Italic', 'Gotham Narrow Ultra',
        'Gotham Narrow Book', 'Gotham Narrow Bold'
    ]
}
// No weight/style field today — selection is purely by family name. ADD weight constants.

// === resources/js/main.js:203-216 — logo overlay text (fabric.Text) ===
logoName = new fabric.Text(logoText, {
    fontFamily: AppConstants.FONTS.DEFAULT_LOGO,
    fontStyle: "normal",        // <-- no fontWeight today; ADD fontWeight: 800
    ...
});

// === resources/js/event-handlers.js:141-160 — canvas text default (fabric.Text) ===
const selectedFont = "Gotham Narrow Ultra";
const text = new fabric.Text(jQuery("#text").val(), {
    fontFamily: selectedFont,
    fontStyle: "normal",        // <-- stays "normal"; ADD fontWeight: 900
    ...
});
// Fabric builds the canvas font string as `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`.
// With ONE family, fontWeight is the ONLY way to pick 900 vs 800 vs 400.

// === resources/js/handlers.js:1-19 — loadFont (re-applies font to active text) ===
const customFonts = ['Gotham Narrow'];   // 'Gotham Narrow' is not one of the 4 families — effectively dead.

// === resources/js/wizard.js:21-36 — preloadFonts (called on initializeWizard) ===
new FontFaceObserver('Gotham Narrow Ultra Italic')   // x4 today
// FontFaceObserver supports a 2nd arg { weight, style }. For Barlow:
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 900 }).load()
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 800 }).load()
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 400 }).load()
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 900, style: 'italic' }).load()

// === resources/css/fonts.css — 4 @font-face Gotham (runtime CSS, <link>ed) ===
// === resources/css/input.css:5-20 — @layer base { @font-face 'Gotham Narrow' (italic!) + 'Gotham Narrow Bold' } ===

// === tailwind.config.js:20-23 — fontFamily (font-gotham*; grep-confirmed DEAD, no markup usage) ===
fontFamily: {
    'gotham': ['Gotham Narrow', 'Arial', 'sans-serif'],
    'gotham-bold': ['Gotham Narrow Bold', 'Arial Black', 'sans-serif'],
}

// === scripts/build-css.js:13-19 — CSS bundle order (remove the fonts.css entry) ===
const CSS_FILES_ORDER = [
    ...VENDOR_CSS_FILES,            // ['vendors/fontawesome/css/all.css']
    'resources/css/fonts.css',     // <-- REMOVE this line + its url() rewrite branch (lines ~42-43)
    'resources/css/output.css',
    'resources/css/style.css'
];

// === scripts/build.js:77-80 (and 114-117 for impressum) — production HTML CSS-link rewrite ===
// Regex collapses the run from <link ... fontawesome/all.css> ... <link ... style.css?v=N>
// into: DS-CDN <link> + <link app.min.css>. A Google-Fonts <link> placed ABOVE the
// fontawesome <link> (i.e. before index.html line 22 "<!-- Fontawesome -->") SURVIVES.
// One placed BETWEEN fontawesome (line 23) and style.css gets DELETED.

// === visual-regression/tests/test-utils.js:262-290 — font readiness gate (document.fonts.check) ===
const fonts = ['16px "Gotham Narrow Ultra Italic"', '16px "Gotham Narrow Book"', '16px "Gotham Narrow Bold"'];
// For Barlow use exact weight+size strings, e.g.:
//   '900 16px "Barlow Semi Condensed"', '800 16px "Barlow Semi Condensed"',
//   '400 16px "Barlow Semi Condensed"', 'italic 900 16px "Barlow Semi Condensed"'

// === tests/integration/logo-processing-integration.test.js:106-108 — mock ===
FONTS: { DEFAULT_LOGO: 'Gotham' }   // -> 'Barlow Semi Condensed'

// === Verified live Google Fonts CSS for the locked URL ===
// family-name: 'Barlow Semi Condensed'; normal weights 400/600/700/800/900; italic 400/900.
</interfaces>

Key files:
@resources/js/constants.js — FONTS config, single source of truth
@resources/js/main.js — logo overlay text creation (line 205)
@resources/js/event-handlers.js — canvas text default (line 141)
@resources/js/wizard.js — preloadFonts FontFaceObserver list
@resources/js/handlers.js — loadFont customFonts
@scripts/build.js — production HTML CSS-link rewrite (must not break)
@scripts/build-css.js — CSS bundle order
@visual-regression/tests/test-utils.js — font readiness gate + reference comparison
</context>

<commit_format>
Format: conventional, no issue prefix (no `.issues/config.yaml` present; repo history uses plain conventional).
Example: `feat(fonts): embed Barlow Semi Condensed via Google Fonts`
Pattern: `{type}({scope}): {description}` — types: feat, fix, refactor, test, chore, docs.
Reminder: NO tool attribution, NO `Co-Authored-By` (workspace CLAUDE.md).
</commit_format>

<tasks>

<task type="auto">
  <name>Task 1: Embed Barlow via Google Fonts in both HTML heads, removing the Gotham CSS load — survives dev AND build</name>
  <files>index.html, impressum.html, scripts/build-css.js</files>
  <action>
  Goal: make Barlow Semi Condensed loadable in BOTH dev HTML and the production `build/` output, and stop loading the Gotham `@font-face`. This MUST precede any runtime reference change so the font exists when references flip.

  1. In `index.html`: insert the Google-Fonts `<link>` ABOVE the `<!-- Fontawesome -->` comment (i.e. before line 22, before `<link ... vendors/fontawesome/css/all.css>`). Use exactly:
     ```html
     <!-- Barlow Semi Condensed (Grüne-AT house font, via Google Fonts) -->
     <link rel="preconnect" href="https://fonts.googleapis.com" />
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
     <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,900&display=swap" />
     ```
     WHY ABOVE fontawesome: `scripts/build.js:77-80` replaces the `<link>` run from `fontawesome/all.css` through `style.css?v=N`. A link inside that run is deleted from `build/index.html`; one above it survives. Placing it after the DS-CDN link (line 25) would put it INSIDE the replaced span — do NOT do that.
  2. In `index.html`: remove the `<!-- Fonts -->` comment and its `<link ... href="resources/css/fonts.css" />` (lines 28-29). Do NOT touch the DS-CDN link (line 25) or `output.css`/`style.css` links.
  3. In `impressum.html`: same — add the three Barlow `<link>` lines before the fontawesome link (line 18), and remove the `resources/css/fonts.css` `<link>` (line 21). The static-page rewrite at `scripts/build.js:114-117` uses the same regex span, so placement above fontawesome is required here too.
  4. In `scripts/build-css.js`: remove the `'resources/css/fonts.css'` entry from `CSS_FILES_ORDER` (line ~16) AND remove the `else if (filePath === 'resources/css/fonts.css')` url-rewrite branch (lines ~42-43). Leaving the entry only emits a warning, but remove it cleanly.

  Do NOT yet delete `resources/css/fonts.css` itself or any JS references — that is Task 3. Do NOT add Barlow as a vendored file.
  </action>
  <verify>
  <automated>cd "/workspace/bildgenerator/.worktrees/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen" && npm run build >/tmp/build.log 2>&1 && grep -q "fonts.googleapis.com/css2?family=Barlow" build/index.html && grep -q "fonts.googleapis.com/css2?family=Barlow" build/impressum.html && grep -q "design-system.css" build/index.html && ! grep -q "resources/css/fonts.css" build/index.html && echo "PASS"</automated>
  </verify>
  <done>
  - `build/index.html` and `build/impressum.html` both contain the Barlow Google-Fonts `<link>` with the exact locked URL.
  - The DS-CDN `design-system.css` `<link>` is still present in the build output.
  - No `resources/css/fonts.css` `<link>` remains in dev HTML or build output.
  - `npm run build` succeeds with no error.
  </done>
</task>

<task type="auto">
  <name>Task 2: Repoint runtime font selection to Barlow with explicit weights (constants, canvas text, logo text, observers, dead branch, Tailwind)</name>
  <files>resources/js/constants.js, resources/js/event-handlers.js, resources/js/main.js, resources/js/wizard.js, resources/js/handlers.js, tailwind.config.js</files>
  <action>
  CRITICAL: this is a structural change, not a string swap. With one Barlow family, `fontWeight` is the ONLY weight selector. Setting `fontFamily` alone renders Barlow 400 (thin). Add explicit `fontWeight` everywhere a Gotham family name previously encoded weight.

  1. `resources/js/constants.js` (FONTS block, lines 82-91): set the single family + numeric weights. Replace the block with:
     ```js
     FONTS: {
         FAMILY: "Barlow Semi Condensed",
         DEFAULT_LOGO: "Barlow Semi Condensed",
         DEFAULT_TEXT: "Barlow Semi Condensed",
         WEIGHT_TEXT: 900,    // was Gotham Narrow Ultra
         WEIGHT_LOGO: 800,    // was Gotham Narrow Bold
         WEIGHT_BOOK: 400,    // was Gotham Narrow Book
         PRELOAD_FONTS: [
             { weight: 900, style: 'italic' },  // was Gotham Narrow Ultra Italic
             { weight: 900 },                   // was Gotham Narrow Ultra (default text)
             { weight: 400 },                   // was Gotham Narrow Book
             { weight: 800 }                    // was Gotham Narrow Bold (default logo)
         ]
     }
     ```
  2. `resources/js/event-handlers.js:141-146`: change `const selectedFont = "Gotham Narrow Ultra";` to `const selectedFont = AppConstants.FONTS.DEFAULT_TEXT;` and inside the `new fabric.Text({...})` add `fontWeight: AppConstants.FONTS.WEIGHT_TEXT,` (keep `fontStyle: "normal"`). The default text path is upright — no italic.
  3. `resources/js/main.js:203-216` (logo overlay): `fontFamily` already reads `AppConstants.FONTS.DEFAULT_LOGO`. Add `fontWeight: AppConstants.FONTS.WEIGHT_LOGO,` to the `fabric.Text` options (keep `fontStyle: "normal"`). Without this the logo text renders Barlow 400.
  4. `resources/js/wizard.js:21-36` (`preloadFonts`): rebuild the observer list from the new `PRELOAD_FONTS` descriptors so each needed weight (and the italic) is awaited individually — a bare `FontFaceObserver('Barlow Semi Condensed')` can resolve at 400 while 900 is still loading. Replace the array with:
     ```js
     const fonts = AppConstants.FONTS.PRELOAD_FONTS.map(
         d => new FontFaceObserver(AppConstants.FONTS.FAMILY, d)
     );
     ```
     Keep the existing `.forEach(... load().then/catch ...)` logging loop.
  5. `resources/js/handlers.js:3`: change `const customFonts = ['Gotham Narrow'];` to `const customFonts = ['Barlow Semi Condensed'];`. (This branch is effectively dead — no UI font picker exists — but it must not name Gotham. Leave the function logic otherwise unchanged.)
  6. `tailwind.config.js:20-23`: the `font-gotham`/`gotham-bold` utilities are confirmed DEAD (grep finds no `font-gotham*` usage in markup/JS, only this definition). Repoint both to Barlow so no Gotham string remains and the utilities stay valid:
     ```js
     fontFamily: {
         'barlow': ['Barlow Semi Condensed', 'Arial', 'sans-serif'],
         'barlow-bold': ['Barlow Semi Condensed', 'Arial Black', 'sans-serif'],
     }
     ```

  Do NOT touch the DS-CDN link or colors. Do NOT introduce any `.otf`.
  </action>
  <verify>
  <automated>cd "/workspace/bildgenerator/.worktrees/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen" && node --check resources/js/constants.js && node --check resources/js/event-handlers.js && node --check resources/js/main.js && node --check resources/js/wizard.js && node --check resources/js/handlers.js && node --check tailwind.config.js && ! grep -riq gotham resources/js tailwind.config.js && grep -q "WEIGHT_TEXT: 900" resources/js/constants.js && grep -q "fontWeight: AppConstants.FONTS.WEIGHT_TEXT" resources/js/event-handlers.js && grep -q "fontWeight: AppConstants.FONTS.WEIGHT_LOGO" resources/js/main.js && echo "PASS"</automated>
  </verify>
  <done>
  - All five JS files and `tailwind.config.js` pass `node --check`.
  - `grep -ri gotham resources/js tailwind.config.js` is empty.
  - `event-handlers.js` sets `fontWeight: AppConstants.FONTS.WEIGHT_TEXT` (900); `main.js` sets `fontWeight: AppConstants.FONTS.WEIGHT_LOGO` (800).
  - `preloadFonts` builds one observer per `PRELOAD_FONTS` descriptor with `(family, {weight[,style]})`.
  - Tailwind `fontFamily` keys point to Barlow Semi Condensed; no `font-gotham*` keys remain.
  </done>
</task>

<task type="auto">
  <name>Task 3: Remove the Gotham @font-face CSS, delete the 4 .otf, and update test/doc references so grep is clean</name>
  <files>resources/css/fonts.css, resources/css/input.css, visual-regression/tests/test-utils.js, tests/integration/logo-processing-integration.test.js, resources/fonts/Gotham-Narrow-Book.otf, resources/fonts/Gotham-Narrow-Ultra.otf, resources/fonts/GothamNarrow-Bold.otf, resources/fonts/GothamNarrow-UltraItalic.otf, CLAUDE.md, README.md, TestsToWrite.md, CODE_REVIEW_REPORT.md</files>
  <action>
  Clean up all remaining Gotham surfaces and remove the vendored fonts (No-Vendoring rule).

  1. `resources/css/fonts.css`: the file is no longer `<link>`ed (Task 1) and no longer bundled (Task 1). Delete it: `git rm resources/css/fonts.css`.
  2. `resources/css/input.css:5-20`: remove the entire `@layer base { ... @font-face 'Gotham Narrow' ... @font-face 'Gotham Narrow Bold' ... }` block (the two Gotham `@font-face` rules; remove the enclosing `@layer base` if it then contains nothing else). Do NOT remove the `@tailwind base/components/utilities` directives or the `@layer components` block. Barlow loads via the HTML `<link>`, so no `@font-face` belongs in Tailwind source.
  3. Delete the four vendored fonts: `git rm resources/fonts/Gotham-Narrow-Book.otf resources/fonts/Gotham-Narrow-Ultra.otf resources/fonts/GothamNarrow-Bold.otf resources/fonts/GothamNarrow-UltraItalic.otf`.
  4. `visual-regression/tests/test-utils.js:262-290`: replace the Gotham font-check strings and the "Verify Gotham Narrow fonts are loaded" comment with Barlow weight strings. Set the `fonts` array to:
     ```js
     const fonts = [
         '900 16px "Barlow Semi Condensed"',
         '800 16px "Barlow Semi Condensed"',
         '400 16px "Barlow Semi Condensed"',
         'italic 900 16px "Barlow Semi Condensed"'
     ];
     ```
     Keep the surrounding `document.fonts.ready` await, the `.map(font => document.fonts.check(font))`, and the warn-on-not-loaded logic unchanged.
  5. `tests/integration/logo-processing-integration.test.js:106-108`: change the mock `FONTS: { DEFAULT_LOGO: 'Gotham' }` to `FONTS: { DEFAULT_LOGO: 'Barlow Semi Condensed' }`.
  6. Docs — replace Gotham mentions with Barlow Semi Condensed (active docs; acceptance criterion requires grep clean outside `.development`/`.issues`/`.planning`):
     - `CLAUDE.md:114` "Default text font: Gotham Narrow Ultra (non-italic)" -> "Default text font: Barlow Semi Condensed (weight 900, upright)".
     - `CLAUDE.md:130` "Typography: Gotham Narrow font family" -> "Typography: Barlow Semi Condensed (Grüne-AT house font, loaded via Google Fonts)".
     - `README.md:29-30`: rewrite the two Gotham bullets to Barlow (e.g. "Barlow Semi Condensed 900 — Headlines und Akzente" / "Barlow Semi Condensed 400 — Fließtext und Beschreibungen"). Keep tone/format.
     - `TestsToWrite.md:45-46`: update the two Gotham bullets to Barlow Semi Condensed (weight 900 / 400).
     - `CODE_REVIEW_REPORT.md:64-65`: update the two Gotham strings to "Barlow Semi Condensed" so the repo grep is clean.

  Do NOT modify files under `.development/`, `.issues/`, or `.planning/` (allowed historical exceptions). Do NOT hand-edit `build/` (regenerated in Task 4).
  </action>
  <verify>
  <automated>cd "/workspace/bildgenerator/.worktrees/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen" && test ! -e resources/fonts/Gotham-Narrow-Book.otf && test ! -e resources/fonts/Gotham-Narrow-Ultra.otf && test ! -e resources/fonts/GothamNarrow-Bold.otf && test ! -e resources/fonts/GothamNarrow-UltraItalic.otf && ! grep -riI gotham . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.development --exclude-dir=.issues --exclude-dir=.planning --exclude-dir=build && grep -q 'Barlow Semi Condensed' visual-regression/tests/test-utils.js && grep -q "DEFAULT_LOGO: 'Barlow Semi Condensed'" tests/integration/logo-processing-integration.test.js && echo "PASS"</automated>
  </verify>
  <done>
  - The four `resources/fonts/*.otf` no longer exist.
  - `grep -ri gotham` over the repo (excluding node_modules/.git/.development/.issues/.planning/build) returns nothing.
  - No `@font-face` Gotham rule remains in `fonts.css` (deleted) or `input.css`.
  - `test-utils.js` checks Barlow weight strings; logo integration mock uses `'Barlow Semi Condensed'`.
  - CLAUDE.md, README.md, TestsToWrite.md, CODE_REVIEW_REPORT.md reflect Barlow Semi Condensed.
  </done>
</task>

<task type="auto">
  <name>Task 4: Verify Google Fonts reachability (blocker gate), then run the unit/integration suite green</name>
  <files>(no source edits; verification gate before baseline regen)</files>
  <action>
  Two purposes: (a) surface the network risk EARLY — baseline regen (Task 5) and visual comparison depend on Google Fonts, and re-vendoring is forbidden, so an offline runner is a blocker to raise, NOT work around; (b) confirm the non-visual suite is green after the swap before the expensive baseline regeneration.

  1. Verify the CDN is reachable:
     `curl -sS -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,900;1,900&display=swap"` must print `200`. If it does NOT (`000`/timeout/non-200), STOP and report: "BLOCKER: Google Fonts CDN unreachable from this runner. Barlow is mandated via CDN (No-Vendoring rule) — cannot regenerate baselines or run visual comparison offline. Needs network access to fonts.googleapis.com / fonts.gstatic.com." Do not attempt to re-vendor.
  2. Run the Jest unit/integration suite: `npm test`. The logo-processing integration test now expects `'Barlow Semi Condensed'`; all other suites must stay green. Fix any failure that is a direct consequence of the font swap (string expectations), but do NOT weaken assertions or mock real code.
  </action>
  <verify>
  <automated>cd "/workspace/bildgenerator/.worktrees/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen" && code=$(curl -sS -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,900;1,900&display=swap") && echo "GoogleFonts HTTP $code" && [ "$code" = "200" ] && npm test 2>&1 | tail -25</automated>
  </verify>
  <done>
  - `curl` to the locked Google-Fonts URL returns HTTP 200 (or, if not, the BLOCKER is reported and execution stops).
  - `npm test` (Jest unit + integration) is fully green, including the repointed logo-processing mock.
  </done>
</task>

<task type="auto">
  <name>Task 5: Regenerate all 76 visual-regression baselines and prove the visual + e2e suites green</name>
  <files>visual-regression/reference-images/ (76 PNG baselines, regenerated)</files>
  <action>
  Now that Barlow loads in `build/` and all runtime references use the correct weights, regenerate every baseline. Barlow is narrower than Gotham, so line breaks and textbox heights shift in essentially every text/logo image — regenerating all 76 wholesale is correct and intended (Decision 3). Do NOT hand-edit specs or PNGs; the existing specs already drive the UI like a user.

  1. Regenerate baselines: `npm run generate-references` (= `npm run build && GENERATE_REFERENCE=true playwright test visual-regression/tests/`). This rebuilds `build/` (picking up the Barlow `<link>`) and overwrites `visual-regression/reference-images/*-reference.png`.
  2. Prove green against the fresh baselines: `npm run test:visual` (fast + medium + complex projects). All visual specs must pass with pixelmatch (threshold 0.1, <0.5% diff tolerance — already configured in `test-utils.js`).
  3. Run e2e flows green: `npm run test:e2e` (functional, no pixel baselines).
  4. Sanity-check the font actually rendered (not a fallback): there must be no `Warning: Some fonts may not be fully loaded` in the test output. If that warning appears, Barlow did not load in `build/` — re-check Task 1 placement (`grep googleapis build/index.html`) before trusting any green/regen result.
  5. Confirm the baseline count is still 76 (no specs accidentally added/removed): `ls visual-regression/reference-images/*.png | wc -l` must equal 76.
  </action>
  <verify>
  <automated>cd "/workspace/bildgenerator/.worktrees/z6qfk-gotham-narrow-durch-barlow-semi-condensed-ersetzen-proprietäre-schrift-entfernen" && npm run generate-references 2>&1 | tee /tmp/genref.log | tail -5 && [ "$(ls visual-regression/reference-images/*.png | wc -l)" = "76" ] && npm run test:visual 2>&1 | tee /tmp/visual.log | tail -15 && ! grep -qi "fonts may not be fully loaded" /tmp/visual.log && npm run test:e2e 2>&1 | tail -10</automated>
  </verify>
  <done>
  - `npm run generate-references` completes; `visual-regression/reference-images/` holds exactly 76 regenerated PNGs.
  - `npm run test:visual` passes all fast/medium/complex projects against the new baselines (pixelmatch).
  - No "fonts may not be fully loaded" warning in the test output (Barlow rendered, not a fallback).
  - `npm run test:e2e` passes.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 6: Brand sign-off on regenerated samples (weight mapping is brand-conform)</name>
  <files>(visual review of regenerated baselines / sample exports)</files>
  <action>
  The weight mapping (text 900 / logo 800) is a design judgment; the final arbiter is a human brand check (acceptance criterion: "Optische Abnahme … markenkonform"). Present regenerated samples covering each format and the high-risk cases:
  - one Story, one Post (4:5), and one Print (e.g. A4) sample with default text;
  - the two-line logo-text baselines (`logo-text-two-line*`) — Barlow is narrower, so line breaks may differ;
  - the long-text case (`long-text-input`) — textbox sizing may shift.
  Ask: does Barlow 900 default text read as punchy/heavy enough vs the old Gotham Ultra, and is the logo (800) clearly distinct in weight? Since 900 is the heaviest Barlow weight, if text looks too light the only lever is keeping the logo at 800 (already chosen) — do NOT invent a heavier weight. If the reviewer requests a different logo weight (e.g. 700), adjust `WEIGHT_LOGO` in `constants.js`, re-run Task 5, and re-review.
  </action>
  <verify>
  <automated>echo "Human visual sign-off — no automated gate. Confirm brand-conform per acceptance criterion."</automated>
  </verify>
  <done>
  - Reviewer confirms Story/Post/Print + logo-two-line + long-text samples are brand-conform with text=900 / logo=800 (or an agreed adjusted logo weight, with Task 5 re-run).
  </done>
</task>

</tasks>

<verification>
After all tasks, the full gate:
- `npm run build` succeeds; `grep googleapis build/index.html` and `build/impressum.html` both find the Barlow `<link>`; `grep design-system.css build/index.html` still present.
- `grep -riI gotham .` (excluding node_modules/.git/.development/.issues/.planning/build) returns nothing.
- No `resources/fonts/*.otf` remain.
- `npm test` (Jest) green.
- `npm run test:visual` green against the 76 regenerated baselines, with no font-load warning.
- `npm run test:e2e` green.
- Human brand sign-off recorded (Task 6).
</verification>

<success_criteria>
Maps 1:1 to ISSUE.md acceptance criteria:
- No Gotham `.otf` in the repo; no Gotham reference in active code/docs (`grep -ri gotham` clean outside `.development`/`.issues`/`.planning`). [Tasks 2, 3]
- Barlow Semi Condensed loaded via Google Fonts CDN (no vendoring), with the locked weights present. [Task 1]
- Canvas text rendering uses Barlow Semi Condensed; FontFaceObserver awaits the correct (family, {weight, style}) descriptors. [Task 2]
- Default text font (900), default logo font (800), and Tailwind `fontFamily` all on Barlow. [Task 2]
- Visual-regression baselines regenerated and suite green. [Task 5]
- Repo `CLAUDE.md` (and README/TestsToWrite) reflect Barlow Semi Condensed. [Task 3]
- Optical brand sign-off on Story/Post/Print samples. [Task 6]
</success_criteria>
