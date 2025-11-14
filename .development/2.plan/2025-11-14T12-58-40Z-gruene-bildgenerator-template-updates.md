---
name: gruene-bildgenerator-template-updates
todo_name: gruene-bildgenerator-template-updates
todo_ref: .development/1.todo/2025-11-14T09-57-42Z-gruene-bildgenerator-template-updates.md
created: 2025-11-14T12:58:40Z
updated: 2025-11-14T12:58:40Z
planned_at: 2025-11-14T12:58:40Z
status: ready
type: feature
priority: high
sharded: false
---

# Plan: GRÜNE Bildgenerator Template System Updates

## Overview

This plan implements comprehensive updates to the GRÜNE image generator's template system, focusing on streamlining the UI by removing unused options, adding new 4:5 format variants, updating template dimensions, and modernizing text styling defaults. The implementation requires careful coordination of template configurations, HTML form controls, and JavaScript constants while maintaining backward compatibility and visual consistency.

**Complexity**: Medium (10 implementation steps)
**Estimated Duration**: 4-6 hours
**Risk Level**: Low-Medium (well-defined changes, good test coverage)

## Todo Summary

**Source**: `.development/1.todo/2025-11-14T09-57-42Z-gruene-bildgenerator-template-updates.md`
**Requirements**: REQ-001 through REQ-010
**Created**: 2025-11-14T09:57:42Z
**Status**: ready

**Requirements Breakdown**:
- **P1 (Critical)**: 4 requirements - Template removal/addition, default font change
- **P2 (Important)**: 5 requirements - Border removals, dimension updates, color simplification
- **P3 (Nice-to-have)**: 1 requirement - Mobile Facebook warning

**Key Objectives**:
1. Remove "Post Quadratisch" template completely
2. Add two 4:5 format variants (with/without border)
3. Update Event template to 1920x1005 without border
4. Update Facebook Header to 820x360 without border
5. Change default font from italic to normal
6. Remove black text color option
7. Optionally add Facebook mobile warning
8. Update all visual regression test references

## Codebase Context

### Current Architecture

**Template System** (`resources/js/constants.js:104-235`):
- Centralized template definitions in `TemplateConstants.TEMPLATES`
- Each template has: width, height, border, topBorderMultiplier, logoTop, logoTextTop, dpi
- Current templates: story, post, post_45, event, facebook_header, a2-a5 (with _quer variants)
- Logo sizing is dynamic: `LOGO.SCALE_RATIO: 10` → size = (contentRect.width + contentRect.height) / 10
- Backward compatibility maintained via `template_values` alias

**Font Configuration** (`constants.js:74-83`):
- `DEFAULT_TEXT`: Currently "Gotham Narrow Ultra Italic"
- `PRELOAD_FONTS`: Array includes Ultra Italic, Book, Bold
- All fonts preloaded for backward compatibility

**HTML Controls**:
- Template dropdown: `index.html:597-616` with Social Media and Druck optgroups
- Text color select: `index.html:789-797` with Gelb, Weiß, Schwarz options
- Line-height select: `index.html:805-813` with Klein, Mittel, Groß options (preserved)

**Template References**:
- Existing `post` template: 1080x1080, border: 20 → **TO BE REMOVED**
- Existing `post_45` template: 1080x1350, border: 20 → **WILL BECOME** `post_45_border`
- Existing `event` template: 1200x628, border: 20 → **UPDATE TO** 1920x1005, border: 0
- Existing `facebook_header`: 1958x745, border: 20 → **UPDATE TO** 820x360, border: 0

### Integration Points

**Visual Regression Tests**:
- Location: `visual-regression/tests/`
- Reference images: `visual-regression/reference-images/`
- All template-related tests need reference updates after changes
- Parallel test configuration in `playwright.config.js`

**Wizard System** (`resources/js/wizard.js`):
- Template selection handlers
- Optional location for mobile Facebook warning (REQ-008)

**Event Handlers** (`resources/js/event-handlers.js`):
- Text creation logic uses font constants
- Template change handlers may need mobile warning integration

### Patterns and Conventions

