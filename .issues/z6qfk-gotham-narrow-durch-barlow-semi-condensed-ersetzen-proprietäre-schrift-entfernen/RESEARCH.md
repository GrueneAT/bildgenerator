# Research: Gotham Narrow durch Barlow Semi Condensed ersetzen

**Researched:** 2026-06-03
**Issue:** z6qfk
**Confidence:** HIGH (codebase fully traced; Barlow weights verified against live Google Fonts CSS)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Schrifteinbindung — Google Fonts CDN (gezielt).** Barlow Semi Condensed wird **direkt von Google Fonts** geladen, per `@import`/`<link>`, ausschließlich für diese Schrift:
   ```
   https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,900&display=swap
   ```
   **Nicht** gewählt: das komplette `design-system.css` von `grueneat.github.io` zu verlinken (das hängt bereits in `index.html`, bringt aber Layout-/Farb-Tokens und Vollkorn mit → außerhalb des Scope). Family-Name für Canvas/Fabric.js/FontFaceObserver: exakt **`"Barlow Semi Condensed"`**. Webfonts tainten das Canvas nicht. Kein Vendoring — die vier Gotham-`.otf` in `resources/fonts/` werden entfernt.
2. **Gewicht-Mapping — im Research zu entscheiden** (siehe `## Architecture Patterns` unten; konkrete Empfehlung gegeben).
3. **Scope — Schrift + Visual-Regression-Baselines.** Im Scope: Schriftaustausch + Neuaufnahme aller betroffenen Visual-Regression-Referenzbilder. Farben, Logos, Layout-Tokens und sonstige DS-Aspekte bleiben **außerhalb**.

### Claude's Discretion
- Exaktes Gewicht-Mapping inkl. Italic-Handhabung.
- Genaue Einbindungsstelle des Google-Fonts-`@import`.

### Deferred Ideas (OUT OF SCOPE)
- Verlinken des kompletten `design-system.css` als Font-Quelle.
- Farben, Logos, Layout-Tokens, sonstige DS-Migration.
</user_constraints>

## Summary

Der Austausch ist **gut umrissen und mechanisch geradlinig**, aber mit einer wichtigen strukturellen Pointe: Gotham wurde als **vier separate `@font-face`-Family-Namen** modelliert (`"Gotham Narrow Ultra"`, `"… Ultra Italic"`, `"… Book"`, `"… Bold"`), Barlow Semi Condensed ist dagegen **eine Family mit numerischen Gewichten**. Der Code selektiert Schrift heute ausschließlich über `fontFamily`-Stringliterale (Fabric.js bekommt z. B. `fontFamily: "Gotham Narrow Ultra"`) — es wird **nirgends** `fontWeight`/`fontStyle` zur Schriftauswahl gesetzt (`fontStyle` ist überall hart `"normal"`). Der saubere, risikoarmste Weg ist deshalb: **Family-Name überall auf `"Barlow Semi Condensed"` setzen UND zusätzlich `fontWeight` (und für Italic `fontStyle`) explizit setzen**, weil ein einzelner Family-Name ohne Gewicht sonst Barlow 400 rendert statt der gewünschten 900/700.

Die Font-Ladekette ist klar: `@font-face` heute in **zwei** CSS-Dateien (`resources/css/fonts.css` als runtime-Quelle, `resources/css/input.css` als Tailwind-Source-Duplikat), `<link>` auf `fonts.css` in `index.html` (Dev) **und** in `impressum.html`, Bündelung über `scripts/build-css.js` (`fonts.css` zwischen FontAwesome und Tailwind). Visual-Regression läuft gegen den **Production-Build** (`make serve-build` → `build/`), nicht gegen die Dev-`index.html` — der Google-Fonts-`<link>` muss daher so eingebaut werden, dass `scripts/build.js` ihn in `build/index.html` übernimmt. Sicherster Mechanismus: den Google-Fonts-`<link>` in den `<head>` von `index.html` (und `impressum.html`) setzen, der von der CSS-Bundle-Replace-Regex **nicht** angefasst wird, und `fonts.css` leeren/entfernen.

