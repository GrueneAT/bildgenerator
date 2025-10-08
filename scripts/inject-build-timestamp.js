#!/usr/bin/env node

/**
 * Inject Build Timestamp into HTML
 *
 * This script adds a build timestamp to index.html by replacing a placeholder
 * with the current date/time. This allows developers to see when the last
 * build occurred, helping verify that changes have been properly propagated.
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, '..', 'index.html');

// Generate timestamp in Austrian format
const now = new Date();
const timeString = now.toLocaleTimeString('de-AT', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
const dateString = now.toLocaleDateString('de-AT');
const timestamp = `${dateString} ${timeString}`;

try {
  // Read HTML file
  let html = fs.readFileSync(HTML_FILE, 'utf8');

  // Replace the placeholder with actual build timestamp
  const buildTimestampMarker = '__BUILD_TIMESTAMP__';

  // Match either the placeholder or an existing timestamp
  const timestampRegex = /<span id="dev-timestamp-value">([^<]+)<\/span>/;

  if (html.includes(buildTimestampMarker)) {
    // Replace placeholder
    html = html.replace(buildTimestampMarker, timestamp);
    console.log(`✅ Injected build timestamp: ${timestamp}`);
  } else if (timestampRegex.test(html)) {
    // Replace existing timestamp
    html = html.replace(timestampRegex, `<span id="dev-timestamp-value">${timestamp}</span>`);
    console.log(`✅ Updated build timestamp: ${timestamp}`);
  } else {
    console.warn('⚠️  Build timestamp placeholder not found in index.html');
    console.warn('   Make sure index.html contains __BUILD_TIMESTAMP__ placeholder');
  }

  // Write back to file
  fs.writeFileSync(HTML_FILE, html, 'utf8');

} catch (error) {
  console.error('❌ Error injecting build timestamp:', error.message);
  process.exit(1);
}
