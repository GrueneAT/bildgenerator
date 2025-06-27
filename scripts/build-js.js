#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

// Define vendor libraries to bundle (excluding jQuery)
const VENDOR_FILES_ORDER = [
  "vendors/mustache/mustache.js",
  "vendors/imagesloaded/imagesloaded.pkgd.min.js",
  "vendors/masonry/masonry.pkgd.min.js",
  "vendors/fabric-js/fabric.min.js",
  "vendors/fontfaceobserver/fontfaceobserver.standalone.js",
  "vendors/qrcode.min.js",
];

// Define the correct loading order for JavaScript files
const JS_FILES_ORDER = [
  // Core utilities - must load first
  "resources/js/constants.js",
  "resources/js/validation.js",
  "resources/js/alert-system.js",
  "resources/js/canvas-utils.js",
  "resources/js/event-handlers.js",

  // Application modules
  "resources/js/modal.js",
  "resources/js/searchable-select.js",
  "resources/js/initialization.js",
  "resources/js/helpers.js",
  "resources/js/choice-image.js",
  "resources/js/handlers.js",
  "resources/js/main.js",
  "resources/js/wizard.js",

  // QR Code modules
  "resources/js/qrcode/qrcode-helpers.js",
  "resources/js/qrcode/qrcode-generator.js",
  "resources/js/qrcode/qrcode-wizard.js",
  "resources/js/qrcode/qrcode-handlers.js",
];

async function buildVendorBundle() {
  try {
    console.log("📦 Building vendor bundle...");
    
    // Ensure build directory exists
    const buildDir = path.join(__dirname, "..", "build");
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Read and concatenate all vendor files in the correct order
    let concatenatedVendors = "";

    for (const filePath of VENDOR_FILES_ORDER) {
      const fullPath = path.join(__dirname, "..", filePath);

      if (fs.existsSync(fullPath)) {
        console.log(`📦 Adding vendor: ${filePath}`);
        const content = fs.readFileSync(fullPath, "utf8");
        concatenatedVendors += `\n// === ${filePath} ===\n`;
        concatenatedVendors += content;
        concatenatedVendors += "\n";
      } else {
        console.warn(`⚠️  Vendor file not found: ${filePath}`);
      }
    }

    // Write the concatenated vendors to a temporary location
    const tempVendorPath = path.join(buildDir, "temp-vendors.js");
    fs.writeFileSync(tempVendorPath, concatenatedVendors);

    // Use esbuild to minify vendor bundle
    const vendorResult = await esbuild.build({
      entryPoints: [tempVendorPath],
      bundle: false,
      minify: true,
      sourcemap: true,
      target: ["es2017"],
      outfile: path.join(buildDir, "vendors.min.js"),
      format: "iife",
      banner: {
        js: `/*! Grüne Bildgenerator Vendors v1.0.0 | Built: ${new Date().toISOString()} */`,
      },
      legalComments: "none",
      keepNames: true, // Preserve library function names
    });

    // Clean up temp file
    fs.unlinkSync(tempVendorPath);

    // Copy jQuery separately
    const jquerySource = path.join(__dirname, "..", "vendors/jquery/jquery-3.7.1.min.js");
    const jqueryDest = path.join(buildDir, "jquery.min.js");
    if (fs.existsSync(jquerySource)) {
      fs.copyFileSync(jquerySource, jqueryDest);
      console.log("📦 jQuery copied separately");
    }

    // Get vendor bundle size
    const vendorOriginalSize = Buffer.byteLength(concatenatedVendors, "utf8");
    const vendorMinifiedSize = fs.statSync(path.join(buildDir, "vendors.min.js")).size;
    const vendorCompressionRatio = (
      ((vendorOriginalSize - vendorMinifiedSize) / vendorOriginalSize) *
      100
    ).toFixed(1);

    console.log("✅ Vendor bundle created successfully!");
    console.log(`📊 Vendor original size: ${(vendorOriginalSize / 1024).toFixed(1)} KB`);
    console.log(`📊 Vendor minified size: ${(vendorMinifiedSize / 1024).toFixed(1)} KB`);
    console.log(`📊 Vendor compression: ${vendorCompressionRatio}% smaller`);
    console.log(`📄 Output: build/vendors.min.js`);
    console.log(`📄 jQuery: build/jquery.min.js`);

    return {
      success: true,
      vendorOriginalSize,
      vendorMinifiedSize,
      vendorCompressionRatio,
    };
  } catch (error) {
    console.error("❌ Vendor bundle build failed:", error);
    throw error;
  }
}

async function buildJavaScript() {
  try {
    console.log("🚀 Building JavaScript bundles...");

    // Build vendor bundle first
    const vendorResults = await buildVendorBundle();

    // Ensure build directory exists
    const buildDir = path.join(__dirname, "..", "build");
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Read and concatenate all JS files in the correct order
    let concatenatedJS = "";

    for (const filePath of JS_FILES_ORDER) {
      const fullPath = path.join(__dirname, "..", filePath);

      if (fs.existsSync(fullPath)) {
        console.log(`📦 Adding: ${filePath}`);
        const content = fs.readFileSync(fullPath, "utf8");
        concatenatedJS += `\n// === ${filePath} ===\n`;
        concatenatedJS += content;
        concatenatedJS += "\n";
      } else {
        console.warn(`⚠️  File not found: ${filePath}`);
      }
    }

    // Write the concatenated file to a temporary location
    const tempPath = path.join(buildDir, "temp-bundle.js");
    fs.writeFileSync(tempPath, concatenatedJS);

    // Use esbuild to minify and optimize
    const result = await esbuild.build({
      entryPoints: [tempPath],
      bundle: false, // We've already concatenated manually
      //   minify: true,
      sourcemap: true,
      target: ["es2017"], // Support modern browsers
      outfile: path.join(buildDir, "app.min.js"),
      format: "iife", // Immediately Invoked Function Expression for browser
      globalName: "GrueneApp", // Global namespace
      banner: {
        js: `/*! Grüne Bildgenerator v1.0.0 | Built: ${new Date().toISOString()} */`,
      },
      legalComments: "none",
      drop: ["console", "debugger"], // Remove console.log and debugger statements
      keepNames: true, // Preserve variable and function names
      minifyIdentifiers: false,
      minifyWhitespace: true,
      minifySyntax: true,
    });

    // Clean up temp file
    fs.unlinkSync(tempPath);

    // Get file sizes
    const originalSize = Buffer.byteLength(concatenatedJS, "utf8");
    const minifiedSize = fs.statSync(path.join(buildDir, "app.min.js")).size;
    const compressionRatio = (
      ((originalSize - minifiedSize) / originalSize) *
      100
    ).toFixed(1);

    console.log("✅ JavaScript bundles created successfully!");
    console.log(`📊 App original size: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`📊 App minified size: ${(minifiedSize / 1024).toFixed(1)} KB`);
    console.log(`📊 App compression: ${compressionRatio}% smaller`);
    console.log(`📄 Output: build/app.min.js`);
    console.log(`📄 Output: build/vendors.min.js`);
    console.log(`📄 Output: build/jquery.min.js`);
    console.log(`🗺️  Source maps: build/*.min.js.map`);

    return {
      success: true,
      app: { originalSize, minifiedSize, compressionRatio },
      vendor: vendorResults,
    };
  } catch (error) {
    console.error("❌ JavaScript build failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildJavaScript();
}

module.exports = { buildJavaScript, buildVendorBundle, JS_FILES_ORDER, VENDOR_FILES_ORDER };