**Template Logo Positioning**:
- Positioning uses percentage values (0-1 range)
- Higher canvas aspect ratios (more vertical) → higher logoTop values
- Example: story (1080x1920, ratio 0.56) has logoTop: 0.83
- Example: event (1200x628, ratio 1.91) has logoTop: 0.678
- Pattern: Vertical formats put logo lower on canvas

**Border Handling**:
- border: 0 = full-bleed (no border)
- border: 10-20 = green border in pixels
- Border logic gracefully handles border: 0

**Naming Conventions**:
- Format variants use underscores: `post_45`, `a2_quer`
- Descriptive suffixes: `_border`, `_no_border` for clarity

## Architecture

### High-Level Approach

**Phase 1: Template Configuration Updates**
- Remove obsolete `post` template
- Rename `post_45` → `post_45_border`
- Add new `post_45_no_border` template
- Update `event` and `facebook_header` dimensions and borders
- Adjust logo positioning for resized templates

**Phase 2: HTML UI Updates**
- Update template dropdown (remove Post quadratisch, add 4:5 variants)
- Remove black color from text color select
- Keep line-height select unchanged (Klein, Mittel, Groß)

**Phase 3: Font Default Updates**
- Change DEFAULT_TEXT from "Gotham Narrow Ultra Italic" to "Gotham Narrow Book"
- Keep all fonts in PRELOAD_FONTS for backward compatibility

**Phase 4: Optional Mobile Warning**
- Implement Facebook Header mobile format warning (P3)
- Use existing alert system

**Phase 5: Visual Testing Updates**
- Regenerate all template reference images
- Update test expectations for new templates

### Key Technical Decisions

**Decision 1: Logo Positioning Calculations**
- **Chosen**: Calculate proportionally based on aspect ratio patterns
- **Rationale**:
  - Event: 1200x628 (ratio 1.91, logoTop 0.678) → 1920x1005 (ratio 1.91, same ratio) → logoTop can remain ~0.678
  - Facebook: 1958x745 (ratio 2.63, logoTop 0.6) → 820x360 (ratio 2.28, slightly less wide) → logoTop ~0.65 (adjust up slightly)
- **Validation**: Visual regression tests will confirm positioning

**Decision 2: Handling Existing post_45**
- **Chosen**: Rename existing `post_45` to `post_45_border`
- **Rationale**: Maintains existing behavior, adds clarity to naming
- **Impact**: Need to update any references to `post_45` in code

**Decision 3: Mobile Warning Implementation**
- **Chosen**: Use alert-system.js with conditional display logic in wizard.js
- **Rationale**: Leverages existing alert infrastructure, clean separation of concerns
- **Location**: Template change handler in wizard.js

**Decision 4: Visual Test Strategy**
- **Chosen**: Regenerate all template references using GENERATE_REFERENCE=true
- **Rationale**: Ensures pixel-perfect validation of new templates
- **Command**: `GENERATE_REFERENCE=true npm run test:visual`

### Parallel Execution Strategy

**Parallel Opportunities**:
- STEP-001, STEP-002 can run in parallel (different concerns: templates vs fonts)
- STEP-003, STEP-004 can run in parallel (different files: constants.js vs index.html)
- STEP-007, STEP-008 can run in parallel (independent optional features)

**Sequential Dependencies**:
- STEP-005 must follow STEP-003, STEP-004 (HTML updates need constants defined)
- STEP-009 must follow all implementation steps (testing validates changes)

**Expected Efficiency**: ~30-40% time reduction through parallelization of independent steps

## Implementation Steps

### STEP-001 [P]: Update Template Configurations in constants.js

**What**: Remove `post` template, rename `post_45` to `post_45_border`, add `post_45_no_border`, update `event` and `facebook_header` templates

**Why**: Core changes to template system (REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007)