`grep -ri gotham` muss am Ende leer sein (außer Changelog/.development-Historie). Es gibt **keinen** Font-Picker mehr im UI (das `#font-style-select`-Dropdown wurde bereits im `corporate-identity-update`-Issue entfernt), also keine UI-Optionsstrings zu ändern — Text ist hart auf eine Schrift verdrahtet (`event-handlers.js:141`).

**Primary recommendation:** Eine Family `"Barlow Semi Condensed"` via Google-Fonts-`<link>` im `<head>` von `index.html` + `impressum.html`; `fonts.css`/`input.css`-`@font-face` entfernen; alle JS-Stringliterale auf `"Barlow Semi Condensed"` umstellen **und** das fehlende Gewicht über neue `FONTS.WEIGHTS`-Konstanten als `fontWeight` (900 Text / 800 Logo) bzw. `fontStyle` (Italic-Fall) explizit an Fabric.js übergeben; alle 76 Referenzbilder mit `npm run generate-references` neu aufnehmen und optisch abnehmen.

## Codebase Analysis

### Relevant Code

| File | Purpose | Relevance |
|------|---------|-----------|
| `resources/css/fonts.css` | 4 `@font-face` Gotham → runtime-Quelle, via `<link>` in index.html/impressum.html und gebündelt | **ENTFERNEN/LEEREN** |
| `resources/css/input.css:7-19` | Tailwind-Source: `@font-face` `'Gotham Narrow'` (italic!) + `'Gotham Narrow Bold'` in `@layer base` | **`@font-face`-Block entfernen** |
| `resources/css/output.css` | Tailwind-Build-Output (generiert aus input.css) | Wird neu gebaut; ggf. Gotham-Reste prüfen |
| `tailwind.config.js:20-23` | `fontFamily.gotham` / `gotham-bold` | **umstellen auf Barlow** (oder entfernen — siehe Decisions: vermutlich Tot-Code) |
| `resources/js/constants.js:82-91` | `FONTS.DEFAULT_LOGO/DEFAULT_TEXT/PRELOAD_FONTS` | **Kern der Änderung** |
| `resources/js/handlers.js:1-19` | `loadFont()` mit `customFonts = ['Gotham Narrow']` + FontFaceObserver | **umstellen** |
| `resources/js/wizard.js:21-36` | `preloadFonts()` — 4× `FontFaceObserver('Gotham Narrow …')` | **umstellen** |
| `resources/js/event-handlers.js:141` | `const selectedFont = "Gotham Narrow Ultra"` — Default beim Text-Erstellen | **umstellen + fontWeight setzen** |
| `index.html:29` | `<link ... href="resources/css/fonts.css">` (Dev); `index.html:25` DS-CDN bereits da | **Google-Fonts-`<link>` ergänzen, fonts.css-`<link>` entfernen** |
| `impressum.html:21` | `<link ... href="resources/css/fonts.css">` | **gleiche Behandlung** |
| `scripts/build-css.js:14-19,42-43` | CSS-Bundle-Reihenfolge inkl. `fonts.css`; URL-Rewrite `../fonts/` | **`fonts.css` aus `CSS_FILES_ORDER` entfernen** (sonst nur Warnung) |
| `scripts/build.js:77-80,114-117` | Production-HTML: Regex ersetzt FontAwesome→style.css-Block durch DS-CDN+`app.min.css`; lässt andere `<head>`-`<link>` intakt | **Einbaustelle des GF-`<link>` muss diese Regex überleben** |
| `visual-regression/tests/test-utils.js:267-285` | `document.fonts.check('16px "Gotham Narrow …"')` Smoke-Check | **Font-Strings umstellen** |
| `tests/integration/logo-processing-integration.test.js:107` | Mock `FONTS: { DEFAULT_LOGO: 'Gotham' }` | **Mock-Wert umstellen** |
| `resources/fonts/*.otf` (4 Dateien) | Vendorisierte Gotham-OTFs | **LÖSCHEN** |
| `CLAUDE.md:114,130` (Repo) | „Default text font: Gotham Narrow Ultra" / „Typography: Gotham Narrow font family" | **Text aktualisieren** |
| `README.md:29-30` | Gotham-Erwähnungen | **aktualisieren** (UI-sichtbar? nein, Doku) |
| `TestsToWrite.md:45-46` | Gotham-Erwähnungen | aktualisieren (reine Doku/TODO, optional) |

