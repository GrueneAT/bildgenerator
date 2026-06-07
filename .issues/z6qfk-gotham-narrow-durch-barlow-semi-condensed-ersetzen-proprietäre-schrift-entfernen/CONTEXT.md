# CONTEXT — Designentscheidungen

Issue: **z6qfk** — Gotham Narrow durch Barlow Semi Condensed ersetzen
Erfasst in `/issue:discuss` vor Research/Plan.

## Entscheidung 1 — Schrifteinbindung: Google Fonts CDN (gezielt)

**Festgelegt:** Barlow Semi Condensed wird **direkt von Google Fonts** geladen,
per `@import`/`<link>`, ausschließlich für diese Schrift:

```
https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,900&display=swap
```

**Nicht** gewählt: das komplette `design-system.css` von
`grueneat.github.io` zu verlinken.

**Begründung:**
- Das Issue ist eng auf den Schriftaustausch begrenzt; die volle DS-Datei
  brächte Vollkorn, Farb- und Layout-Tokens mit → größerer Scope und Risiko von
  Konflikten mit dem bestehenden Tailwind-Theme (`gruene-primary` etc.).
- Kein Vendoring (Workspace-Regel): CDN statt lokaler `.otf`. Die vier
  Gotham-`.otf` in `resources/fonts/` werden entfernt.
- Family-Name für Canvas/Fabric.js/FontFaceObserver: **`"Barlow Semi Condensed"`**
  (exakt der Google-Fonts-Name). Webfonts tainten das Canvas nicht.

**Konsequenz für die Build-Pipeline:** Wenn `resources/css/fonts.css` (bisher
die Gotham-`@font-face`) leer wird oder entfällt, muss die CSS-Bundle-Reihenfolge
in `scripts/build-css.js` (`fonts.css` zwischen Vendor-CSS und Tailwind) geprüft
werden. Der Google-Fonts-`@import` muss in der gebündelten Produktions-CSS bzw.
im `<head>` landen, sodass die Schrift in Dev **und** Prod geladen wird.

## Entscheidung 2 — Gewicht-Mapping: im Research entscheiden

**Offen gelassen.** Das Research soll die Schnittstärken visuell vergleichen und
das beste Mapping vorschlagen. Ausgangshypothese (zu verifizieren):

| Gotham (alt) | Kandidat Barlow SC |
| :-- | :-- |
| Gotham Narrow Ultra (Default-Text) | 900 (Black) |
| Gotham Narrow Ultra Italic | 900 Italic |
| Gotham Narrow Bold (Default-Logo) | 700 oder 800 |
| Gotham Narrow Book | 400 |

Zu klären im Research: Wirkt Barlow SC 900 zu leicht gegenüber Gotham Ultra?
Braucht „Bold" 700 oder 800? Wie verhält sich die Schriftbreite (Condensed) zur
bestehenden Textbox-/Zeilenumbruch-Logik der Templates?

## Entscheidung 3 — Scope: Schrift + Visual-Regression-Baselines

**Festgelegt:** Im Scope sind sowohl der Schriftaustausch als auch die
**Neuaufnahme aller betroffenen Visual-Regression-Referenzbilder** (das
Textrendering ändert sich zwangsläufig). Farben, Logos, Layout-Tokens und
sonstige DS-Aspekte bleiben **außerhalb** dieses Issues.

**Begründung:** Ohne neue Baselines schlägt die gesamte Visual-Regression-Suite
fehl; die Baseline-Erneuerung ist untrennbarer Teil der Aufgabe, nicht ein
Folge-Issue. Die optische Abnahme (markenkonform) ist Akzeptanzkriterium.

## Offene Punkte für Research

- Exaktes Gewicht-Mapping (s. o.) inkl. Italic-Handhabung.
- Genaue Einbindungsstelle des Google-Fonts-`@import` (dev `index.html` vs.
  `fonts.css` vs. Build-Pipeline) — wo wird die Schrift heute geladen, damit Dev
  und Prod identisch sind?
- Inventar aller Gotham-Referenzen (Code, Tests, Repo-`CLAUDE.md`, UI-Texte).
- FontFaceObserver-Aufrufe: auf welche Family-Namen muss gewartet werden, damit
  Canvas-Rendering nicht vor Font-Load startet?
- Umfang der zu erneuernden Visual-Regression-Baselines (welche Specs rendern
  Text).