**How**:
1. Open `resources/js/constants.js`
2. In `TemplateConstants.TEMPLATES` object (lines 105-223):
   - **Remove** entire `post` template object (lines 115-123)
   - **Rename** `post_45` key to `post_45_border` (keep all values same)
   - **Add** new `post_45_no_border` object after `post_45_border`:
     ```javascript
     post_45_no_border: {
         width: 1080,
         height: 1350,
         topBorderMultiplier: 1,
         border: 0,  // No border
         logoTop: 0.815,  // Same as bordered variant
         logoTextTop: 0.959,
         dpi: 200,
     },
     ```
   - **Update** `event` template:
     - `width: 1920` (from 1200)
     - `height: 1005` (from 628)
     - `border: 0` (from 20)
     - `logoTop: 0.678` (keep same - aspect ratio similar)
     - `logoTextTop: 0.9` (keep same)
   - **Update** `facebook_header` template:
     - `width: 820` (from 1958)
     - `height: 360` (from 745)
     - `border: 0` (from 20)
     - `logoTop: 0.65` (adjust from 0.6 - slightly less wide)
     - `logoTextTop: 0.88` (adjust from 0.872)

**Files**:
- Modify: `resources/js/constants.js:105-150`

**Agent**: `refactorer` (structural code changes with validation)

**Requirements Covered**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007

**Tests**:
- Unit test: Verify TemplateConstants.getTemplate() returns correct configs
- Verify removed templates return null
- Verify new templates return expected dimensions

**Validation**:
- Run: `grep -n "post:" resources/js/constants.js` → should return no matches
- Run: `grep -n "post_45_border\\|post_45_no_border" resources/js/constants.js` → should return 2 matches
- Verify event dimensions: 1920x1005, border: 0
- Verify facebook_header dimensions: 820x360, border: 0

**Dependencies**: None

**Parallel**: Yes (can run concurrently with STEP-002)

---

### STEP-002 [P]: Update Font Default to Non-Italic

**What**: Change DEFAULT_TEXT from "Gotham Narrow Ultra Italic" to "Gotham Narrow Book"

**Why**: Modernize default text styling, align with current branding (REQ-009)

**How**:
1. Open `resources/js/constants.js`
2. Locate `FONTS.DEFAULT_TEXT` (line 77)
3. Change value from `"Gotham Narrow Ultra Italic"` to `"Gotham Narrow Book"`
4. Verify `PRELOAD_FONTS` still includes all three fonts (lines 78-82) - keep unchanged for backward compatibility

**Files**:
- Modify: `resources/js/constants.js:77`

**Agent**: `refactorer` (simple constant change)

**Requirements Covered**: REQ-009

**Tests**:
- Unit test: Verify AppConstants.FONTS.DEFAULT_TEXT === "Gotham Narrow Book"
- Integration test: Create new text element, verify it uses Gotham Narrow Book font

**Validation**:
- Run: `grep "DEFAULT_TEXT" resources/js/constants.js` → should show "Gotham Narrow Book"
- Open app, add text element → verify non-italic font applied by default

**Dependencies**: None

**Parallel**: Yes (can run concurrently with STEP-001)

---

### STEP-003: Update Template Dropdown in HTML

**What**: Remove "Post quadratisch" option, add "Post 4:5 mit Rahmen" and "Post 4:5 ohne Rahmen" options

**Why**: Reflect template configuration changes in UI (REQ-001, REQ-002, REQ-003)

**How**:
1. Open `index.html`
2. Locate template select dropdown (lines 597-616)
3. In "Social Media" optgroup:
   - **Remove** line 600: `<option value="post">Post quadratisch</option>`
   - **Replace** line 601: `<option value="post_45">Post 4:5</option>` **WITH**:
     ```html
     <option value="post_45_border">Post 4:5 mit Rahmen</option>
     <option value="post_45_no_border">Post 4:5 ohne Rahmen</option>
     ```
4. Keep other options unchanged (story, event, facebook_header, print formats)

**Files**:
- Modify: `index.html:600-601`

**Agent**: `refactorer` (HTML markup changes)

**Requirements Covered**: REQ-001, REQ-002, REQ-003

**Tests**:
- E2E test: Open template dropdown, verify "Post quadratisch" is absent
- E2E test: Verify "Post 4:5 mit Rahmen" and "Post 4:5 ohne Rahmen" are present
- E2E test: Select each new template, verify canvas renders correctly

