---
id: z6qfk
title: Gotham Narrow durch Barlow Semi Condensed ersetzen (proprietäre Schrift entfernen)
status: open
priority: high
labels:
- design-system
- migration
- enhancement
remote:
- source: github
  id: '32'
  url: https://github.com/GrueneAT/bildgenerator/issues/32
---

## Kontext

Der Bildgenerator nutzt aktuell die **proprietäre Schrift Gotham Narrow** (vier
vendorisierte `.otf`-Dateien in `resources/fonts/`). Das ist sowohl ein
Lizenz-/Rechtsthema als auch ein Verstoß gegen die Workspace-Regel „Kein
Vendoring von Drittabhängigkeiten" (`/workspace/CLAUDE.md`).

Das **Grüne-AT-Design-System** (`GrueneAT/design-system`) gibt als verbindliche
Hausschrift **Barlow Semi Condensed** vor (Token `--gat-font-headline` /
`--gat-font-copy` = `"Barlow Semi Condensed", sans-serif`), geladen per Google
Fonts CDN (`@import ... family=Barlow+Semi+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,900`).
Barlow Semi Condensed ist frei (SIL Open Font License).

Ziel: Gotham Narrow vollständig durch Barlow Semi Condensed ersetzen, sodass der
Bildgenerator **keine proprietäre Schrift** mehr enthält und mit dem
Design-System konsistent ist.

## Rahmenbedingungen

- **Kein Vendoring:** Barlow per CDN (Google Fonts, wie im Design-System) bzw.
  Package Manager referenzieren — **keine neuen `.otf`-Dateien** ins Repo legen.
  Die vier Gotham-`.otf`-Dateien werden entfernt.
- Der Generator rendert Text auf ein **Fabric.js-/Canvas-Element** und wartet
  per **FontFaceObserver** auf geladene Fonts. Die neue Schrift muss vor dem
  Canvas-Rendering geladen sein (Webfonts tainten Canvas **nicht**, daher
  unkritisch).
- Funktionsgleichheit: bestehende Templates, Default-Schrift, Schriftgewichte,
  Zeilenhöhen und Visual-Regression-Verhalten müssen erhalten/bewusst neu
  abgenommen werden.

## Gewicht-Mapping (Vorschlag, im Research zu verifizieren)

Barlow Semi Condensed bietet u. a. 400/600/700/800/900 (+ Italic). Mapping der
vier Gotham-Varianten:

| Gotham (alt) | Barlow Semi Condensed (neu) |
| :-- | :-- |
| Gotham Narrow Ultra | 900 (Black) |
| Gotham Narrow Ultra Italic | 900 Italic |
| Gotham Narrow Bold | 700 / 800 |
| Gotham Narrow Book | 400 |

Default-Textschrift ist heute „Gotham Narrow Ultra" → künftig Barlow Semi
Condensed 900.

## Betroffene Stellen (Bestandsaufnahme)

- `resources/fonts/` — 4 Gotham-`.otf`-Dateien (entfernen)
- `resources/css/fonts.css` — 4 `@font-face`-Regeln (durch CDN-Einbindung ersetzen)
- `resources/css/input.css` — `@font-face` Gotham Narrow / Gotham Narrow Bold
- `tailwind.config.js` — `fontFamily.gotham` / `gotham-bold`
- `resources/js/constants.js` — `FONTS.DEFAULT_LOGO`, `DEFAULT_TEXT`, `PRELOAD_FONTS`
- `resources/js/handlers.js` — `customFonts = ['Gotham Narrow']`
- `resources/js/wizard.js` — 4× `FontFaceObserver('Gotham Narrow …')`
- `resources/js/event-handlers.js` — `selectedFont = "Gotham Narrow Ultra"`
- `tests/integration/logo-processing-integration.test.js`, `visual-regression/tests/test-utils.js` — Gotham-Referenzen
- `CLAUDE.md` (Repo) — Erwähnungen „Gotham Narrow" / „Default text font: Gotham Narrow Ultra"
- Build-Pipeline (`scripts/build-css.js`): CSS-Bundle-Reihenfolge prüfen, falls `fonts.css` entfällt

## Akzeptanzkriterien

- [ ] Keine Gotham-`.otf`-Datei mehr im Repo; keine Gotham-Referenz mehr im Code (`grep -ri gotham` leer, abgesehen von ggf. Changelog)
- [ ] Barlow Semi Condensed wird per CDN geladen (kein Vendoring), Gewichte passend zum Mapping
- [ ] Canvas-Textrendering nutzt Barlow Semi Condensed; FontFaceObserver wartet auf die korrekten Family-Namen
- [ ] Default-Textschrift, Default-Logoschrift und Tailwind-`fontFamily` auf Barlow umgestellt
- [ ] Visual-Regression-Tests aktualisiert/neue Referenzbilder abgenommen; Test-Suite grün
- [ ] Repo-`CLAUDE.md` und ggf. UI-Texte spiegeln Barlow Semi Condensed wider
- [ ] Optische Abnahme: generierte Beispielbilder (Story/Post/Print) sehen markenkonform aus
