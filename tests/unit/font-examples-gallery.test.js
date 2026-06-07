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

  it('ships at least six example thumbnails on disk', () => {
    const files = fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.png'));
    expect(files.length).toBeGreaterThanOrEqual(6);
  });

  it('every image referenced in the modal exists on disk', () => {
    const refs = exampleRefs(indexHtml);
    expect(refs.size).toBeGreaterThanOrEqual(6);
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

  it('never names the underlying fonts by brand in the picker labels', () => {
    const selectStart = indexHtml.indexOf('id="font-style-select"');
    const selectBlock = indexHtml.slice(selectStart, selectStart + 600);
    expect(selectBlock).not.toMatch(/Barlow|Vollkorn/i);
  });
});