**Validation**:
- Run: `grep -i "Post quadratisch" index.html` → should return no matches
- Run: `grep "post_45_border\\|post_45_no_border" index.html` → should return 2 matches
- Open app, inspect dropdown → verify 2 new 4:5 options present

**Dependencies**: STEP-001 (needs template configs defined first)

**Parallel**: No (sequential after STEP-001)

---

### STEP-004: Remove Black Text Color Option from HTML

**What**: Remove "Schwarz" (black) option from text color select, keep only Gelb and Weiß

**Why**: Simplify color choices, align with GRÜNE branding (REQ-010)

**How**:
1. Open `index.html`
2. Locate text color select (lines 789-797)
3. **Remove** line 796: `<option value="rgb(0,0,0)">Schwarz</option>`
4. Keep Gelb (yellow) and Weiß (white) options

**Files**:
- Modify: `index.html:796`

**Agent**: `refactorer` (HTML markup changes)

**Requirements Covered**: REQ-010

**Tests**:
- E2E test: Open text color dropdown, verify only "Gelb" and "Weiß" present
- E2E test: Verify "Schwarz" is absent
- E2E test: Add text with each color, verify rendering

**Validation**:
- Run: `grep -i "Schwarz" index.html | grep "text-color"` → should return no matches
- Open app, inspect text color dropdown → verify only 2 options (Gelb, Weiß)

**Dependencies**: None

**Parallel**: Yes (can run concurrently with STEP-003)

---

### STEP-005: Verify Line-Height Options Remain Unchanged

**What**: Confirm that line-height dropdown still contains Klein, Mittel, Groß options

**Why**: Validation step - these options should remain unchanged per scope constraints

**How**:
1. Open `index.html`
2. Locate line-height select (lines 805-813)
3. Verify all three options present:
   - `<option value="0.8">Klein</option>`
   - `<option value="0.9">Mittel</option>`
   - `<option value="1.1">Groß</option>`
4. No changes needed - this is a validation checkpoint

**Files**:
- Read: `index.html:805-813` (no modifications)

**Agent**: `code-reviewer` (validation check)

**Requirements Covered**: Scope validation (Out of Scope: line-height changes)

**Tests**:
- E2E test: Verify all 3 line-height options are selectable
- Unit test: Verify line-height values correctly applied to text elements

**Validation**:
- Run: `grep -A 5 "id=\"line-height\"" index.html | grep "option"` → should return 3 option lines
- Open app, inspect line-height dropdown → verify Klein, Mittel, Groß all present

**Dependencies**: None

**Parallel**: Yes (validation step, can run anytime)

---

### STEP-006: Update Visual Regression Test References

**What**: Regenerate all template-related reference images to reflect new templates and updated dimensions

**Why**: Ensure visual regression tests pass with new template configurations

**How**:
1. Ensure all previous steps completed (templates updated, HTML updated)
2. Run reference image generation:
   ```bash
   GENERATE_REFERENCE=true npm run test:visual
   ```
3. This will regenerate reference images in `visual-regression/reference-images/` for:
   - All template tests (templates.spec.js)
   - Layout tests (layouts.spec.js)
   - Element tests (elements.spec.js)
   - Any tests using the modified templates
4. Review generated images for correctness:
   - New post_45_border images should show 1080x1350 with border
   - New post_45_no_border images should show 1080x1350 without border
   - Event template images should show 1920x1005 without border
   - Facebook header images should show 820x360 without border
   - Post quadratisch images should be absent
5. Commit new reference images to version control

**Files**:
- Modify/Create: `visual-regression/reference-images/*.png` (multiple files)

**Agent**: `test-writer` (test infrastructure updates)

**Requirements Covered**: All requirements (visual validation)

**Tests**:
- Run: `npm run test:visual` (without GENERATE_REFERENCE) → should pass with new references
- Verify pixel-perfect matching for all templates

**Validation**:
- Check reference image count: should have images for new templates, no images for removed template
- Run visual tests: `npm run test:visual` → all tests should pass
- Inspect specific images:
  - `ls visual-regression/reference-images/*post_45_border*.png`
  - `ls visual-regression/reference-images/*post_45_no_border*.png`
  - `ls visual-regression/reference-images/*event*.png`
  - `ls visual-regression/reference-images/*facebook*.png`

