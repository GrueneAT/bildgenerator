---
name: fix-logo-borderless-templates
type: bug
priority: critical
created: 2025-11-14T13:55:00Z
status: ready
---

# Fix: Logos Not Displaying on Borderless Templates

## Problem

Logos do not display on templates with `border: 0` (borderless templates):
- `post_45_no_border` (1080x1350, border: 0)
- `event` (1920x1005, border: 0)
- `facebook_header` (820x360, border: 0)

## Root Cause

**File**: `resources/js/main.js:59`

**Buggy Code**:
```javascript
const borderDistance = canvas.width / border;
```

**Issue**: Division by zero when `border: 0`
- `borderDistance = canvas.width / 0 = Infinity`
- `contentRect.width = canvas.width - Infinity * 2 = -Infinity`
- `contentRect.height = canvas.height - (Infinity + Infinity) = -Infinity`
- `scaleTo = (-Infinity + -Infinity) / 10 = -Infinity`
- Logo size becomes invalid → Logo doesn't render

## Impact

- **User-facing**: Users cannot see logos on borderless templates (3 out of 8 social media templates)
- **Visual tests**: Existing reference images were generated with buggy code, so tests pass but show incorrect behavior
- **Production**: Critical bug affecting Facebook headers and event graphics

## Requirements

### REQ-001: Fix Logo Calculation for Borderless Templates (P1 - Critical)
**Description**: Update `replaceCanvas()` function to handle `border: 0` correctly

**Acceptance Criteria**:
- When `border: 0`, contentRect should span full canvas dimensions
- Logo size calculation should use full canvas width/height
- Logo positioning should work correctly
- No division by zero errors

**Technical Details**:
```javascript
// Current (buggy):
const borderDistance = canvas.width / border;

// Proposed fix:
const borderDistance = border > 0 ? canvas.width / border : 0;
```

### REQ-002: Update Visual Regression Tests (P1 - Critical)
**Description**: Regenerate reference images for borderless templates with correct logo rendering

**Affected Tests**:
- `template-post-45-no-border-reference.png`
- `template-event-reference.png`
- `template-facebook-header-reference.png`

**Acceptance Criteria**:
- Reference images show logos correctly positioned
- All visual regression tests pass
- Logo size and position match bordered templates (scaled appropriately)

### REQ-003: Add Logo Visibility Tests (P1 - Critical)
**Description**: Add specific test assertions to verify logos are visible on all templates

**Test Requirements**:
- Unit test: Verify borderDistance calculation doesn't produce Infinity
- Unit test: Verify contentRect dimensions are positive for border: 0
- Integration test: Verify logo object exists on canvas for each template
- Visual test: Verify logo pixels are present in rendered output

**File**: New test file or update existing `tests/unit/logo-toggle.test.js`

### REQ-004: Validate Logo Positioning Calculations (P2 - Important)
**Description**: Ensure logo positioning formulas work correctly for borderless templates

**Validation Points**:
- `logoTop` percentage values apply correctly to full canvas height
- `logoTextTop` percentage values apply correctly to full canvas height
- Logos appear in expected positions (lower on canvas for borderless)

## Technical Context

### Affected Files
- `resources/js/main.js:59` - Division by zero bug
- `resources/js/main.js:115` - Logo size calculation depends on contentRect
- `resources/js/main.js:158` - Logo top position calculation
- `resources/js/main.js:167` - Logo text top position calculation

### Current Template Configurations
```javascript
// Borderless templates:
post_45_no_border: { border: 0, logoTop: 0.815, logoTextTop: 0.959 }
event: { border: 0, logoTop: 0.678, logoTextTop: 0.9 }
facebook_header: { border: 0, logoTop: 0.65, logoTextTop: 0.88 }

// Bordered templates (working):
post_45_border: { border: 20, logoTop: 0.815, logoTextTop: 0.959 }
story: { border: 10, logoTop: 0.83, logoTextTop: 0.9423 }
```

### Logo Size Formula
```javascript
// Line 115 in main.js:
const scaleTo = (contentRect.width + contentRect.height) / AppConstants.LOGO.SCALE_RATIO;
// SCALE_RATIO = 10
```

## Success Criteria

- [ ] Division by zero fixed in `replaceCanvas()`
- [ ] Logos display correctly on all borderless templates
- [ ] Visual regression tests updated with correct reference images
- [ ] All 75 visual tests pass
- [ ] New unit tests validate borderDistance calculation
- [ ] Integration tests verify logo presence on all templates
- [ ] Manual testing confirms logos visible and correctly positioned

## Testing Strategy

### Unit Tests
1. Test `borderDistance` calculation with `border: 0` → expect `0`
2. Test `borderDistance` calculation with `border: 20` → expect `canvas.width / 20`
3. Test `contentRect.width` with `border: 0` → expect `canvas.width`
4. Test `contentRect.height` with `border: 0` → expect `canvas.height`

### Integration Tests
1. Load each borderless template
2. Add logo
3. Assert logo object exists on canvas
4. Assert logo.scaleX and logo.scaleY are positive numbers
5. Assert logo.top is within canvas bounds

### Visual Regression Tests
1. Regenerate ALL reference images (not just borderless ones)
2. Run `GENERATE_REFERENCE=true npm run test:visual`
3. Manually inspect reference images for logo presence
4. Run `npm run test:visual` to validate

### Manual Testing Checklist
- [ ] Select `post_45_no_border` → Logo appears
- [ ] Select `event` → Logo appears
- [ ] Select `facebook_header` → Logo appears
- [ ] Switch between bordered and borderless → Logo resizes correctly
- [ ] Logo text appears below logo graphic
- [ ] Logo positioning matches design expectations

## Constraints

- **Backward Compatibility**: Fix must not affect bordered templates
- **Logo Size**: Borderless logos should scale to full canvas dimensions
- **Position Percentages**: logoTop/logoTextTop values should work as-is
- **Performance**: No performance impact on canvas rendering

## Out of Scope

- Changing logo positioning percentages (logoTop, logoTextTop)
- Changing logo size formula (SCALE_RATIO)
- Adding new logo features
- Refactoring canvas initialization beyond the fix

## Dependencies

- None (standalone bug fix)

## Risks

- **Low Risk**: Simple arithmetic fix with clear test validation
- **Potential Issue**: Logo positioning percentages may need adjustment after fix
  - Mitigation: Visual regression tests will catch this

## Implementation Notes

### Recommended Approach
1. Fix division by zero in `main.js:59`
2. Run manual test to verify logos appear
3. Adjust logoTop/logoTextTop if needed
4. Regenerate ALL visual reference images
5. Run complete test suite
6. Manual QA on all templates

### Alternative Approach (Not Recommended)
- Use `border: 1` instead of `border: 0` for "borderless" templates
- Reason: Doesn't actually solve the division by zero issue, just avoids it
