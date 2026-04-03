---
title: "Corporate Identity Update — New GRÜNE Branding"
slug: corporate-identity-update
priority: critical
status: researched
labels: [ci-update, branding]
created: 2026-04-03
source: BildgeneratorUpdates.txt
---

# Corporate Identity Update — New GRÜNE Branding

Implement the new GRÜNE corporate identity across the Bildgenerator. All changes stem from the updated brand guidelines and must be applied consistently across all templates and features.

## Changes Required

### 1. Template Restructuring (Schritt 1: Vorlage wählen)

**Social Media:**
- Feed-Post 4:5
- Story-Format
- Facebook Header
- Veranstaltungs-Header

**Print (Druck):**
- A4 Hochformat / Querformat
- A5 Hochformat / Querformat
- A6 Hochformat / Querformat *(new)*

**Removed:** A2, A3 templates

### 2. Logo Update

- Replace existing logo with new logo files
- Pink bar → white bar
- New logo files: einzeilig (single-line) and zweizeilig (two-line), blanko variants
- Logo files provided: `Logo-einzeilig_blanko.png`, `Logo-zweizeilig_blanko.png`

### 3. Border Removal

- Remove borders from **all** formats (currently some have 10-20px green borders)
- All templates become full-bleed (border: 0)

### 4. Logo Sizing

**Social Media formats:**
- Unified logo size: **163 pixels**

**Print formats:**
- Default logo size: **193 pixels**
- Format-specific sizes:
  - DIN A2: 76 mm
  - DIN A3: 54 mm
  - DIN A4: 38 mm
  - DIN A5: 27 mm
  - DIN A6: 19 mm

### 5. Background Color

- Default background for all templates: **Dark Green #257639**

### 6. Font Changes (Schritt 3: Inhalte hinzufügen)

- Only font available: **Gotham Narrow Ultra**
- Remove the font selection dropdown
- Allow both uppercase and lowercase (currently may be restricted)

### 7. Text Colors

Update available text colors to:
- Weiß / White (`#FFFFFF`)
- Schwarz / Black (`#000000`) *(new)*
- Gelb / Yellow (`#FFED00`)

### 8. QR Code Color Picker (Schritt 3)

Add color selection for QR codes in the main wizard:
- Schwarz / Black (`#000000`)
- Dunkelgrün / Dark Green (`#257639`)

### 9. Symbol Rename

- Rename "Häkchen" (checkmark) → "Wahlkreuz" (ballot cross)
- Replace symbol with new cross design

### 10. QR Code Generator Colors

Update QR Code Generator standalone colors:
- Dunkelgrün / Dark Green: `#257639`
- Hellgrün / Light Green: `#56AF31`

## Acceptance Criteria

- [ ] Template list shows only: Feed-Post 4:5, Story-Format, Facebook Header, Veranstaltungs-Header, A4 H/Q, A5 H/Q, A6 H/Q
- [ ] A2 and A3 templates are removed
- [ ] A6 Hochformat and A6 Querformat templates are added and functional
- [ ] New logo (white bar) replaces old logo (pink bar) across all templates
- [ ] Both einzeilig and zweizeilig blanko logo variants available
- [ ] All templates have no border (full-bleed)
- [ ] Social media logos render at 163px
- [ ] Print logos render at 193px default, with format-specific mm sizes for A2-A6
- [ ] Default background color is #257639 for all templates
- [ ] Font dropdown is removed; only Gotham Narrow Ultra is used
- [ ] Text colors available: White (#FFFFFF), Black (#000000), Yellow (#FFED00)
- [ ] QR code color picker in wizard offers Black and Dark Green (#257639)
- [ ] "Häkchen" renamed to "Wahlkreuz" with new cross symbol
- [ ] QR Generator uses updated green values (#257639, #56AF31)
- [ ] All existing visual regression tests updated for new CI
- [ ] No regressions in wizard flow or canvas operations
