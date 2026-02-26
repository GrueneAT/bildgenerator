# GRÜNE Bildgenerator — Tiroler Logos Erweiterung

## What This Is

Browser-basierter Bildgenerator für GRÜNE (Austrian Green Party) Materialien. Ermöglicht Social-Media-Grafiken und politische Inhalte mit GRÜNE-Branding zu erstellen. Rein clientseitig, gehostet auf GitHub Pages.

## Core Value

Jede GRÜNE Organisation in Österreich kann schnell gebrandete Bilder erstellen, indem sie ihr Logo aus einer durchsuchbaren Liste auswählt.

## Requirements

### Validated

- ✓ Canvas-basierte Bildgenerierung mit Fabric.js — existing
- ✓ Template-System (Story, Post, Event, Facebook Header, Print A2-A5) — existing
- ✓ Durchsuchbare Logo-Auswahl mit Kategorien (Bundesländer, Bezirke, Gemeinden, Andere) — existing
- ✓ Logo-Darstellung via GRÜNE-Logo-PNG + Organisationsname als Text — existing
- ✓ QR-Code-Generierung und Integration — existing
- ✓ 4-Schritt-Wizard-UI — existing
- ✓ Export/Download als Bild — existing
- ✓ Build-Pipeline (esbuild, Tailwind, Vendor-Bundling) — existing
- ✓ Visual Regression Tests (Playwright) — existing
- ✓ CI/CD (GitHub Actions → GitHub Pages) — existing

### Active

- [ ] 8 Tiroler Bezirke in `index.json` hinzufügen (Imst, Innsbruck-Land, Kitzbühel, Kufstein, Landeck, Lienz, Reutte, Schwaz)
- [ ] 43 Tiroler Gemeinden in `index.json` hinzufügen
- [ ] 7 Teil-/Netzwerkorganisationen in `index.json` unter "Andere" hinzufügen (Grüne Frauen, Grüne Jugend, GRAS, Grüne Generation Plus, Grüne Wirtschaft, Grüne Bäuerinnen und Bauern, Grüne in der AK)
- [ ] Alle Einträge innerhalb jeder Kategorie alphabetisch sortieren

### Out of Scope

- Sub-Kategorien pro Bundesland (z.B. "Gemeinden Tirol") — unnötige Komplexität, Suche funktioniert auch flach
- Bundesland-Metadata-Datei — LLMs können zukünftige Einträge ohne Mapping zuordnen
- Eigene Logo-Bilddateien pro Organisation — bestehendes System mit Text-Overlay funktioniert
- Code-Änderungen an der UI — nur Datenänderung in `index.json`

## Context

- Anfrage aus Tirol, weitere Bezirke, Gemeinden und Organisationen verfügbar zu machen
- Aktuell nur "Tirol" (Bundesländer), "Innsbruck" (Gemeinden) und 3 Andere-Einträge für Tirol vorhanden
- Die `index.json` enthält ~467 Einträge in 6 Kategorien, wird von `generateLogoSelection()` in Optgroups umgewandelt
- SearchableSelect-Komponente bietet Echtzeit-Textsuche über alle Einträge
- `%`-Zeichen wird als Zeilenumbruch im Logo-Text verwendet (relevant für lange Namen)
- Bestehende Einträge sind nicht sortiert — alphabetische Sortierung verbessert Übersichtlichkeit

## Constraints

- **Datenformat**: Muss bestehendes `index.json`-Format beibehalten (Kategorie → Array von Strings)
- **Namensformat**: UPPERCASE für Bezirke/Gemeinden, `%` für Zeilenumbrüche bei langen Namen
- **Keine Code-Änderungen**: Nur Datenänderung, kein JS/CSS-Umbau
- **Build-Kompatibilität**: `embed_logos.py` muss weiterhin funktionieren (embedded logo data)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Flache Struktur beibehalten | Suche funktioniert ohne Bundesland-Zuordnung, LLMs können zukünftig ohne Metadata einfügen | — Pending |
| Alphabetische Sortierung | Macht Einträge übersichtlicher, hilft bei Duplikat-Erkennung | — Pending |
| Organisationen in "Andere" | Konsistent mit bestehenden Einträgen (Frauen, Generation plus, Andersrum) | — Pending |

---
*Last updated: 2026-02-26 after initialization*
