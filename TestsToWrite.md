# Visual Regression Tests To Write

## Current Test Coverage Analysis

**Currently Implemented Tests (5 tests):**
- ✅ Basic Layout - Template and logo rendering
- ✅ Text Elements - Basic text rendering and positioning  
- ✅ Shape Elements - Pink circle and checkmark elements
- ✅ Combined Layout - Basic combination of text, shapes, and QR code
- ✅ Application Functionality - Core feature verification

**Coverage Gap:** Current tests cover ~15% of available features. Major gaps in template variety, styling options, advanced features, and edge cases.

---

## Comprehensive Test Plan (85+ Additional Tests)

### **CATEGORY 1: Template System Testing (16 tests)**

#### **1.1 Social Media Templates (8 tests)**
- [ ] **Post Quadratisch (1080×1080px)** - Template dimensions and layout
- [ ] **Post 4:5 (1080×1350px)** - Aspect ratio and element positioning
- [ ] **Instagram Story (1080×1920px)** - Vertical layout optimization
- [ ] **Facebook Event (1200×628px)** - Wide format layout
- [ ] **Facebook Header (1958×745px)** - Ultra-wide format
- [ ] **Story Template with Content** - Story with background image and text overlay
- [ ] **Post Template Logo Positioning** - Verify logo placement across different post formats
- [ ] **Template Border Calculations** - Test automatic border sizing per template

#### **1.2 Print Templates (8 tests)**
- [ ] **A4 Poster Portrait (2480×3508px)** - High-resolution print format
- [ ] **A4 Landscape (3508×2480px)** - Landscape orientation
- [ ] **A3 Poster Portrait (3508×4961px)** - Large format poster
- [ ] **A3 Landscape (4961×3508px)** - Large landscape format
- [ ] **A2 Poster Portrait (4961×7016px)** - Extra large format
- [ ] **A2 Landscape (7016×4961px)** - Extra large landscape
- [ ] **A5 Flyer Portrait (1748×2480px)** - Small print format
- [ ] **A5 Flyer Landscape (2480×1748px)** - Small landscape format

---

### **CATEGORY 2: Text System Testing (24 tests)**

#### **2.1 Font and Typography (8 tests)**
- [ ] **Gotham Narrow Ultra Italic** - Headline font rendering
- [ ] **Gotham Narrow Book** - Body text font rendering
- [ ] **Font Loading States** - Test with FontFaceObserver loading completion
- [ ] **Mixed Font Layout** - Combination of both fonts in single design
- [ ] **Long Text Wrapping** - Multi-line text behavior and overflow
- [ ] **Special Characters** - German umlauts, special punctuation
- [ ] **Text Scaling Constraints** - Auto-scaling behavior on different templates
- [ ] **Empty Text Handling** - Behavior with empty or whitespace-only text

