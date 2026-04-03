## Decisions (locked — research/planner must follow)

- **Post template consolidation:** Merge `post_45_border` and `post_45_no_border` into a single "Feed-Post 4:5" template with border=0. Remove both old entries.

- **Logo variant selection:** Keep auto-select logic based on text length. Map einzeilig → SHORT variant, zweizeilig → LONG variant (same selection heuristic as today, just new image files).

- **Print logo sizing — mm to px conversion:** Convert mm sizes using each template's DPI:
  - A4: 38mm × 250dpi / 25.4 = **374px**
  - A5: 27mm × 300dpi / 25.4 = **319px**
  - A6: 19mm × 300dpi / 25.4 = **224px**
  - Social media (all): fixed **163px**

- **Wahlkreuz symbol:** Convert `Wahl Kreuz im Kreis.eps` (repo root) to high-res transparent PNG at `resources/images/Wahlkreuz.png`. Replace current `Ankreuzen.png` reference in event-handlers.js.

- **Sub-organization logos:** All gemeinden/bundeslaender/domains logos share the same base logo image — only the text overlay differs. When loading any logo onto canvas, use the new logo files (white bar variants). The stored sub-org logo PNGs with old pink bar are NOT updated; the new base logo is applied at canvas render time.

- **Background color:** Single solid `#257639` for entire canvas. Remove the content rectangle (BACKGROUND_SECONDARY) since borders are eliminated. Simplify rendering — no inner rect needed.

- **All borders removed:** Every template gets `border: 0`. The border rendering path (content rect, border distance calculation) can be simplified since no template uses borders anymore.

## Claude's Discretion (research should explore options)

- Exact logo positioning values (logoTop, logoTextTop percentages) for the new borderless layout — need recalculation since border-based positioning logic changes
- Whether to fully remove the border rendering code or keep it dormant (border=0 path already works)
- How to handle the logo text overlay for sub-org logos with the new base logo — may need adjustment of text positioning since logo shape changed (pink bar → white bar)
- A6 template already exists in constants.js but may not be wired into the UI template selector — verify and add if missing

## Deferred (out of scope for this issue)

- Updating the actual sub-org logo PNG files on disk (gemeinden, bundeslaender, domains) — separate effort
- Any new templates beyond what's specified in the CI update document
- Mobile/responsive layout changes
