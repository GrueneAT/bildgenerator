# CONTEXT — Designentscheidungen

Issue: **ptupd** — Bildgenerator: eigenes Logo erklären, Vollkorn als
(beschreibend benannte) Schrift-Option, Beispiel-Seite zur Schriftverwendung.

Autonom festgehalten. Basis: z6qfk gemergt & deployed (Barlow Semi Condensed ist
Default-Schrift, Schrift-Infrastruktur via Google Fonts vorhanden).

## Entscheidung 1 — Eigenes Logo: Erklärtext in der Logo-Auswahl

Kurzer, gut sichtbarer Hinweis im Wizard-Schritt der Logo-Auswahl: Gruppen mit
eigenem Logo wählen **„kein Logo"** und fügen es über **„Bild hinzufügen"**
selbst ein. Reiner UI-/Texthinweis, keine neue Logik (der Weg funktioniert schon
heute). Platzierung an der richtigen Stelle der Logo-Auswahl, Tailwind, kein
Inline-Style.

## Entscheidung 2 — Vollkorn als Schrift-Option mit BESCHREIBENDER Beschriftung

**Wichtig (User 2026-06-07):** Die Auswahl wird **nicht mit Markennamen**
beschriftet. Nutzer:innen kennen „Vollkorn"/„Barlow" nicht → die Optionen
beschreiben **Art und Zweck** der Schrift.

- Aktuell gibt es **keinen Font-Picker** (in früherem Issue entfernt; Textschrift
  ist hardcodiert auf `AppConstants.FONTS.DEFAULT_TEXT`). Für die Vollkorn-Option
  muss daher eine **kleine Schrift-Auswahl-UI (re)eingeführt** werden — genauer
  Ort/Form klärt das Research (Wizard-Schritt Text / Erweiterte Optionen).
- Zwei Optionen, **beschreibend** benannt (finale Texte im Research/Plan, Vorschlag):
  - **„Standardschrift — Headlines & Fließtext"** → Barlow Semi Condensed (Default).
  - **„Betonte Serifenschrift — für Zitate & Akzente"** → Vollkorn.
- **Inkl. Erklärung:** kurzer Hinweis an der Auswahl, wann welche Schrift sinnvoll
  ist, mit Verweis auf die Beispiel-Seite (Entscheidung 3).
- Technische Einbindung wie Barlow: **Google Fonts CDN** (Vollkorn ist SIL OFL,
  kein Vendoring), Canvas/Fabric.js mit korrektem `fontFamily`/`fontWeight`/
  `fontStyle` und **FontFaceObserver** auf die richtigen Deskriptoren (analog der
  z6qfk-Lösung: Family + numerische Gewichte; Vollkorn-Italic für Akzente wie in
  den Vorlagen). Default bleibt Barlow.

## Entscheidung 3 — Beispiel-Seite „Welche Schrift wofür"

Eigene Hilfe-/Beispiel-Seite, die erklärt, **welche Schrift wofür** verwendet
wird (Standardschrift = Headlines/Fließtext; betonte Serifenschrift =
Akzent/Zitat, analog Vorlagen) — **mit Beispielbildern**. Im flomotlik/Grüne-
**Design-System-HTML-Stil** (gehostetes Stylesheet). Verlinkt von der
Schrift-Auswahl. Beispielbilder: generierte Bildgenerator-Outputs, die den
Schrift-Einsatz zeigen.

## Entscheidung 4 — Konsistenz & Tests

- Beschreibende Labels gelten für **beide** Schriften (auch Barlow), damit die
  Auswahl selbsterklärend ist.
- Visual-Regression/Unit-Tests für die neue Auswahl-UI + Vollkorn-Rendering
  ergänzen; Suite grün. Repo-Regeln beachten (kein Inline-Style, Tests treiben
  die UI wie ein:e Nutzer:in, pixelmatch).
- Kein Werkzeug-Attribut in Commits/Code.

## Offene Punkte fürs Research

- Ort/Form der Schrift-Auswahl-UI (Wizard-Text-Schritt vs. erweiterte Optionen)
  und wie `selectedFont` von hardcodiert auf auswählbar umgestellt wird
  (`event-handlers.js:141`, `constants.js` FONTS-Block).
- Vollkorn-Gewichte/Schnitte aus dem Design-System (z. B. 400/900 + Italic-Akzent).
- Wo/wie die Beispiel-Seite ausgeliefert wird (statische HTML-Seite im Repo,
  Verlinkung aus der App) und welche Beispielbilder erzeugt werden.
- Bestehende FontFaceObserver-/PRELOAD_FONTS-Logik (aus z6qfk) für Vollkorn erweitern.