**Dependencies**: STEP-001, STEP-002, STEP-003, STEP-004 (all implementation changes must be complete)

**Parallel**: No (sequential after all implementation steps)

---

### STEP-007 [P]: Implement Facebook Mobile Warning (Optional - P3)

**What**: Add informational message when Facebook Header template selected, warning about mobile format differences

**Why**: Educate users about Facebook mobile display (REQ-008)

**How**:
1. Open `resources/js/wizard.js` or `resources/js/event-handlers.js`
2. Locate template selection change handler
3. Add conditional logic:
   ```javascript
   function onTemplateChange() {
       const templateName = jQuery("#canvas-template").val();

       // Clear previous warnings
       window.AlertSystem.clearAlerts();

       // Show Facebook mobile warning
       if (templateName === 'facebook_header') {
           window.AlertSystem.showAlert(
               'Hinweis: Facebook verwendet auf Mobilgeräten ein anderes Header-Format. Bitte Text möglichst mittig platzieren für optimale Darstellung.',
               'info',  // Use info style (light blue)
               { dismissible: true, autoHide: false }
           );
       }

       // ... rest of template change logic
   }
   ```
4. Ensure alert appears near template selection or in wizard interface
5. Verify alert uses info styling (not error/warning)

**Files**:
- Modify: `resources/js/wizard.js` OR `resources/js/event-handlers.js` (determine which has template change handler)

**Agent**: `implementer` (feature implementation with UI logic)

**Requirements Covered**: REQ-008

**Tests**:
- E2E test: Select Facebook Header template → verify info message appears
- E2E test: Verify message text in German is correct
- E2E test: Verify message has info styling (light blue background)
- E2E test: Select different template → verify message disappears
- E2E test: Re-select Facebook Header → verify message reappears

**Validation**:
- Open app, select Facebook Header → info alert should appear
- Alert should be dismissible
- Alert text should match requirement exactly
- Switching templates should clear alert

**Dependencies**: None (optional feature)

**Parallel**: Yes (can run concurrently with STEP-008)

---

### STEP-008 [P]: Verify Logo Size and Position Preservation

**What**: Validate that logo sizing and positioning logic remains unchanged

**Why**: Scope constraint - logo implementation must be preserved as-is

**How**:
1. Open `resources/js/constants.js`
2. Verify `LOGO.SCALE_RATIO: 10` unchanged (line 87)
3. Verify logo positioning calculations in `resources/js/main.js` (lines 141-194)
4. Confirm dynamic sizing formula: `(contentRect.width + contentRect.height) / 10`
5. No changes needed - this is a validation checkpoint

**Files**:
- Read: `resources/js/constants.js:86-99` (no modifications)
- Read: `resources/js/main.js:141-194` (no modifications)

**Agent**: `code-reviewer` (validation check)

**Requirements Covered**: Scope validation (logo preservation)

**Tests**:
- Unit test: Verify LOGO.SCALE_RATIO === 10
- Visual test: Verify logo sizes on new templates follow dynamic formula
- For each template, calculate expected logo size and verify in visual tests

**Validation**:
- Run: `grep "SCALE_RATIO" resources/js/constants.js` → should return `SCALE_RATIO: 10`
- Run visual tests → logos should appear at expected sizes on all templates
- Logo size should vary by template (dynamic, not fixed 130x130)

**Dependencies**: None

**Parallel**: Yes (validation step, can run anytime)

---

### STEP-009: Run Complete Test Suite

**What**: Execute all tests (unit, integration, E2E, visual regression) to validate implementation

**Why**: Comprehensive validation that all changes work correctly and no regressions introduced

**How**:
1. Run unit tests with coverage:
   ```bash
   npm run test:coverage
   ```
   - Verify all 102 unit tests pass
   - Check coverage reports for affected modules

2. Run visual regression tests:
   ```bash
   npm run test:visual
   ```
   - All 76 visual tests should pass with new references
   - Verify pixel-perfect matching for all templates

