---
name: gruene-bildgenerator-template-updates
created: 2025-11-14T09:57:42Z
updated: 2025-11-14T12:58:40Z
status: planned
type: feature
plan_ref: .development/2.plan/2025-11-14T12-58-40Z-gruene-bildgenerator-template-updates.md
---

# Grüner Bildgenerator Template Updates

## Overview

This todo captures comprehensive updates to the GRÜNE image generator's template system, UI options, and default styling configurations. The changes focus on streamlining the user interface by removing unused options, adding new template variants, updating output dimensions for specific templates, and changing default text styling preferences.

The updates affect multiple areas:
- **Template System**: Remove "Post Quadratisch", add two 4:5 format variants (with/without border), adjust event and Facebook header templates
- **Logo System**: Logo size and location should remain unchanged (current implementation preserved)
- **Text Styling**: Change default font style from italic to normal, remove black text color option
- **UI/UX**: Optional mobile Facebook header format warning

These changes require modifications to template configurations in `resources/js/constants.js`, HTML form controls in `index.html`, and potentially text creation logic in `resources/js/event-handlers.js`.

## Problem/Opportunity

The current GRÜNE image generator has accumulated template options and styling configurations that are either unused, confusing, or don't match current branding and usage patterns. Specifically:

1. **Redundant Templates**: "Post Quadratisch" (1080x1080) overlaps with the 4:5 format needs
2. **Missing Variants**: The 4:5 format needs both bordered and borderless variants for flexibility
3. **Incorrect Output Dimensions**: Event and Facebook header templates don't match current platform requirements
4. **Outdated Text Defaults**: The italic text style (Gotham Narrow Ultra Italic) is no longer preferred; normal text should be the default
5. **Black Text Color Option**: Black text color adds complexity without clear benefit for GRÜNE branding

Addressing these issues will:
- Improve user experience by simplifying choices
- Ensure consistent branding across all generated images
- Match current social media platform requirements
- Align with current GRÜNE design preferences

**Note**: Logo size and location remain unchanged to preserve existing functionality and visual consistency.

## Requirements

### REQ-001 (P1): Remove "Post Quadratisch" Template Option

**Description**: Completely remove the "Post Quadratisch" (1080x1080 square format) template option from the template selection dropdown.

**Why P1**: This is a foundational change that affects the template system structure. Must be completed first to avoid confusion with the new 4:5 variants.

**Acceptance Criteria**:
- The `<option value="post">Post quadratisch</option>` is removed from `index.html:600`
- The `post` template configuration is removed from `TemplateConstants.TEMPLATES` in `resources/js/constants.js:115-123`
- Users can no longer select "Post Quadratisch" from the template dropdown
- Existing functionality for other templates remains unaffected

**Independent Test**:
1. Open the application in a browser
2. Navigate to the template selection dropdown (Step 1 of wizard)
3. Verify "Post quadratisch" option is NOT present in the "Social Media" optgroup
4. Verify all other template options (Story, 4:5, Event, Facebook Header, Print formats) are still available
5. Select each remaining template and verify canvas renders correctly

**Technical Context**:
- Template dropdown: `index.html:597-614`
- Template configuration: `resources/js/constants.js:105-235`
- Current `post` template config at `constants.js:115-123`

---

### REQ-002 (P1): Implement 4:5 Format with Green Border

**Description**: Create a new template variant for 4:5 format (1080x1350) that includes the green border (similar to current implementation).

**Why P1**: This is one of two critical 4:5 variants needed to replace the removed "Post Quadratisch" option. The bordered variant maintains the current GRÜNE branded style.

**Acceptance Criteria**:
- A new template configuration `post_45_border` is added to `TemplateConstants.TEMPLATES` with:
  - `width: 1080`
  - `height: 1350`
  - `border: 20` (maintains green border)
  - `topBorderMultiplier: 1`
  - `logoTop` and `logoTextTop` positioned appropriately for 4:5 format
  - `dpi: 200`
- Dropdown option added: `<option value="post_45_border">Post 4:5 mit Rahmen</option>`
- Green border renders correctly around the content area
- Logo and logo text position correctly in the bordered 4:5 format