### Interfaces

<interfaces>
// === resources/js/constants.js:82-91 — AppConstants.FONTS (the single source of truth) ===
FONTS: {
    DEFAULT_LOGO: "Gotham Narrow Bold",   // used by logo text overlay
    DEFAULT_TEXT: "Gotham Narrow Ultra",  // used as canvas text default (also hardcoded in event-handlers.js:141)
    PRELOAD_FONTS: [
        'Gotham Narrow Ultra Italic',
        'Gotham Narrow Ultra',
        'Gotham Narrow Book',
        'Gotham Narrow Bold'
    ]
}
// NOTE: there is NO weight/style field today — selection is purely by family name.

// === resources/js/handlers.js:1-19 — loadFont (only path that re-applies a font to active text) ===
function loadFont(font) {
    const customFonts = ['Gotham Narrow'];   // NB: 'Gotham Narrow' is NOT one of the 4 declared families — effectively dead branch
    const text = canvas.getActiveObject();
    if (!text) return;
    if (customFonts.includes(font)) {
        const fontObserver = new FontFaceObserver(font);
        fontObserver.load().then(function () {
            text.set("fontFamily", "");
            text.set("fontFamily", font);
            canvas.renderAll();
        });
    } else {
        text.set("fontFamily", font);   // current real path for any string
        canvas.renderAll();
    }
}

// === resources/js/wizard.js:21-36 — preloadFonts (called on initializeWizard) ===
function preloadFonts() {
    const fonts = [
        new FontFaceObserver('Gotham Narrow Ultra Italic'),
        new FontFaceObserver('Gotham Narrow Ultra'),
        new FontFaceObserver('Gotham Narrow Book'),
        new FontFaceObserver('Gotham Narrow Bold')
    ];
    fonts.forEach(font => { font.load().then(...).catch(...); });
}
// FontFaceObserver('Family').load() resolves once the browser has loaded a face for that family.
// With Barlow as ONE family + multiple weights, observe with explicit weight:
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 900 }).load()
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 800 }).load()
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 900, style: 'italic' }).load()
//   new FontFaceObserver('Barlow Semi Condensed', { weight: 400 }).load()

// === resources/js/event-handlers.js:131-160 — setupTextHandler (fabric.Text creation) ===
const selectedFont = "Gotham Narrow Ultra";
const text = new fabric.Text(jQuery("#text").val(), {
    fontFamily: selectedFont,
    fontSize: initialFontSize,
    fontStyle: "normal",       // <-- ALWAYS "normal"; no fontWeight is ever set
    textAlign: ...,
    fill: ...,
    lineHeight: parseFloat(jQuery("#line-height").val()) || 1.0,
    ...
});
// To keep Ultra's heaviness with Barlow, add:  fontWeight: 900

// === Fabric.js text weight/style selection (verified against fabric.min.js usage) ===
// fabric.Text / fabric.IText honor fontFamily + fontWeight + fontStyle independently.
// The canvas font string fabric builds is: `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`.
// => With a single family, fontWeight is the ONLY way to pick 900 vs 800 vs 400.

// === scripts/build-css.js:14-19 — CSS bundle order (fonts.css currently included) ===
const CSS_FILES_ORDER = [
    'vendors/fontawesome/css/all.css',
    'resources/css/fonts.css',   // <-- remove this entry when fonts.css is deleted
    'resources/css/output.css',
    'resources/css/style.css'
];

