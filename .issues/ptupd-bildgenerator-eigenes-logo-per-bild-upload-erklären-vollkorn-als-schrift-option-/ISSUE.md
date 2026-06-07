---
id: ptupd
title: 'Bildgenerator: Eigenes Logo per Bild-Upload erklären, Vollkorn als Schrift-Option,
  Beispiel-Seite zur Schriftverwendung'
status: done
ship_state: pr_open
priority: medium
labels:
- design-system
- enhancement
remote:
- source: github
  id: '34'
  url: https://github.com/GrueneAT/bildgenerator/issues/34
---

## Kontext

Folge-Issue nach der Schriftumstellung des Bildgenerators auf Barlow Semi
Condensed (Issue z6qfk). Drei zusammenhängende UX-/Doku-Verbesserungen rund um
Logo-Auswahl und Schriften.

**Abhängigkeit:** baut auf z6qfk auf (Barlow bereits als Default-Schrift
eingebunden, Schrift-Infrastruktur via Google Fonts vorhanden).

## Anforderungen

### 1. Eigenes Logo erklären (Logo-Auswahl)

Manche Gruppen haben ein **spezielles eigenes Logo**, das wir nicht im
Standard-Katalog führen/nutzen können. Diese können bereits heute ihr Logo
einbinden, indem sie in der Logo-Auswahl **„kein Logo"** wählen und anschließend
über **„Bild hinzufügen" (image add)** ihr eigenes Logo als Bild auf die Fläche
laden.

- In die **Logo-Auswahl** einen **kurzen Erklärtext** einfügen, der genau diesen
  Weg beschreibt („Eigenes Logo? Wähle ‚kein Logo' und füge es über ‚Bild
  hinzufügen' selbst ein.").
- Knapp, gut sichtbar, an der richtigen Stelle im Wizard-Schritt der Logo-Auswahl.

### 2. Vollkorn als Schrift-Option — mit beschreibender Auswahl (nicht Markenname)

- **Vollkorn** als zusätzliche **Schrift-Auswahl** anbieten — für **dieselben
  Use-Cases wie in den Vorlagen** (Akzent-/Emphasis-Schrift; im Org-Design-System
  `--gat-font-emphasis = "Vollkorn", serif`).
- **KORREKTUR/PRÄZISIERUNG (User 2026-06-07):** Die Auswahl wird **NICHT mit dem
  Markennamen „Vollkorn"** beschriftet, sondern mit einer **beschreibenden
  Bezeichnung, die Art und Zweck der Schrift erklärt** — Nutzer:innen kennen den
  Namen „Vollkorn" nicht. Z. B. „**Betonte Serifenschrift (für Zitate & Akzente)**"
  o. ä. Die technische Family bleibt intern `"Vollkorn"`, aber das UI-Label
  beschreibt die Schrift-Art/-Verwendung. Analog soll auch Barlow ein
  verständliches, beschreibendes Label bekommen (z. B. „Standardschrift
  (Headlines & Fließtext)"), damit die Auswahl selbsterklärend ist.
- **Inklusive Erklärung:** kurzer erklärender Hinweis an der Schrift-Auswahl,
  wann welche Schrift sinnvoll ist (verweist auf die Beispiel-Seite, #3).
- Einbindung wie bei Barlow über **Google Fonts CDN** (Vollkorn ist SIL OFL, kein
  Vendoring). Im Canvas/Fabric.js als wählbare Schrift mit korrektem
  FontFaceObserver-Handling.
- Default bleibt Barlow Semi Condensed; die beschreibend benannte Vollkorn-Option
  ist eine bewusst wählbare Alternative für Akzente/Zitate.

### 3. Beispiel-Seite „Welche Schrift wofür"

- Eine **Beispiel-/Hilfeseite** erstellen, die erklärt, **welche Schrift wofür**
  verwendet wird (Barlow Semi Condensed = Standard/Headlines/Fließtext; Vollkorn
  = Akzent/Emphasis, analog Vorlagen) — **mit Beispielbildern**.
- Konsistent mit dem flomotlik/Grüne-Design-System gestalten (HTML-Report-Stil).

## Akzeptanzkriterien

- [ ] Logo-Auswahl enthält gut sichtbaren Kurztext zum eigenen Logo via „kein Logo" + „Bild hinzufügen"
- [ ] Vollkorn als Schrift-Option auswählbar, per Google Fonts geladen (kein Vendoring), Canvas-Rendering + FontFaceObserver korrekt
- [ ] Schrift-Auswahl ist **beschreibend** beschriftet (Art/Zweck der Schrift), **nicht** mit dem Markennamen „Vollkorn" (bzw. „Barlow") — selbsterklärend für Nutzer:innen; kurzer Erklärhinweis vorhanden
- [ ] Vollkorn-Use-Cases entsprechen denen der Vorlagen (Akzent/Emphasis); Barlow bleibt Default
- [ ] Beispiel-Seite erklärt Schriftverwendung mit Beispielbildern, im Design-System-Stil
- [ ] Visual-Regression/Tests angepasst; Suite grün
- [ ] Kein Werkzeug-Attribut in Commits/Code

## Hinweise

- Erst nach Merge von z6qfk sinnvoll bearbeitbar.
- Vollkorn-Schnitte/Gewichte aus dem Design-System übernehmen (z. B. 400 / 900,
  inkl. Italic-Akzent wie in den Vorlagen).