**Independent Test**:
1. Select "Post 4:5 mit Rahmen" from template dropdown
2. Upload a background image
3. Verify:
   - Canvas dimensions are 1080x1350 pixels
   - Green border (20px) is visible around content area
   - Logo appears at correct vertical position
   - Logo text aligns properly below logo
   - Content area (inside border) is correctly sized
4. Export image and verify dimensions and border rendering

**Technical Context**:
- Similar to existing `post_45` template at `constants.js:124-132`
- Border rendering logic in canvas initialization
- Current `post_45` may need renaming or repurposing

---

### REQ-003 (P1): Implement 4:5 Format without Border

**Description**: Create a new template variant for 4:5 format (1080x1350) that has NO green border (borderless variant).

**Why P1**: This is the second critical 4:5 variant, providing flexibility for users who want full-bleed 4:5 images without the branded border.

**Acceptance Criteria**:
- A new template configuration `post_45_no_border` is added to `TemplateConstants.TEMPLATES` with:
  - `width: 1080`
  - `height: 1350`
  - `border: 0` (no border)
  - `topBorderMultiplier: 1`
  - `logoTop` and `logoTextTop` positioned for full-bleed 4:5 format
  - `dpi: 200`
- Dropdown option added: `<option value="post_45_no_border">Post 4:5 ohne Rahmen</option>`
- No green border renders (full-bleed content)
- Logo and logo text position correctly in the borderless 4:5 format

**Independent Test**:
1. Select "Post 4:5 ohne Rahmen" from template dropdown
2. Upload a background image
3. Verify:
   - Canvas dimensions are 1080x1350 pixels
   - NO border is visible (full-bleed content)
   - Logo appears at correct vertical position
   - Logo text aligns properly below logo
   - Content extends to full canvas edges
4. Export image and verify dimensions and borderless rendering

**Technical Context**:
- New template configuration alongside REQ-002
- Border logic should handle `border: 0` gracefully
- Logo positioning may differ from bordered variant due to lack of border offset

---

### REQ-004 (P2): Remove Green Border from "Veranstaltung" Template

**Description**: Update the "Veranstaltung" (event) template to render without the green border.

**Why P2**: Important for matching current design preferences for event graphics, but less critical than the 4:5 format changes.

**Acceptance Criteria**:
- The `event` template configuration in `TemplateConstants.TEMPLATES` is updated to set `border: 0`
- When "Veranstaltung" template is selected, no green border renders
- Content extends to full canvas edges (full-bleed)
- Logo and logo text positioning remain correct in borderless layout

**Independent Test**:
1. Select "Veranstaltung" template from dropdown
2. Upload a background image
3. Verify NO green border is visible around the content
4. Verify content extends to canvas edges
5. Verify logo and logo text position correctly
6. Export image and confirm borderless rendering

**Technical Context**:
- Current `event` template: `constants.js:133-141`
- Current border value: `border: 20` → Change to `border: 0`

---

### REQ-005 (P2): Update "Veranstaltung" Output Dimensions to 1920x1005

**Description**: Change the output dimensions of the "Veranstaltung" (event) template from current 1200x628 to 1920x1005 pixels.

**Why P2**: Ensures event graphics meet current platform requirements and display standards, important for quality output.

**Acceptance Criteria**:
- The `event` template configuration is updated with `width: 1920` and `height: 1005`
- Canvas renders at 1920x1005 when "Veranstaltung" is selected
- Logo and logo text positioning values (`logoTop`, `logoTextTop`) are adjusted to maintain proper vertical alignment at new dimensions
- Exported images are exactly 1920x1005 pixels

**Independent Test**:
1. Select "Veranstaltung" template
2. Verify canvas displays at 1920x1005 dimensions (check canvas element properties)
3. Add background image and verify it scales to 1920x1005
4. Add logo and verify positioning looks correct at new dimensions
5. Export image and verify file dimensions are 1920x1005 pixels
6. Verify exported image quality is appropriate

**Technical Context**:
- Current `event` template: `constants.js:133-141`
- Current dimensions: `width: 1200, height: 628`
- New dimensions: `width: 1920, height: 1005`
- May need to adjust `logoTop: 0.678, logoTextTop: 0.9` proportionally

---

