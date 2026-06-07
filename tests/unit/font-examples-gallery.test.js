/**
 * Unit tests for the font-examples gallery contract.
 *
 * Guards that the in-app modal (index.html) and the standalone schriften.html
 * fallback reference the same set of example images, that every referenced
 * image actually exists on disk, and that the picker hint opens the modal
 * (button, not a navigating link).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EXAMPLES_DIR = path.join(ROOT, 'resources/images/examples');

// The fully-composed example sharepics shown in the modal gallery: six with an
// AI photo background plus three that deliberately use NO background image (the
// plain solid GRÜNE green canvas), showing the generator works text-only too.
const EXPECTED_EXAMPLES = [
  'radboerse-feed.png',
  'openair-kino-story.png',
  'klima-stammtisch-feed.png',
  'klima-demo-event.png',
  'zitat-kandidatin-feed.png',
  'infostand-natur-story.png',
  // No-background examples (solid green canvas, no photo upload).
  'gemeinderat-feed.png',
  'workshop-story.png',
  'wahlaufruf-feed.png',
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function exampleRefs(html) {
  const re = /resources\/images\/examples\/([\w-]+\.png)/g;
  const set = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    set.add(m[1]);
  }
  return set;
}

describe('Font-examples gallery', () => {
  const indexHtml = read('index.html');
  const schriftenHtml = read('schriften.html');

  it('ships exactly the expected composed example sharepics on disk', () => {
    const files = fs
      .readdirSync(EXAMPLES_DIR)
      .filter((f) => f.endsWith('.png'))
      .sort();
    expect(files).toEqual([...EXPECTED_EXAMPLES].sort());
  });

  it('the modal references exactly the expected examples', () => {
    const refs = exampleRefs(indexHtml);
    expect([...refs].sort()).toEqual([...EXPECTED_EXAMPLES].sort());
    for (const file of refs) {
      expect(fs.existsSync(path.join(EXAMPLES_DIR, file))).toBe(true);
    }
  });

  it('every image referenced on schriften.html exists on disk', () => {
    const refs = exampleRefs(schriftenHtml);
    for (const file of refs) {
      expect(fs.existsSync(path.join(EXAMPLES_DIR, file))).toBe(true);
    }
  });

  it('keeps the modal gallery and the schriften gallery consistent', () => {
    const modalRefs = exampleRefs(indexHtml);
    const pageRefs = exampleRefs(schriftenHtml);
    // Every image shown in the modal also appears on the standalone page.
    for (const file of modalRefs) {
      expect(pageRefs.has(file)).toBe(true);
    }
  });

  it('exposes a button that opens the in-app modal (no navigation away)', () => {
    expect(indexHtml).toContain('id="font-examples-btn"');
    expect(indexHtml).toContain('id="fontExamplesModal"');
    // The picker hint must not be an anchor navigating to schriften.html.
    const hintArea = indexHtml.slice(
      indexHtml.indexOf('id="font-style-select"'),
      indexHtml.indexOf('id="font-style-select"') + 1200
    );
    expect(hintArea).toContain('id="font-examples-btn"');
    expect(hintArea).not.toMatch(/href="schriften\.html"/);
  });

  it('exposes a prominent, always-visible header entry into the same modal', () => {
    // A header button (desktop + mobile) opens the SAME #fontExamplesModal —
    // not a duplicate — so users can reach the gallery from anywhere.
    expect(indexHtml).toContain('id="header-examples-btn"');
    expect(indexHtml).toContain('id="header-examples-btn-mobile"');
    // The header button must live in the header, before the wizard content.
    const headerStart = indexHtml.indexOf('class="header');
    const contentStart = indexHtml.indexOf('id="font-style-select"');
    const headerBtn = indexHtml.indexOf('id="header-examples-btn"');
    expect(headerBtn).toBeGreaterThan(headerStart);
    expect(headerBtn).toBeLessThan(contentStart);
  });

  it('includes no-background examples on the plain green canvas', () => {
    const noBg = ['gemeinderat-feed.png', 'workshop-story.png', 'wahlaufruf-feed.png'];
    const modalRefs = exampleRefs(indexHtml);
    for (const file of noBg) {
      expect(modalRefs.has(file)).toBe(true);
      expect(fs.existsSync(path.join(EXAMPLES_DIR, file))).toBe(true);
    }
    // Their captions must flag the "ohne Hintergrundbild" occasion.
    expect(indexHtml).toContain('ohne Hintergrundbild');
    expect(schriftenHtml).toContain('ohne Hintergrundbild');
  });

  it('never names the underlying fonts by brand in the picker labels', () => {
    const selectStart = indexHtml.indexOf('id="font-style-select"');
    const selectBlock = indexHtml.slice(selectStart, selectStart + 600);
    expect(selectBlock).not.toMatch(/Barlow|Vollkorn/i);
  });
});