// === scripts/build.js:77-80 — production HTML CSS-link rewrite (DO NOT break) ===
// Regex collapses the run from <link ... fontawesome/all.css> ... <link ... style.css?v=>
// into: DS-CDN <link> + <link app.min.css>. A Google-Fonts <link> placed ABOVE the
// fontawesome <link> (e.g. right after the DS-CDN <link> at index.html:25, or before line 23)
// survives the rewrite; one placed INSIDE that run gets deleted.

// === visual-regression/tests/test-utils.js:267-285 — font readiness gate ===
const fonts = [
    '16px "Gotham Narrow Ultra Italic"',
    '16px "Gotham Narrow Book"',
    '16px "Gotham Narrow Bold"'
];
const results = fonts.map(font => document.fonts.check(font));
// document.fonts.check needs an exact family+size string; for Barlow use e.g.
//   '900 16px "Barlow Semi Condensed"', '400 16px "Barlow Semi Condensed"',
//   'italic 900 16px "Barlow Semi Condensed"', '800 16px "Barlow Semi Condensed"'

// === Verified live Google Fonts CSS (the locked import URL) ===
// family-name: 'Barlow Semi Condensed'
// normal weights present: 400, 600, 700, 800, 900
// italic weights present: 400, 900
</interfaces>

### Reusable Components
- `FontFaceObserver` (vendored, already bundled) supports a 2nd argument `{ weight, style }` — reuse it to await specific Barlow weights instead of distinct families.
- `AppConstants.FONTS` is the single config surface; widen it (add `WEIGHTS`/`STYLES` or per-role objects) rather than scattering numeric literals.
- `document.fonts.ready` + `document.fonts.check(...)` already gate the visual tests — keep the gate, just change the strings.

### Recommended Implementation Steps
- **Step 1 — Embed Barlow via Google Fonts.** Add the scoped Google-Fonts `<link>` to the `<head>` of `index.html` (and `impressum.html`) beside the DS-CDN link; remove the `@font-face` blocks from `resources/css/fonts.css` and `resources/css/input.css`; drop the `resources/css/fonts.css` entry from `CSS_FILES_ORDER` in `scripts/build-css.js`; remove the `fonts.css` `<link>` from both HTML files.
- **Step 2 — Repoint runtime font selection.** Update `constants.js` `FONTS` (family + new weight constants), `event-handlers.js:141` (family `"Barlow Semi Condensed"` + `fontWeight: 900`), `handlers.js` `customFonts`, `wizard.js` `preloadFonts` to `FontFaceObserver('Barlow Semi Condensed', {weight,...})`, and `tailwind.config.js` `fontFamily`.
- **Step 3 — Update tests and docs and delete the OTFs.** Change the `document.fonts.check` strings in `visual-regression/tests/test-utils.js`, the `DEFAULT_LOGO` mock in `tests/integration/logo-processing-integration.test.js`, the repo `CLAUDE.md`/`README.md`; delete the four `resources/fonts/*.otf`.
- **Step 4 — Regenerate baselines and sign-off.** Run `npm run generate-references`, then `npm run test:visual` until green, and do the visual brand sign-off on story/post/print samples.