### REQ-006 (P2): Remove Green Border from "Facebook Header" Template

**Description**: Update the "Facebook Header" template to render without the green border.

**Why P2**: Aligns with borderless preference for social media headers, important for platform compatibility.

**Acceptance Criteria**:
- The `facebook_header` template configuration is updated to set `border: 0`
- When "Facebook Header" is selected, no green border renders
- Content extends to full canvas edges
- Logo and logo text positioning remain correct in borderless layout

**Independent Test**:
1. Select "Facebook Header" template from dropdown
2. Upload a background image
3. Verify NO green border is visible
4. Verify content extends to full canvas edges
5. Verify logo and logo text position correctly
6. Export image and confirm borderless rendering

**Technical Context**:
- Current `facebook_header` template: `constants.js:142-150`
- Current border value: `border: 20` → Change to `border: 0`

---

### REQ-007 (P2): Update "Facebook Header" Output Dimensions to 820x360

**Description**: Change the output dimensions of the "Facebook Header" template from current 1958x745 to 820x360 pixels.

**Why P2**: Matches Facebook's current header image requirements, important for platform compatibility.

**Acceptance Criteria**:
- The `facebook_header` template configuration is updated with `width: 820` and `height: 360`
- Canvas renders at 820x360 when "Facebook Header" is selected
- Logo and logo text positioning values are adjusted for new aspect ratio
- Exported images are exactly 820x360 pixels
- Image quality remains appropriate despite smaller dimensions

**Independent Test**:
1. Select "Facebook Header" template
2. Verify canvas displays at 820x360 dimensions
3. Add background image and verify scaling to 820x360
4. Add logo and verify positioning looks correct
5. Export image and verify dimensions are 820x360 pixels
6. Upload exported image to Facebook as page header and verify proper display

**Technical Context**:
- Current `facebook_header` template: `constants.js:142-150`
- Current dimensions: `width: 1958, height: 745`
- New dimensions: `width: 820, height: 360`
- Aspect ratio change: 2.63:1 → 2.28:1 (slightly less wide)
- May need significant adjustment to `logoTop: 0.6, logoTextTop: 0.872`

---

### REQ-008 (P3): Add Mobile Facebook Header Format Warning

**Description**: Optionally add a user-facing hint/warning that explains Facebook uses a different header format on mobile devices, recommending users center their text for cross-device compatibility.

**Why P3**: Nice-to-have educational feature that improves user awareness but doesn't affect core functionality.

**Acceptance Criteria**:
- When "Facebook Header" template is selected, a visible informational message appears
- Message text (German): "Hinweis: Facebook verwendet auf Mobilgeräten ein anderes Header-Format. Bitte Text möglichst mittig platzieren für optimale Darstellung."
- Message styling uses info/warning style (e.g., light blue background, info icon)
- Message appears near the template selection or in the wizard interface
- Message is dismissible or non-intrusive
- Message only appears when Facebook Header template is active

**Independent Test**:
1. Select "Facebook Header" template
2. Verify informational message appears
3. Verify message text is clear and correctly formatted in German
4. Verify message styling is appropriate (info style, not error)
5. Select different template and verify message disappears
6. Re-select "Facebook Header" and verify message reappears

**Technical Context**:
- Could be implemented as conditional alert in wizard.js
- Could use alert-system.js (`showAlert()`) with custom styling
- Could be static HTML element shown/hidden based on template selection
- Template selection change handler: `event-handlers.js` or `wizard.js`

---

### REQ-009 (P1): Change Default Font Style to Normal (Non-Italic)

**Description**: Change the default text font style from italic ("Gotham Narrow Ultra Italic") to normal/non-italic. The default font should no longer use italic styling.

**Why P1**: This is a critical branding change that affects all newly created text elements. The italic style is outdated and normal text is now preferred.

**Acceptance Criteria**:
- The default font in `AppConstants.FONTS.DEFAULT_TEXT` is changed from "Gotham Narrow Ultra Italic" to "Gotham Narrow Book" (or another non-italic variant)
- The `fontStyle` property in text creation (`event-handlers.js:155`) remains `"normal"` (already correct)
- The default font selected in `#font-style-select` dropdown changes to a non-italic option
- All newly created text elements use non-italic font by default
- Font preloading still includes all necessary fonts (both italic and non-italic for backwards compatibility)
- Existing text elements with italic fonts are not affected (backwards compatibility)

