# DS-v2.2-Adoption — Bildgenerator

Repository: `GrueneAT/bildgenerator`
Konsumenten-URL: <https://bildgenerator.gruene.at/>
Stand: 2026-05-24
Branch: `issue/v22a-bildgenerator-adopt-toast-dropzone`

## Zusammenfassung

DS v2.2 liefert vier neue Komponenten: `.gat-toaster`/`.gat-toast`,
`.gat-dropzone`, `.gat-table`, `.gat-toolbar`. Diese Iteration nimmt davon
die zwei Komponenten auf, die im Bildgenerator tatsaechlich ein
Pendant haben — Toast-Region und File-Upload-Trigger — und macht klar,
warum `.gat-table` und `.gat-toolbar` ausgelassen werden.

Die in `e5han/notes/iteration-abschluss.md` als „Out-of-Scope" markierte
Toast-Adoption (Punkt 1) ist damit erledigt; Searchable-Select und
Wizard-Step-Indicator bleiben weiterhin offen (warten auf v2.3).

## Commits

1. `v22a: refactor(toast): .app-alert-container -> .gat-toaster mit semantischen Varianten`
2. `v22a: refactor(dropzone): file upload -> .gat-dropzone fuer Step 2 (Bild hochladen)`
3. `v22a: chore(css): style.css aufgeraeumt — obsoletes Kommentar-Block entfernt`
4. `v22a: docs: v22-adoption notiz` (dieser Commit)

## Adoptierte v2.2-Komponenten

### `.gat-toaster` + `.gat-toast` (Commit 1)

Globaler Toast-Container war frueher `<div class="app-alert-container hidden">`
mit lokaler Tailwind-Banner-Optik (`bg-green-50`, `bg-red-50`, …) und
top-fixed Positionierung. Jetzt:

- Container: `<div class="gat-toaster app-alert-container" role="region" aria-live="polite">`
  — DS positioniert bottom-right, gibt aria-live=polite vor, Klasse
  `.app-alert-container` bleibt als Alias am selben Element, damit
  bestehende Selektoren in Tests/anderem JS weiter funktionieren.
- Pro Toast: `.gat-toast.gat-toast--{info,success,warn,error}` mit
  `.gat-toast__icon`, `.gat-toast__body`, `.gat-toast__close`. Legacy-
  Klasse `.alert` und Close-Button-Hook `.alert-close-btn` bleiben
  zusaetzlich am Knoten — Visual-Regression-Tests, die
  `document.querySelector('.alert')` benutzen, bleiben gruen.
- Inline-Container `#qr-alert-container` rendert weiterhin Markup,
  aber jetzt als `.gat-callout--{info,…}` statt lokaler Tailwind-Banner.

Effekt: 39 Zeilen lokales Container-CSS (Position, Width, Mobile-Override)
und 25 Zeilen `.alert button[type="button"]`-Override sind aus `style.css`
verschwunden.

### `.gat-dropzone` (Commit 2)

Im Bildgenerator gibt es zwei File-Upload-Trigger:

| Stelle | Markup vorher | Markup nachher |
|---|---|---|
| **Step 2 „Bild hochladen"** | `<label class="btn-secondary btn-block">…</label>` ueber verstecktem `#meme-input` | `<label class="gat-dropzone" id="meme-dropzone">…</label>` mit Icon + Label + Hint |
| **Step 3 „Weitere Elemente" -> „Bild hinzufuegen"** | `<label class="app-element-button">` in 2x2-Grid mit Rosa Kreis / Wahlkreuz / QR-Code | **unangetastet** (siehe unten) |

Step 2 ist die kanonische „eigenes Bild hochladen"-Stelle und passt
ideal zum Dropzone-Pattern: dedizierter Section-Block, Hint-Slot
erlaeutert die Interaktion („Bild hierher ziehen oder klicken").

`choice-image.js` bekommt Drag-and-Drop-Handler am Label:
`dragenter`/`dragover` -> `.is-dragover` (DS rendert solid border +
dragover-Background), `drop` zieht die `dataTransfer.files[0]` durch
dieselbe `loadMemeFile`-Pipeline wie der File-Input. Validierung
(`ValidationUtils.isValidImageFile`) und Fehler-Toasts unveraendert.

## Ausgelassen — und warum

### `.gat-dropzone` in Step 3 — nein

Der Step-3-Upload ist Teil eines visuell zusammenhaengenden 2x2-Grids
(`.app-element-buttons-grid` mit 4 Buttons gleicher Optik: Bild,
Rosa Kreis, Wahlkreuz, QR Code). Ein Dropzone-Block wuerde dort die
Grid-Symmetrie sprengen und die anderen drei Aktionen visuell
herabsetzen. Der Label-als-Button-Trick bleibt dort die passende
Loesung — kein DS-Bruch, nur eine bewusste Pattern-Wahl.

### `.gat-toolbar` — nein

Bildgenerator hat keine persistente Action-Bar im Bild-Editor.
Navigation ist wizard-basiert (Zurueck/Weiter pro Step, plus
Download-Button am Wizard-Ende). Eine Sticky-Toolbar ueber dem
Fabric-Canvas wuerde die mobile Layout-Logik bei kleinen Viewports
kannibalisieren (Step 4 ist auf Mobile sowieso schon vertikal eng).
Wenn spaeter ein „Free-Form-Editing"-Modus dazukommt, in dem User
ohne Schrittfolge am Canvas arbeiten, ist `.gat-toolbar` der
richtige Hebel — heute aber unnoetig.

### `.gat-table` — nein

Es gibt keine tabellarischen Daten in der App. Vorlagen-Galerie ist
ein Masonry-Grid (Bilder), Logo-Auswahl ist ein Searchable-Select.
Beides sind keine Tabellen.

## Tests & Build

- Unit/Integration (Jest): **102/102 gruen** in allen vier Commits
  (`npm test`).
- Production-Build (`npm run build`): erfolgreich, deterministisch.
- Visual Regression (Playwright): Pixel-Drift erwartet im Step 2
  (Dropzone-Optik) und auf jedem Screenshot, der einen Toast
  einblendet (Bottom-Right-Positionierung statt Top-Center,
  Border-Left statt Border-Around). Snapshots werden bei Bedarf
  nach Merge auf Live-URL frisch erzeugt. E2E (`test:e2e`) deckt
  Toast-Spawn (showAlert) indirekt durch Error-Handling-Specs ab.

## Konsumenten-Vertraege

- Pages-URL `https://bildgenerator.gruene.at/` bleibt stabil.
- DS-CSS und DS-Logo weiter per CDN, keine neuen Vendor-Verzeichnisse.
- `window.AlertSystem`, `window.showAlert`, `window.showTailwindAlert`,
  `window.showQRAlert` — alle Signaturen unveraendert.
- `#meme-input`, `#add-image`, `#qr-alert-container`, `.app-alert-container`
  — alle Selektoren bleiben (alle Tests + jQuery-Hooks weiter funktional).
- Keine Werkzeug-Attribution (`grep -rEn "claude|Generated with|
  Co-Authored-By" .` -> 0).

## Naechste Schritte

- Nach DS v2.3-Release (Combobox + Stepper): Searchable-Select
  (`.app-searchable-select`) und Wizard-Step-Indicator
  (`.app-step-indicator`) auf DS heben — siehe e5han-Iteration,
  Punkt „Out-of-Scope".
- VRT-Referenzbilder nach Merge auf produktiver URL einmal aktualisieren
  (oder beim naechsten substantiellen Iterations-PR mitnehmen, wenn
  ohnehin Pixel-Drift entsteht).
