# Iterations-Abschluss — Design-System-Migration Phase 0 + Phase 2

Repository: `GrueneAT/bildgenerator`
Umbrella-Issue: GitHub `#26` (Phase 0 → PR #27 + Build-Fix #28; Phase 2 → diese Iteration)
Konsumenten-URL: <https://bildgenerator.gruene.at/>

## Zusammenfassung

Der Bildgenerator war vor der Migration komplett DS-unverbunden — eigene
Tailwind-Component-Schicht, eigene Brand-Hex-Werte und eigene Logo-Asset-Kopie.
Nach Phase 2 nutzt er das Grüne-AT-Design-System (CDN, v2.1) als einzige
Quelle für Marken-Look und Form-/Modal-/Callout-Primitives. App-spezifische
UI ist eindeutig als `.app-*`-Namespace markiert und kollidiert nicht mit
zukünftigen DS-Erweiterungen.

## Phasen

### Phase 0 — Quick-Wins (gemerged via PR #27 + Build-Fix #28)

1. DS-CSS-Link in `index.html` und `impressum.html` (CDN, kein Vendoring).
2. `tailwind.config.js`-Theme zeigt auf `var(--gat-color-*)` (mit Hex-Fallback).
3. DS-Logo per CDN, lokale `Logo-zweizeilig.png`-Kopie gelöscht.
4. `.gat-skiplink` als erstes Body-Element für Tastatur-Navigation.
5. Bootstrap-`.choice label`-Tot-Code aus `resources/css/style.css` entfernt.

### Phase 2 — Voll-Migration (diese Iteration)

Sechs atomare Commits gegen `origin/main`:

1. `e5han: refactor(forms): .gat-input-Familie statt .form-*`
2. `e5han: refactor(modal): .gat-modal statt lokales Overlay-CSS`
3. `e5han: refactor(callout): .gat-callout-Modifier statt lokale Banner`
4. `e5han: refactor(tokens): Magenta/Gelb-Inlines via var(--gat-color-*)`
5. `e5han: refactor(naming): app-spezifisch auf .app-*-Namespace`
6. `e5han: docs: iteration-abschluss mit migrations-zusammenfassung` (dieser
   Commit)

## Detaillierte Migrations-Schnitte

### Form-Komponenten (Commit 1)

| Alt (lokal) | Neu (DS) | Wo |
|---|---|---|
| `.form-input` | `.gat-input` (für `<input>`), `.gat-textarea` (für `<textarea>`) | `index.html` Step 3 / `qrcode-wizard.js` |
| `.form-select` | `.gat-select` | `index.html` Step 1/3/4 + QR-Vorschau |
| `.form-checkbox` | `.gat-checkbox` | Logo-Toggle in Step 1 |
| `type=range` Tailwind-Inline | `.gat-range` | Größen-Slider in Step 3 |
| Lokale `.form-input:focus` Override | (entfällt — DS liefert Focus-Styling) | `resources/css/style.css` |

`grep -rE "\.form-(input|select|textarea|checkbox|radio|range)" --include="*.html" --include="*.js" --include="*.css" .` → **0 Treffer in Quelldateien**.

Die `.text-method`-Klasse bleibt erhalten, weil sie ein JS-Selektor-Hook ist,
kein Styling.

### Modal (Commit 2)

`<div class="modal-overlay">/<div class="modal-container">` → `<dialog
class="gat-modal gat-modal--wide gat-modal--blur">` mit `gat-modal__head`,
`__title`, `__close`, `__body`.

`resources/js/modal.js` ruft jetzt `dialog.showModal()` / `dialog.close()`
statt jQuery-`.hidden`-Toggle. Esc und Backdrop-Click werden vom nativen
`<dialog>` selbst geliefert; ein `close`-Listener leert das iframe-`src`
zuverlässig. Body-Scroll-Lock wird vom Top-Layer von `<dialog>` übernommen,
der manuelle `body.overflow-hidden`-Hack ist weg.

### Callouts (Commit 3)

Drei lokale Tailwind-Banner durch DS-Callouts ersetzt:

| Wo | Vorher | Nachher |
|---|---|---|
| Step 3, Kreis-Ausschnitt-Hinweis | `bg-yellow-50 + border-yellow-200 + …` | `.gat-callout.gat-callout--warn` |
| Step 4, Download-Fertig-Hinweis | `bg-blue-50 + border-blue-200 + …` | `.gat-callout.gat-callout--info` |
| QR-vCard, Optionale-Felder-Hinweis | `bg-blue-50 + border-blue-200 + …` | `.gat-callout.gat-callout--info` |

Die DS-Komponente bringt Icon und Border-Left selbst mit, daher entfällt
der manuelle `flex / icon / text`-Wrapper.

### Brand-Tokens (Commit 4)

CSS-Hex-Inlines (`#257639`, `#fef3cd`, `#fbbf24`) in `style.css` durch
`var(--gat-color-primary, …)` / `color-mix()` mit `var(--gat-color-gelb)`
ersetzt. `constants.js` `PINK_CIRCLE` von `rgb(225,0,120)` auf das
kanonische Magenta `#E6007E` korrigiert.

`tailwind.config.js` zeigte schon seit Phase 0 auf DS-Tokens.

### `.app-*`-Namespace (Commit 5)

16 app-spezifische CSS-Klassen umbenannt; betraf 15 Dateien
(HTML/CSS/JS/Tests). DOM-IDs und jQuery-Data-Keys bleiben stabil.

Wahlkreuz und Logo nutzen DS-Assets via CDN (Phase 0). Die `add-pink-circle`,
`add-cross`-IDs in `event-handlers.js` bleiben — IDs, keine Klassen.

## Out-of-Scope für diese Iteration

Diese DS-Wellen sind noch nicht released und bleiben lokal mit
`.app-*`-Namespace, bis sie verfügbar sind:

- **Toast-Container** (`.gat-toast` → DS-v2.2): `alert-system.js` nutzt
  weiterhin lokale Tailwind-Klassen. Container ist `.app-alert-container`.
- **Searchable-Select / Combobox** (`.gat-combobox` → DS-v2.3): die ganze
  `app-searchable-select`-Familie bleibt lokal.
- **Wizard-Step-Indicator** (`.gat-step-indicator` → DS-v2.3): bleibt als
  `.app-step-indicator` lokal.

Tracking: <https://github.com/GrueneAT/design-system/issues/13>.

## Tests & Build

- Unit-/Integration-Tests (Jest): **102/102 grün** in allen 6 Commits.
- Production-Build (`npm run build`) erzeugt deterministisch
  `build/index-production.html` + `app.min.css`/`.js` + Vendor-Bundles.
- Visual-Regression-Tests (Playwright): bewusst nicht hier ausgeführt —
  diese Iteration produziert gewollten Pixel-Drift (DS-Komponenten haben
  andere Proportionen und der Pink-Kreis verschiebt sich auf das kanonische
  Marken-Magenta). VRT-Referenzbilder werden bei Bedarf nach Merge neu
  generiert. Pixel-Drift-Quellen:
  - `gat-input` / `gat-select` / `gat-textarea` haben andere Padding/
    Border/Focus-Ring-Werte als die Vorgänger.
  - `gat-modal` öffnet im Top-Layer mit eigenem Backdrop-Look.
  - `gat-callout--info/warn` zeigt Icon + Border-Left statt
    farbig-getöntem Tailwind-Block.
  - `PINK_CIRCLE` von `rgb(225,0,120)` auf `#E6007E` — sichtbarer
    Canvas-Color-Shift bei allen Pink-Kreis-Referenzen.

## Konsumenten-Verträge

- Pages-URL `https://bildgenerator.gruene.at/` bleibt stabil.
- Keine neuen Vendor-Verzeichnisse — DS-CSS und DS-Logo werden weiterhin
  per CDN geladen.
- Keine Werkzeug-Attribution irgendwo (`grep -rE "claude|Generated with|
  Co-Authored-By" .` → 0).

## Querschnitt nach Phase 2 vs. Phase 0

| Kriterium | Phase 0 | Phase 2 (jetzt) |
|---|---|---|
| `<link>` auf DS-CSS in `index.html` + `impressum.html` | ✓ | ✓ |
| Tailwind-Theme nutzt `var(--gat-*)`-Tokens | ✓ | ✓ |
| DS-Logo per CDN, lokale Kopie gelöscht | ✓ | ✓ |
| `.gat-skiplink` am Body-Anfang | ✓ | ✓ |
| `.choice label`-Tot-Code entfernt | ✓ | ✓ |
| Keine `.form-*` Klassen in Quelldateien | – | ✓ |
| Modale Dialoge nutzen `.gat-modal` | – | ✓ |
| Banner nutzen `.gat-callout--*` | – | ✓ |
| Lokale CSS-Inlines via DS-Token | – | ✓ |
| App-spezifische UI als `.app-*`-Namespace | – | ✓ |
| `notes/iteration-abschluss.md` | – | ✓ (dieses Dokument) |

## Nächste Schritte (für Folge-Iterationen)

1. Nach DS-v2.2-Release: `alert-system.js` von lokalen Tailwind-Klassen
   auf `.gat-toast` umstellen. Container von `.app-alert-container`
   auf `.gat-toast-container` umbenennen.
2. Nach DS-v2.3-Release: Searchable-Select-Logik auf `.gat-combobox`
   umheben. Wizard-Step-Indicator auf `.gat-step-indicator` umheben.
3. `gat-field`-Wrapper (`__label`/`__hint`/`__error`) konsequent auf alle
   Formular-Felder anwenden — diese Iteration belässt die existierende
   Tailwind-Wrapper-Struktur, um Layout-Drift gering zu halten.