**Independent Test**:
1. Open the application
2. Navigate to Step 3 (Text section)
3. Verify the default font selection in font dropdown is a non-italic font (e.g., "Gotham Narrow Book")
4. Enter text and click "Text hinzufügen"
5. Verify the added text appears in normal (non-italic) style by default
6. Verify text is clear and readable
7. Optionally change font to italic variant and verify italic still works when explicitly selected

**Technical Context**:
- Default text font constant: `constants.js:77` (currently "Gotham Narrow Ultra Italic")
- Font preloading: `wizard.js:22-26` (includes Ultra Italic, Book, Bold)
- Text creation: `event-handlers.js:150-169`
- Font selection dropdown: Need to find in `index.html` (likely near text controls)
- Available fonts: Gotham Narrow Book (non-italic), Gotham Narrow Bold, Gotham Narrow Ultra Italic

---

### REQ-010 (P2): Remove Black Text Color Option

**Description**: Remove the "Schwarz" (black) text color option from the text color selector, leaving only "Gelb" (yellow) and "Weiß" (white).

**Why P2**: Simplifies color choices and aligns with GRÜNE branding which typically uses yellow or white text on green backgrounds.

**Acceptance Criteria**:
- The `<option value="rgb(0,0,0)">Schwarz</option>` is removed from text color select at `index.html:796`
- Only "Gelb" and "Weiß" options remain in the text color dropdown
- Users cannot select black text color
- Existing text elements with black color are not affected (backwards compatibility)
- Default text color remains yellow (first option)

**Independent Test**:
1. Navigate to Step 3 (Text section)
2. Locate the "Textfarbe" (text color) dropdown
3. Verify only "Gelb" and "Weiß" options are available
4. Verify "Schwarz" is not in the dropdown
5. Add text and verify default color is yellow
6. Change to white and verify text color changes correctly
7. Verify text visibility on green background with both colors

**Technical Context**:
- Text color select: `index.html:789-797`
- Current options: Gelb (rgb(255,240,0)), Weiß (rgb(255,255,255)), Schwarz (rgb(0,0,0))
- Text creation uses selected value: `event-handlers.js:157` (`fill: jQuery("#text-color").find(":selected").attr("value")`)

---

## Technical Context

### Affected Files

**Primary Files** (require direct modification):
1. **`resources/js/constants.js`**:
   - `TemplateConstants.TEMPLATES` (lines 104-235)
   - Remove `post` template config
   - Add `post_45_border` and `post_45_no_border` configs
   - Update `event` template: border=0, width=1920, height=1005, adjust logo positions
   - Update `facebook_header` template: border=0, width=820, height=360, adjust logo positions
   - Update `AppConstants.FONTS.DEFAULT_TEXT` to non-italic font

2. **`index.html`**:
   - Template dropdown (lines 597-614): Remove "Post quadratisch", add two 4:5 options
   - Text color select (lines 789-797): Remove "Schwarz" option
   - Font style select (location TBD): Update default to non-italic font

3. **`resources/js/event-handlers.js`**:
   - Text creation handler `setupTextHandler()` (lines 140-184)
   - Verify font defaults and styling

**Secondary Files** (may require updates):
- **`resources/js/wizard.js`**: Template change handlers, optional mobile warning for Facebook Header
- **Visual regression tests**: All template-related tests will need reference image updates
- **Documentation**: README.md, CLAUDE.md may need updates to reflect new templates

### Template Configuration Structure

Each template in `TemplateConstants.TEMPLATES` has this structure:
```javascript
template_name: {
    width: number,           // Canvas width in pixels
    height: number,          // Canvas height in pixels
    topBorderMultiplier: number, // Border thickness multiplier
    border: number,          // Border width in pixels (0 = no border)
    logoTop: number,         // Logo vertical position (0-1, percentage)
    logoTextTop: number,     // Logo text vertical position (0-1, percentage)
    dpi: number,             // Export DPI quality
}
```

### Logo System