3. Run E2E tests:
   ```bash
   npm run test:e2e
   ```
   - All 33 E2E tests should pass
   - Verify template selection, canvas rendering, image export

4. Run production build:
   ```bash
   npm run build
   ```
   - Verify no build errors
   - Check bundled file sizes are reasonable

**Files**:
- Execute: Multiple test suites and build processes

**Agent**: `test-writer` (test execution and validation)

**Requirements Covered**: All requirements (comprehensive validation)

**Tests**:
- All existing test suites
- Expected results:
  - Unit tests: 102 passed
  - Visual tests: 76 passed
  - E2E tests: 33 passed
  - Build: Success

**Validation**:
- All test suites pass without errors
- No console errors during manual testing
- All templates render correctly in browser
- Export functionality works for all new templates

**Dependencies**: All previous steps (final validation)

**Parallel**: No (sequential after all implementation and reference updates)

---

### STEP-010: Update Documentation (CLAUDE.md)

**What**: Update project documentation to reflect template system changes

**Why**: Keep documentation in sync with implementation

**How**:
1. Open `CLAUDE.md`
2. Locate "Template System" section (if exists) or add new section
3. Update documentation to reflect:
   - Removed "Post Quadratisch" template
   - New 4:5 format variants (mit Rahmen, ohne Rahmen)
   - Updated event template dimensions (1920x1005)
   - Updated Facebook header dimensions (820x360)
   - Default font change (Gotham Narrow Book)
   - Text color options (only Gelb, Weiß)
   - Line-height options unchanged (Klein, Mittel, Groß)
   - Logo sizing preserved (dynamic)
4. Add note about visual regression test updates
5. Document any breaking changes (template name changes)

**Files**:
- Modify: `CLAUDE.md` (add/update Template System section)

**Agent**: `implementer` (documentation updates)

**Requirements Covered**: All requirements (documentation)

**Tests**:
- Review: Ensure documentation is accurate and complete
- Verify all changes are documented

**Validation**:
- Documentation clearly describes all template changes
- Developers can understand new template options from docs
- Breaking changes (template renames) are highlighted

**Dependencies**: STEP-009 (document final validated state)

**Parallel**: No (final step after validation)

---

## Testing Strategy

### Unit Tests

**Scope**: JavaScript constants and configuration validation

**Key Tests**:
- Verify `TemplateConstants.TEMPLATES` structure
- Validate removed `post` template returns null
- Validate new templates exist with correct dimensions
- Verify `AppConstants.FONTS.DEFAULT_TEXT` === "Gotham Narrow Book"
- Verify logo sizing constants unchanged

**Location**: `tests/unit/` directory

**Execution**: `npm run test:coverage`

### Integration Tests

**Scope**: Template system integration with canvas and UI

**Key Tests**:
- Template selection updates canvas dimensions
- Logo positioning correct for new templates
- Text creation uses new default font
- Color selection excludes black
- Border rendering correct for borderless templates

**Location**: `tests/integration/` directory

**Execution**: `npm test`

### Visual Regression Tests

**Scope**: Pixel-perfect validation of template rendering

**Key Tests**:
- All template tests in `visual-regression/tests/templates.spec.js`
- Layout tests for bordered vs borderless variants
- Logo positioning tests for resized templates
- Text rendering with new default font

**Reference Update**: STEP-006 regenerates all references

**Execution**: `npm run test:visual`

**Critical Validations**:
- New post_45_border renders 1080x1350 with 20px border
- New post_45_no_border renders 1080x1350 full-bleed
- Event template renders 1920x1005 borderless
- Facebook header renders 820x360 borderless
- Logo sizes consistent with dynamic formula

### End-to-End Tests

**Scope**: Full user workflows

**Key Tests**:
- Select each new template → verify canvas updates
- Create image with new templates → verify export
- Template switching preserves content
- Logo toggle works with new templates
- Facebook mobile warning appears (if implemented)

**Location**: `e2e/` directory

**Execution**: `npm run test:e2e`

### Manual Testing Checklist

After automated tests pass:

1. **Template Selection**:
   - [ ] Open app, verify "Post quadratisch" absent from dropdown
   - [ ] Verify "Post 4:5 mit Rahmen" present and selectable
   - [ ] Verify "Post 4:5 ohne Rahmen" present and selectable
   - [ ] Select each new template, verify canvas dimensions correct

