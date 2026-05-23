---
id: e5han
title: Migration auf design-system v2.0/v2.1 (Voll-Branding, Tailwind-Theme-Umpolung,
  Form/Modal/Callout nach DS-v2.1)
status: open
priority: medium
labels:
- migration
- design-system
- umbrella
remote:
- source: github
  id: '26'
  url: https://github.com/GrueneAT/bildgenerator/issues/26
---

Migration des Bildgenerators auf das Gruene-AT-Design-System (v2.0/v2.1). Heute komplett DS-unverbunden — eigene Tailwind-Component-Schicht mit `gruene-primary #257639`, `gruene-secondary #56AF31`, `gruene-dark #1a5428`. Magenta/Gelb werden inline als Hex genutzt. Wahlkreuz/Logo ist eigene Asset-Kopie.

Umbrella-Migrationsticket. Bezugnehmend auf Cross-Repo-Audit (2026-05-23). Siehe `notes/audit.md` fuer den vollstaendigen Befund + `https://github.com/GrueneAT/design-system/issues/13` fuer die DS-v2.1-Welle.

## Migrations-Phasen

### Phase 0 — Quick-Wins (unabhaengig, sofort umsetzbar)

1. **DS-CSS-Link einbinden** — `<link rel="stylesheet" href="https://grueneat.github.io/design-system/design-system.css">` in `index.html` und `impressum.html`.
2. **`tailwind.config.js` Theme-Umpolung** — `gruene-primary` etc. auf `var(--gat-color-primary)` zeigen. Magenta/Gelb als CSS-Vars statt Inline-Hex.
3. **DS-Logo per CDN** — eigene Logo-Asset-Kopie loeschen, `<img src="https://grueneat.github.io/design-system/assets/gruene-logo.svg">` einbinden.
4. **`.gat-skiplink`** ergaenzen (Skip-to-Main-Link am Body-Anfang).
5. **Bootstrap-Resterampe** (`.choice label`-Tot-Code in `resources/css/style.css`) entfernen.

### Phase 1 — Warten auf DS-v2.1 (extern)

Dieses Repo bekommt v2.1 automatisch durch CDN-Refresh, sobald `grueneat/design-system#13` gemerged ist. v2.1 liefert: `.gat-input`-Familie (Form-Primitives), `.gat-modal`, `.gat-callout`-/-`.gat-tag`-Modifier (info/warn/error/success).

### Phase 2 — Voll-Migration (nach DS-v2.1)

1. **Form-Komponenten** auf `.gat-input`/`.gat-select`/`.gat-textarea`/`.gat-checkbox`/`.gat-radio`/`.gat-range` umstellen. Lokale `.form-input` etc. entfernen. Wizard-Stepper (`A3` Audit) prueft, ob das DS einen Step-Indicator hat (sonst lokal lassen).
2. **Modal-Dialog** auf `.gat-modal` umstellen. Lokale Modal-CSS entfernen.
3. **Callout/Banner** auf `.gat-callout --info/--warn/--error/--success` umstellen.
4. **Toast-Container** — wenn `.gat-toast` in v2.2 landet, dort migrieren; sonst lokal als `.app-toast` umbenennen.
5. **Searchable-Select** (`resources/js/searchable-select.js`) — wenn `.gat-combobox` in v2.3 landet, dort migrieren; sonst `.app-combobox` umbenennen.
6. **App-spezifische UI** als `.app-*`-Namespace umbenennen: Fabric-Canvas-Wrapper, Element-Editor-Buttons, QR-Type-Selector, QR-Form-Section.
7. **Magenta/Gelb-Inlines** durch DS-Token (`var(--gat-color-magenta)`/`var(--gat-color-gelb)`) ersetzen.
8. **Doku-Abschluss**: `notes/iteration-abschluss.md` mit Migrations-Zusammenfassung (analog gemeindefinanzen-Iter-19).

## Akzeptanzkriterien

### Phase 0
- [ ] `<link>` auf `grueneat.github.io/design-system/design-system.css` in beiden HTML-Eintragspunkten
- [ ] `tailwind.config.js`-Theme nutzt `var(--gat-*)`-Tokens
- [ ] DS-Logo per CDN, eigene Logo-Asset-Kopie aus `resources/` geloescht
- [ ] `.gat-skiplink` als erstes Body-Element
- [ ] `.choice label`-Tot-Code entfernt

### Phase 2 (nach DS-v2.1)
- [ ] `grep -rE "\.form-(input|select|textarea|checkbox|radio|range)" .` liefert 0 in Quelldateien
- [ ] Lokale Modal-CSS-Regeln entfernt; alle Dialoge nutzen `.gat-modal`
- [ ] Magenta/Gelb-Inlines (`#e6007e`, `#f5e500` o. ae.) ersetzt durch `var(--gat-color-*)`
- [ ] App-spezifische Klassen sind `.app-*`-Namespace
- [ ] `notes/iteration-abschluss.md` dokumentiert Migration

### Querschnitt
- [ ] `grep -rE "claude|Generated with|Co-Authored-By" .` liefert 0
- [ ] Keine neuen Vendoring-Verzeichnisse
- [ ] Konsumenten-URL als Quelle
- [ ] Pages-Deploy nach Merge funktioniert

## Constraints

- **Kein Vendoring.** DS-CSS, DS-Logo, `gat-charts.js` per CDN.
- **Keine Werkzeug-Attribution.**
- **Phase 0 zuerst.** Phase 2 wartet auf DS-v2.1-Release.

## Hintergrund

Aus dem Cross-Repo-Audit: 8 DS-Aufnahme-Kandidaten, 4 Hybrid, 7 app-spezifisch. Form-Komponentenfamilie ist die hoechste DS-Prio (4-fach Bedarf in der Org). Siehe `notes/audit.md` fuer den vollstaendigen Befund + `notes/SYNTHESIS.md` fuer die Cross-Repo-Konvergenz.