Current logo sizing is dynamic based on canvas dimensions using `LOGO.SCALE_RATIO: 10`. This implementation will remain unchanged to preserve existing functionality and visual consistency.

Logo files available:
- `Gruene_Logo_245_268.png` (long version)
- `Gruene_Logo_245_248.png` (short version)
- `Gruene_Logo_120_131.png` (small long version)
- `Gruene_Logo_120_121.png` (small short version)

## Constraints

### Technical Constraints
- Must maintain backwards compatibility with existing exported images
- Canvas rendering must remain performant with new templates
- Logo size and positioning must remain unchanged from current implementation
- Template configurations must work with existing canvas initialization logic

### Business Constraints
- Changes must be deployed in a single update (not phased)
- Visual regression tests must pass or be updated with new reference images
- No breaking changes to existing public links or saved configurations

### Design Constraints
- Logo sizing and positioning must remain unchanged from current implementation
- Borderless templates must still be clearly identifiable as GRÜNE branded
- Line-height options (Klein, Mittel, Groß) must remain available and unchanged
- Yellow and white text must remain readable on green backgrounds

## Success Criteria

### Functional Success
- [ ] All 10 requirements (REQ-001 through REQ-010) are implemented and tested
- [ ] "Post Quadratisch" is completely removed
- [ ] Two new 4:5 variants (with/without border) are available and functional
- [ ] Logo size and positioning remain unchanged from current implementation
- [ ] Event template renders at 1920x1005 without border
- [ ] Facebook Header renders at 820x360 without border
- [ ] Default text style is non-italic
- [ ] Line-height options remain unchanged (Klein, Mittel, Groß all available)
- [ ] Black text color option removed

### Quality Success
- [ ] Visual regression tests pass or are updated with new reference images
- [ ] No console errors or warnings
- [ ] Canvas rendering remains smooth and performant
- [ ] Exported images match expected dimensions exactly
- [ ] Logo rendering remains consistent with current implementation
- [ ] Text rendering is clear with new defaults

### User Experience Success
- [ ] Template selection is less cluttered and easier to understand
- [ ] 4:5 format options provide clear choice between bordered/borderless
- [ ] Logo appears consistent across all generated images
- [ ] Text defaults (non-italic, tight line-height, yellow/white only) align with user expectations
- [ ] Optional Facebook mobile warning provides helpful guidance

## Scope

### In Scope
✅ Remove "Post Quadratisch" template completely
✅ Add two 4:5 template variants (with/without border)
✅ Update event template dimensions and remove border
✅ Update Facebook header dimensions and remove border
✅ Optional mobile warning for Facebook header
✅ Change default font to non-italic
✅ Remove black text color option
✅ Update visual regression test reference images

### Out of Scope
❌ Adding new template formats beyond 4:5 variants
❌ Changing logo image files themselves
❌ Modifying logo sizing or positioning logic (preserved as-is)
❌ Modifying line-height options (Klein, Mittel, Groß remain unchanged)
❌ Modifying print format templates (A2-A5) beyond border/dimension updates
❌ Changing color palette or adding new colors
❌ Modifying QR code generator functionality
❌ Updating export/download functionality
❌ Mobile responsive UI changes
❌ Internationalization (keeping German UI text)

### Prerequisites
- Development environment set up (`npm install` completed)
- Access to visual regression testing (`npm run test:visual`)
- Understanding of Fabric.js canvas manipulation
- Familiarity with template system architecture

### Future Considerations
- Consider adding more borderless variants for other templates
- Consider adding font weight/style as user-selectable option
- Consider responsive template sizing for mobile editing
- Consider template presets/favorites system

## References

### Code References
- Template configuration: `resources/js/constants.js:104-235`
- Template dropdown: `index.html:597-614`
- Logo loading: `resources/js/main.js:141-194`
- Text creation: `resources/js/event-handlers.js:140-184`
- Text styling controls: `index.html:785-814`

### Documentation
- Project README: `README.md`
- Claude instructions: `CLAUDE.md`
- Testing guidelines: `CLAUDE.md` (Testing Guidelines section)

### Related Issues
- None currently documented

### Design Assets
- Logo files: `resources/images/Gruene_Logo_*.png`
- Fonts: Gotham Narrow family (Ultra Italic, Book, Bold)