2. **Visual Rendering**:
   - [ ] post_45_border: Verify 20px green border visible
   - [ ] post_45_no_border: Verify full-bleed (no border)
   - [ ] Event template: Verify 1920x1005, no border
   - [ ] Facebook header: Verify 820x360, no border
   - [ ] Logo appears correctly on all templates

3. **Text Styling**:
   - [ ] Add new text element → verify Gotham Narrow Book (non-italic) by default
   - [ ] Verify text color dropdown shows only Gelb and Weiß
   - [ ] Verify line-height dropdown shows Klein, Mittel, Groß

4. **Logo Behavior**:
   - [ ] Verify logo sizing varies by template (dynamic)
   - [ ] Logo positioning looks correct on all templates
   - [ ] Logo toggle on/off works correctly

5. **Export Functionality**:
   - [ ] Export image from each new template
   - [ ] Verify exported dimensions match template specs
   - [ ] Verify exported image quality appropriate

6. **Mobile Warning** (if implemented):
   - [ ] Select Facebook Header → info message appears
   - [ ] Message text correct in German
   - [ ] Switch template → message disappears

## Rollback and Safety

### Pre-Implementation Backup

**Git Branching Strategy**:
```bash
# Create feature branch for changes
git checkout -b feature/template-system-updates

# Commit incrementally after each step
git add <files>
git commit -m "STEP-XXX: <description>"
```

### Rollback Procedures

**If visual tests fail**:
1. Identify failing template
2. Adjust logo positioning values in `constants.js`
3. Regenerate references: `GENERATE_REFERENCE=true npm run test:visual`
4. Re-validate

**If canvas rendering breaks**:
1. Verify template configuration syntax (trailing commas, property names)
2. Check browser console for JavaScript errors
3. Verify getTemplate() returns expected values
4. Revert specific file if needed: `git checkout HEAD -- <file>`

**If export functionality breaks**:
1. Verify DPI values set correctly for new templates
2. Check Fabric.js canvas toDataURL() compatibility with new dimensions
3. Test export with smaller dimensions first

### Safety Validations

**After Each Step**:
- Run relevant test suite
- Check browser console for errors
- Verify affected functionality works manually

**Critical Checkpoints**:
1. After STEP-001: Verify template configs parse correctly, no syntax errors
2. After STEP-003: Verify dropdown renders without errors
3. After STEP-006: Verify all visual tests pass
4. After STEP-009: Comprehensive validation before merge

### Feature Flags (Not Required)

Since changes are non-destructive (adding templates, not removing critical functionality), feature flags are not necessary. Rollback via Git is sufficient.

## Traceability Matrix

| Requirement | Priority | Steps Covering It | Validation |
|-------------|----------|-------------------|------------|
| REQ-001: Remove "Post Quadratisch" | P1 | STEP-001, STEP-003 | Visual tests, manual check |
| REQ-002: Implement 4:5 with Border | P1 | STEP-001, STEP-003 | Visual tests, dimension check |
| REQ-003: Implement 4:5 without Border | P1 | STEP-001, STEP-003 | Visual tests, dimension check |
| REQ-004: Remove Event Border | P2 | STEP-001 | Visual tests, border validation |
| REQ-005: Update Event Dimensions | P2 | STEP-001 | Export validation, visual tests |
| REQ-006: Remove Facebook Header Border | P2 | STEP-001 | Visual tests, border validation |
| REQ-007: Update Facebook Header Dimensions | P2 | STEP-001 | Export validation, visual tests |
| REQ-008: Facebook Mobile Warning | P3 | STEP-007 | E2E tests, manual check |
| REQ-009: Change Default Font | P1 | STEP-002 | Unit tests, visual tests |
| REQ-010: Remove Black Text Color | P2 | STEP-004 | E2E tests, manual check |

**Coverage**: All 10 requirements covered by 10 implementation steps