#### **2.2 Text Colors (3 tests)**
- [ ] **Yellow Text (#FFD200)** - Primary brand color text
- [ ] **White Text (#FFFFFF)** - High contrast white text
- [ ] **Black Text (#000000)** - Standard black text

#### **2.3 Text Alignment (3 tests)**
- [ ] **Left-Aligned Text** - Text aligned to left edge
- [ ] **Center-Aligned Text** - Text centered horizontally
- [ ] **Right-Aligned Text** - Text aligned to right edge

#### **2.4 Line Height Variations (3 tests)**
- [ ] **Compact Line Height (0.8)** - Tight text spacing
- [ ] **Normal Line Height (0.9)** - Standard text spacing
- [ ] **Loose Line Height (1.1)** - Expanded text spacing

#### **2.5 Text Effects (4 tests)**
- [ ] **No Shadow (0px)** - Clean text without effects
- [ ] **Light Shadow (10px)** - Subtle text shadow
- [ ] **Medium Shadow (20px)** - Moderate shadow depth
- [ ] **Heavy Shadow (30px)** - Maximum shadow effect

#### **2.6 Complex Text Scenarios (3 tests)**
- [ ] **Multi-line Text with Alignment** - Paragraph text with different alignments
- [ ] **Text Overflow Handling** - Very long text exceeding canvas boundaries
- [ ] **Text with Line Breaks** - Manual line breaks in text content

---

### **CATEGORY 3: Logo System Testing (20 tests)**

#### **3.1 Logo Categories (8 tests)**
- [ ] **Bundesland Logo Selection** - Federal state logos
- [ ] **Gemeinde Logo Selection** - Municipal logos
- [ ] **Bezirk Logo Selection** - District logos
- [ ] **Klub Logo Selection** - Club logos
- [ ] **Gebiet Logo Selection** - Regional logos
- [ ] **Searchable Logo Filter** - Logo search functionality
- [ ] **Logo Dropdown Interaction** - Custom dropdown component behavior
- [ ] **No Logo Selected State** - Default state without logo selection

#### **3.2 Logo Rendering (6 tests)**
- [ ] **Logo Size 120px** - Small logo variant
- [ ] **Logo Size 245px** - Large logo variant
- [ ] **Logo Text Generation** - Automatic organization name text
- [ ] **Long Organization Names** - Text wrapping for lengthy names
- [ ] **Logo Positioning by Template** - Template-specific logo placement
- [ ] **Logo Always-on-Top Layering** - Z-index behavior

#### **3.3 Logo Edge Cases (6 tests)**
- [ ] **Missing Logo Image** - Fallback behavior for broken logo URLs
- [ ] **Logo Loading States** - Progressive loading visualization
- [ ] **Embedded Logo Data** - Base64 embedded logo handling
- [ ] **Multiple Logo Changes** - Switching between different logos
- [ ] **Logo with Special Characters** - Organization names with umlauts/punctuation
- [ ] **Logo Memory Management** - Performance with multiple logo switches

---

### **CATEGORY 4: Background Image System Testing (12 tests)**

#### **4.1 Pre-loaded Backgrounds (4 tests)**
- [ ] **Gallery Background Selection** - Template image gallery
- [ ] **Masonry Grid Layout** - Gallery grid rendering
- [ ] **Background Image Scaling** - Auto-fit to content rectangle
- [ ] **Background Image Clipping** - Proper boundary handling

#### **4.2 Custom Image Upload (8 tests)**
- [ ] **JPEG Upload** - JPEG image file upload and rendering
- [ ] **PNG Upload** - PNG image with transparency support
- [ ] **WebP Upload** - Modern WebP format support
- [ ] **SVG Upload** - Vector image support
- [ ] **Large Image Handling** - Performance with high-resolution images
- [ ] **Image Format Conversion** - Cross-format compatibility
- [ ] **Invalid Image Upload** - Error handling for unsupported formats
- [ ] **Cross-origin Image Support** - External image URL handling

---

### **CATEGORY 5: Additional Elements Testing (16 tests)**

#### **5.1 Graphical Elements (4 tests)**
- [ ] **Pink Circle Element** - Rosa circle rendering and positioning
- [ ] **Checkmark Element** - Häkchen icon rendering
- [ ] **Custom Image Upload** - User-uploaded image elements
- [ ] **Multiple Element Combinations** - Various elements together

#### **5.2 QR Code System (12 tests)**
- [ ] **Black QR Code** - Standard black QR code generation
- [ ] **Dark Green QR Code** - Brand-colored QR code
- [ ] **QR Code with URL** - Web link QR codes
- [ ] **QR Code with Text** - Plain text QR codes
- [ ] **QR Code with Special Characters** - Umlauts and punctuation in QR content
- [ ] **Large QR Code Content** - Long URLs or text
- [ ] **QR Code Size Optimization** - Canvas-based size calculation
- [ ] **QR Code White Border** - Border generation around QR code
- [ ] **QR Code High Resolution** - 512-2048px rendering quality
- [ ] **QR Code Error Correction** - Level M error correction testing
- [ ] **Invalid QR Code Content** - Error handling for problematic content
- [ ] **QR Code Performance** - Generation speed with complex content

---

### **CATEGORY 6: Element Manipulation Testing (15 tests)**

#### **6.1 Circle Clipping (4 tests)**
- [ ] **Large Circle Clipping (90%)** - Maximum circle size
- [ ] **Medium Circle Clipping (70%)** - Standard circle size
- [ ] **Small Circle Clipping (50%)** - Minimum circle size
- [ ] **Circle Clipping Toggle** - On/off functionality

#### **6.2 Scaling Controls (3 tests)**
- [ ] **Minimum Scaling (0.1)** - Smallest element size
- [ ] **Maximum Scaling (2.0)** - Largest element size
- [ ] **Precise Scaling (0.5-1.5)** - Mid-range scaling values

#### **6.3 Layer Management (4 tests)**
- [ ] **Bring to Front** - Move element to top layer
- [ ] **Send to Back** - Move element to bottom layer
- [ ] **Layer Order Preservation** - Multiple layering operations
- [ ] **Protected Element Layering** - Logo/background layer protection

#### **6.4 Element Interactions (4 tests)**
- [ ] **Multi-selection** - Multiple element selection and manipulation
- [ ] **Element Deletion** - Remove selected objects
- [ ] **Element Constraints** - Boundary and movement limitations
- [ ] **Smart Snap Alignment** - Auto-alignment to center and edges

---

### **CATEGORY 7: Export and Download Testing (12 tests)**

#### **7.1 Format Options (6 tests)**
- [ ] **PNG Export High Quality** - Maximum quality PNG output
- [ ] **PNG Export Medium Quality** - Balanced PNG output
- [ ] **JPEG Export High Quality (1.0)** - Maximum JPEG quality
- [ ] **JPEG Export Medium Quality (0.5)** - Balanced JPEG quality
- [ ] **JPEG Export Low Quality (0.1)** - Compressed JPEG output
- [ ] **Format Comparison** - Visual differences between PNG/JPEG

#### **7.2 DPI and Resolution (6 tests)**
- [ ] **Template-Specific DPI** - Correct DPI scaling per template
- [ ] **Browser Safety Limits** - Canvas size limitation handling
- [ ] **Smart Downscaling** - Automatic resolution reduction
- [ ] **Multiplier-Based Rendering** - DPI calculation accuracy
- [ ] **Oversized Canvas Handling** - Error prevention for massive canvases
- [ ] **Quality vs File Size** - Optimization balance testing

---

### **CATEGORY 8: User Interface Testing (10 tests)**

#### **8.1 Wizard Navigation (4 tests)**
- [ ] **4-Step Wizard Flow** - Complete workflow navigation
- [ ] **Step Validation** - Auto-advance and validation logic
- [ ] **Progress Indicators** - Desktop and mobile progress display
- [ ] **Start Over Functionality** - Workflow reset capability

#### **8.2 Responsive Design (3 tests)**
- [ ] **Mobile Layout** - Touch-friendly mobile interface
- [ ] **Tablet Layout** - Medium screen optimization
- [ ] **Desktop Layout** - Full desktop interface

#### **8.3 Form Controls (3 tests)**
- [ ] **Searchable Select Components** - Custom dropdown behavior
- [ ] **Button Groups** - Alignment and selection groups
- [ ] **Range Sliders** - Precise numerical control inputs

---

### **CATEGORY 9: Edge Cases and Error Handling (12 tests)**

#### **9.1 Performance Scenarios (4 tests)**
- [ ] **Maximum Elements** - Canvas with many objects
- [ ] **Large Canvas Memory** - High-resolution performance
- [ ] **Font Loading Failures** - Fallback font behavior
- [ ] **Image Loading Timeouts** - Network error handling

#### **9.2 Browser Compatibility (4 tests)**
- [ ] **Canvas API Limitations** - Browser-specific constraints
- [ ] **File API Support** - Upload functionality across browsers
- [ ] **Font Rendering Differences** - Cross-browser text consistency
- [ ] **Performance Variations** - Speed differences between browsers

#### **9.3 Data Edge Cases (4 tests)**
- [ ] **Empty State Handling** - No content scenarios
- [ ] **Malformed Data Input** - Invalid text/URL inputs
- [ ] **Memory Cleanup** - Object disposal and garbage collection
- [ ] **State Persistence** - LocalStorage and session management

---

### **CATEGORY 10: Integration and Workflow Testing (8 tests)**

#### **10.1 Complete Workflows (4 tests)**
- [ ] **Social Media Post Creation** - End-to-end social media workflow
- [ ] **Print Poster Design** - Complete print design workflow
- [ ] **Event Flyer Creation** - Event-specific design workflow
- [ ] **Multi-format Export** - Same design in multiple formats

#### **10.2 Real-world Scenarios (4 tests)**
- [ ] **Campaign Material Set** - Consistent branding across formats
- [ ] **Multilingual Content** - German text with proper rendering
- [ ] **High-volume Usage** - Repeated operations and performance
- [ ] **Accessibility Features** - Screen reader and keyboard navigation

---

## Implementation Priority

### **Phase 1: Core Feature Expansion (20 tests)**
1. Template variety testing (all formats)
2. Text color and alignment options
3. QR code color variations
4. Logo system comprehensive testing

### **Phase 2: Advanced Features (25 tests)**
1. Background image system
2. Element manipulation controls
3. Export format and quality options
4. Complex element interactions

### **Phase 3: Edge Cases and Polish (40 tests)**
1. Performance and browser compatibility
2. Error handling scenarios
3. Complete workflow testing
4. Real-world usage scenarios

---

## Testing Methodology Notes

### **Consistency Requirements:**
- Each test should use standardized positioning logic
- Reference images must be generated with identical conditions
- 0.1% difference threshold maintained across all tests
- Proper wait times for element loading and rendering

### **Test Data Standards:**
- Use consistent text content (e.g., "GRÜNE TEST" variations)
- Standard positioning ratios (e.g., 0.2, 0.5, 0.8 for layout)
- Identical scaling factors where applicable
- Standardized color values and measurements

### **Performance Considerations:**
- Group related tests to minimize setup overhead
- Use efficient element positioning strategies
- Implement proper cleanup between tests
- Monitor test execution time and optimize as needed

### **Maintenance Strategy:**
- Regular baseline updates when features change
- Automated test execution in CI/CD pipeline
- Clear documentation for test failure investigation
- Version control for reference images with change tracking

---

## Expected Outcomes

**Complete Coverage:** 90+ comprehensive visual regression tests covering all application features

**Quality Assurance:** Every user-facing feature validated for visual consistency

**Robust Detection:** Catch visual regressions at 0.1% precision level

**Development Confidence:** Safe refactoring and feature additions with comprehensive safety net