### Potential Conflicts
- **`fontStyle: "normal"` hardcoded** in `event-handlers.js:146` while the OLD default was *Ultra* (upright). The OLD Tailwind `input.css` `@font-face` for `'Gotham Narrow'` was declared `font-style: italic` — but that family is not used by the canvas default, so the canvas default already rendered upright Ultra. With Barlow, keep upright (`fontStyle: "normal"`, `fontWeight: 900`). No italic in the default path.
- **`design-system.css` is already linked** (`index.html:25`) and itself `@import`s Barlow Semi Condensed via Google Fonts. Adding a second, scoped Google-Fonts `<link>` is intentional per the locked decision (don't *rely* on the DS file) and is harmless (browser dedupes). Do NOT remove the DS-CDN `<link>` — `tailwind.config.js` colors depend on its `--gat-*` tokens.
- **`tailwind.config.js` `font-gotham*`** utilities appear to be dead code (audit note `e5han/.../audit.md:136`: no direct `font-gotham` usage found in HTML). Safe to repoint to Barlow or drop; confirm with a grep for `font-gotham` in `index.html`/JS before deleting.

## Standard Stack
| Library | Version | Purpose | Why Standard | Confidence |
|---------|---------|---------|--------------|------------|
| Barlow Semi Condensed (Google Fonts) | live CDN | Brand font, replaces Gotham | DS-mandated (`--gat-font-headline/-copy`), SIL OFL, free | HIGH (live CSS verified) |
| FontFaceObserver (vendored) | existing | Await webfont before canvas render | already in repo, supports `{weight,style}` | HIGH |
| Fabric.js (vendored) | existing | Canvas text; honors fontFamily+fontWeight+fontStyle | already in repo | HIGH |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Scoped Google-Fonts `<link>` | Rely on `design-system.css` `@import` | Rejected by locked decision; couples font load to full DS file |
| One family + fontWeight | 4 self-hosted `@font-face` aliases mapping to Barlow weights | Re-introduces complexity & a CSS layer; numeric weight is cleaner and matches DS |

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Await font before canvas paint | Custom timeout/polling | `FontFaceObserver(family,{weight,style}).load()` (already used) | Reliable, in repo |
| Weight selection for one family | 4 fake family names | Fabric `fontWeight` numeric | Matches Google Fonts model + DS |
| Baseline image regen | Manual screenshot capture | `npm run generate-references` (`GENERATE_REFERENCE=true`) | Built-in mechanism (`test-utils.js:160-162`) |

## Architecture Patterns

### Recommended Approach — Weight Mapping (resolves Decision 2)

Barlow Semi Condensed is **lighter and narrower** than Gotham Narrow at equal nominal weight, and Gotham *Ultra* is an extreme display black. To preserve the punchy default headline look, map **up**, not 1:1:

| Gotham (alt) | Rolle | Barlow SC (neu) | Begründung |
|---|---|---|---|
| Gotham Narrow Ultra | **Default-Text** (`DEFAULT_TEXT`) | **900 (Black)**, upright | Schwerste verfügbare Barlow-Stärke; nähste Entsprechung zu Ultra. Verfügbar (verifiziert). |
| Gotham Narrow Ultra Italic | (PRELOAD; kein Default-Pfad) | **900 italic** | Einzige schwere Italic in der locked Import-URL (`1,900`). |
| Gotham Narrow Bold | **Default-Logo** (`DEFAULT_LOGO`) | **800 (ExtraBold)** | Bold→700 wirkt neben Barlow-900-Text zu nah/leicht; 800 erhält klare Hierarchie. 800 ist in der Import-URL vorhanden. |
| Gotham Narrow Book | (PRELOAD) | **400 (Regular)** | Direkte Buch-/Fließtext-Entsprechung. |

**Empfehlung:** Default-Text **900 upright**, Default-Logo **800**. Wenn die optische Abnahme zeigt, dass 900 für den Default-Text *zu leicht* gegen Gotham Ultra wirkt, gibt es keine schwerere Stufe — dann ist die Hierarchie über Logo=800 (statt 700) der Hebel, nicht eine höhere Text-Stufe.

**Condensed-Risiko:** Barlow Semi Condensed ist schmaler als Gotham Narrow. Bei gleichem `fontSize` werden Zeilen **kürzer/schmaler** → in den Templates können sich **Zeilenumbrüche und Textbox-Höhen verschieben** (Logo-Text nutzt `LOGO.TEXT_SCALE_*`, `MAX_TEXT_LENGTH`, `scaleElementToFit`). Das ist **erwartet** und wird durch die Baseline-Neuaufnahme abgedeckt; bei der optischen Abnahme gezielt auf zweizeiligen Logo-Text (`logo-text-two-line*`) und langen Text (`long-text-input`) achten.

### Anti-Patterns to Avoid
- **Nur `fontFamily` umstellen, ohne `fontWeight` zu setzen** → Barlow rendert 400 statt 900; Default-Text wirkt dünn. Immer `fontWeight` mitgeben.
- **Google-Fonts-`<link>` nur in `index.html`** → fehlt im Production-Build, wenn er in die ersetzte CSS-Link-Region fällt → Visual-Regression (läuft gegen `build/`) rendert ohne Barlow. Platzierung außerhalb der Replace-Regex (Decisions).
- **`fonts.css` leeren, aber Eintrag in `CSS_FILES_ORDER` belassen** → nur eine Build-Warnung, kein harter Fehler; trotzdem den Eintrag entfernen.
- **Doppelten DS-CDN-`<link>` entfernen** → bricht `--gat-*`-Farben in Tailwind.

## Common Pitfalls

### Production-Build vs. Dev-HTML divergiert
**What goes wrong:** Font lädt in `make dev`, aber Visual-Regression (gegen `build/index.html` via `make serve-build`) rendert Fallback-Schrift.
**Why:** `scripts/build.js:77-80` ersetzt den `<link>`-Block von FontAwesome bis `style.css`. Ein dort platzierter GF-`<link>` verschwindet.
**How to avoid:** GF-`<link>` direkt nach dem DS-CDN-`<link>` (`index.html:25`) oder vor dem FontAwesome-`<link>` (Zeile 23) einfügen — beide liegen am Rand/außerhalb der Replace-Spanne; nach `npm run build` `build/index.html` prüfen (`grep googleapis build/index.html`).
**Warning signs:** `document.fonts.check('900 16px "Barlow Semi Condensed"')` → `false` in test-utils Warnung.

### FontFaceObserver wartet auf falsche Identität
**What goes wrong:** `new FontFaceObserver('Barlow Semi Condensed')` ohne `{weight}` resolved evtl. schon bei 400, während 900 noch lädt → erster Canvas-Render zu dünn.
**How to avoid:** Pro benötigtem Gewicht ein Observer mit `{weight}` (und Italic mit `{style:'italic'}`).
**Warning signs:** FOUT auf Canvas beim ersten Text-Hinzufügen.

### `grep -ri gotham` nicht leer
**What goes wrong:** Akzeptanzkriterium verfehlt.
**How to avoid:** Alle in der Tabelle gelisteten Stellen abräumen; `.development/` und `.issues/`-Historie sind erlaubte Ausnahmen (Changelog/Archiv) — Repo-`CLAUDE.md`, `README.md`, `TestsToWrite.md`, `.planning/codebase/STRUCTURE.md` sind aktive Doku und sollten aktualisiert werden.

### Italic-Pfad existiert nicht im Default
**What goes wrong:** Über-Engineering für Italic, obwohl der Default-Text upright ist und es kein UI-Dropdown mehr gibt.
**How to avoid:** Italic nur in PRELOAD/Observer abdecken (`1,900` ist verfügbar); kein Default-Pfad setzt Italic. `event-handlers.js` bleibt `fontStyle: "normal"`.

## Environment Availability
| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Internet (Google Fonts CDN) | Font load (dev+prod+tests) | Assumed | Workspace-CLAUDE.md: kein Offline-Ziel, Internet darf vorausgesetzt werden. Playwright-CI muss `fonts.gstatic.com` erreichen. |
| Node + Playwright + Chromium | Visual regression | Per repo setup | `npm run generate-references` baut + rendert |
| `document.fonts` API | test-utils gate | Chromium ✓ | bereits genutzt |

**Risiko CI-Netzwerk:** Visual-Regression hängt jetzt an Google Fonts (vorher lokale OTF). Wenn CI ohne Netz läuft, würden Barlow-Faces fehlen → Fallback → Diff. Bei Baseline-Regen UND CI-Lauf muss Netz verfügbar sein. Falls CI offline ist, ist das ein zu meldender Plan-Risikopunkt (kein Workaround durch Re-Vendoring — verstößt gegen Workspace-Regel).

## Project Constraints (from CLAUDE.md)

**Workspace `/workspace/CLAUDE.md`:**
- **Kein Vendoring von Drittabhängigkeiten** — Barlow per CDN, keine neuen `.otf`. Die vier Gotham-`.otf` müssen weg. (Kern dieses Issues.)
- **Keine Werkzeug-Attribution** in Commits/Code/Kommentaren — kein „claude", kein „Generated with", kein `Co-Authored-By`.

**Repo `CLAUDE.md` (bildgenerator):**
- NEVER inline styles; ALWAYS Tailwind; Custom-CSS nur wenn nötig.
- Visual-Regression: Canvas/Elemente **nie** direkt manipulieren — immer wie ein User über UI-Features (`#text` füllen, `#add-text` klicken). Die bestehenden Specs tun das bereits.
- **ALWAYS pixelmatch** beim Vergleich (bereits in `test-utils.js`; Threshold 0.1, Toleranz <0.5% Diff).
- Neue Visual-Test-Dateien müssen in `playwright.config.js` registriert werden (hier nicht relevant — keine neuen Specs, nur Baselines).
- Repo-`CLAUDE.md:114,130` selbst nennt Gotham → muss aktualisiert werden (Akzeptanzkriterium).

## Visual-Regression Impact (Decision 3)

- **Mechanik:** `test-utils.js` `compareWithReference()` lädt das Canvas-Bild herunter und vergleicht via `pixelmatch` gegen `visual-regression/reference-images/<name>-reference.png` (76 PNGs). Mit `GENERATE_REFERENCE=true` werden die Referenzen überschrieben (`test-utils.js:160-162`).
- **Regen-Befehl:** `npm run generate-references` (= `npm run build && GENERATE_REFERENCE=true playwright test visual-regression/tests/`). Danach `npm run test:visual` zum Grün-Prüfen.
- **Tests laufen gegen den Production-Build** (`webServer: "make serve-build"`) → GF-`<link>` muss in `build/index.html` landen (siehe Pitfalls).
- **Betroffene Specs (rendern Text):** `text-system.spec.js` (alle text-* Baselines), `layouts.spec.js`, `positioning.spec.js`, `background-images.spec.js`, `error-handling.spec.js`, plus Logo-Text-Baselines (`logo-text-*`) und QR-Text (`qr-text`, `qr-minimal-text`). In der Praxis: **praktisch alle 76 Referenzbilder mit Text/Logo neu** — pauschal alle regenerieren ist am sichersten, da auch Default-Logo-Text die Schrift nutzt.
- **e2e** (`e2e/*.spec.js`) nutzt ebenfalls Text-Flows, aber ohne pixelgenaue Referenzbilder (Funktionsprüfung) — nach Umstellung grün halten.

## Sources
### HIGH confidence
- Codebase analysis (alle oben zitierten `file:line`), `grep -rin gotham`, `scripts/build*.js`, `playwright.config.js`, `package.json`, `Makefile`.
- Live Google Fonts CSS für die locked Import-URL (Family-Name + vorhandene Gewichte 400/600/700/800/900 + Italic 400/900 verifiziert).
### MEDIUM confidence
- Barlow ist „leichter/schmaler" als Gotham Narrow bei gleicher Nominalstärke → Mapping nach oben (Designurteil, gestützt auf bekannte Metriken beider Schriften; finale Bestätigung durch optische Abnahme).
### LOW confidence (needs validation)
- `tailwind.config.js` `font-gotham*` ist Tot-Code (Audit-Notiz aus Archiv; vor Löschen per Grep bestätigen).
- CI-Netzwerkzugriff auf Google Fonts (umgebungsabhängig; im Plan als Risiko führen).

## Metadata
**Confidence breakdown:** Codebase HIGH; Font availability HIGH; Weight mapping MEDIUM (Designurteil, optische Abnahme entscheidet); CI-Netz LOW.
**Research date:** 2026-06-03
**Sub-agents used:** none (single-researcher; standard depth, fully traceable in-repo).
**Note:** `.issues/MAP.md:45` ("fonts.css … Gotham") und `.planning/codebase/STRUCTURE.md` sind nach Umstellung stale — optionale Doku-Pflege.