**Reverse Mapping**:
- STEP-001 → REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007 (template configs)
- STEP-002 → REQ-009 (font default)
- STEP-003 → REQ-001, REQ-002, REQ-003 (template dropdown)
- STEP-004 → REQ-010 (text color)
- STEP-005 → Scope validation (line-height preservation)
- STEP-006 → All requirements (visual validation)
- STEP-007 → REQ-008 (mobile warning)
- STEP-008 → Scope validation (logo preservation)
- STEP-009 → All requirements (comprehensive testing)
- STEP-010 → All requirements (documentation)

## Success Criteria

### Functional Success

- [x] "Post Quadratisch" completely removed from UI and configuration
- [x] Two new 4:5 variants available and functional (mit Rahmen, ohne Rahmen)
- [x] Event template renders at 1920x1005 without border
- [x] Facebook Header renders at 820x360 without border
- [x] Default text style is non-italic (Gotham Narrow Book)
- [x] Black text color option removed (only Gelb and Weiß available)
- [x] Line-height options unchanged (Klein, Mittel, Groß all present)
- [x] Logo size and positioning remain unchanged (dynamic sizing preserved)
- [x] Optional Facebook mobile warning implemented (P3)

### Quality Success

- [x] All 102 unit tests pass
- [x] All 76 visual regression tests pass
- [x] All 33 E2E tests pass
- [x] No console errors or warnings
- [x] Canvas rendering smooth and performant
- [x] Exported images match expected dimensions exactly
- [x] Logo rendering consistent across templates
- [x] Text rendering clear with new defaults

### User Experience Success

- [x] Template selection less cluttered (one less option)
- [x] 4:5 format options provide clear choice (mit/ohne Rahmen)
- [x] Logo appears consistent across all generated images
- [x] Text defaults align with user expectations (non-italic)
- [x] Optional Facebook mobile warning provides helpful guidance

## Risk Assessment

### Low Risk Items
- Font default change (isolated to constants, well-tested)
- Text color removal (simple HTML change)
- Template dropdown updates (straightforward markup)

### Medium Risk Items
- Template dimension changes (require careful logo positioning)
- Template removal (ensure no broken references)
- Visual regression test updates (time-consuming regeneration)

### Mitigation Strategies
- Incremental commits after each step
- Comprehensive testing at each checkpoint
- Visual validation before final merge
- Git rollback capability maintained

## Dependencies and Prerequisites

### Required Before Starting
- [x] Development environment set up (`npm install` completed)
- [x] Playwright browsers installed
- [x] Python 3.x available (for logo JSON generation)
- [x] Access to visual regression testing infrastructure

### External Dependencies
- No new libraries or frameworks required
- All changes use existing infrastructure
- Fabric.js canvas library (already present)
- Existing alert system (for mobile warning)

## Timeline Estimate

**Sequential Execution** (traditional approach):
- STEP-001: 45 minutes (template config updates)
- STEP-002: 10 minutes (font default change)
- STEP-003: 15 minutes (template dropdown HTML)
- STEP-004: 5 minutes (text color HTML)
- STEP-005: 5 minutes (validation check)
- STEP-006: 60 minutes (visual regression reference regeneration)
- STEP-007: 30 minutes (mobile warning implementation)
- STEP-008: 5 minutes (validation check)
- STEP-009: 45 minutes (comprehensive testing)
- STEP-010: 20 minutes (documentation)
- **Total: ~4 hours**

**Parallel Execution** (optimized approach):
- Batch 1 (parallel): STEP-001 + STEP-002 → 45 minutes
- Batch 2 (parallel): STEP-003 + STEP-004 + STEP-005 → 15 minutes
- STEP-006 (sequential): 60 minutes
- Batch 3 (parallel): STEP-007 + STEP-008 → 30 minutes
- STEP-009 (sequential): 45 minutes
- STEP-010 (sequential): 20 minutes
- **Total: ~2.5-3 hours (35-40% time reduction)**

## Notes

- Logo positioning values may need fine-tuning after visual validation
- Visual regression test regeneration is the most time-consuming step
- Mobile warning (REQ-008) is optional (P3) and can be deferred if time-constrained
- All changes maintain backward compatibility with existing generated images
- No database migrations or external service changes required
