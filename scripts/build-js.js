#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// Define the correct loading order for JavaScript files
const JS_FILES_ORDER = [
    // Core utilities - must load first
    'resources/js/constants.js',
    'resources/js/validation.js',
    'resources/js/alert-system.js',
    'resources/js/canvas-utils.js',
    'resources/js/event-handlers.js',
    
    // Application modules
    'resources/js/modal.js',
    'resources/js/searchable-select.js',
    'resources/js/initialization.js',
    'resources/js/helpers.js',
    'resources/js/choice-image.js',
    'resources/js/handlers.js',
    'resources/js/main.js',
    'resources/js/wizard.js',
    
    // QR Code modules
    'resources/js/qrcode/qrcode-helpers.js',
    'resources/js/qrcode/qrcode-generator.js',
    'resources/js/qrcode/qrcode-wizard.js',
    'resources/js/qrcode/qrcode-handlers.js'
];

async function buildJavaScript() {
    try {
        console.log('🚀 Building JavaScript bundle...');
        
        // Ensure build directory exists
        const buildDir = path.join(__dirname, '..', 'build');
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }
        
        // Read and concatenate all JS files in the correct order
        let concatenatedJS = '';
        
        for (const filePath of JS_FILES_ORDER) {
            const fullPath = path.join(__dirname, '..', filePath);
            
            if (fs.existsSync(fullPath)) {
                console.log(`📦 Adding: ${filePath}`);
                const content = fs.readFileSync(fullPath, 'utf8');
                concatenatedJS += `\n// === ${filePath} ===\n`;
                concatenatedJS += content;
                concatenatedJS += '\n';
            } else {
                console.warn(`⚠️  File not found: ${filePath}`);
            }
        }
        
        // Write the concatenated file to a temporary location
        const tempPath = path.join(buildDir, 'temp-bundle.js');
        fs.writeFileSync(tempPath, concatenatedJS);
        
        // Use esbuild to minify and optimize
        const result = await esbuild.build({
            entryPoints: [tempPath],
            bundle: false, // We've already concatenated manually
            minify: true,
            sourcemap: true,
            target: ['es2017'], // Support modern browsers
            outfile: path.join(buildDir, 'app.min.js'),
            format: 'iife', // Immediately Invoked Function Expression for browser
            globalName: 'GrueneApp', // Global namespace
            banner: {
                js: `/*! Grüne Bildgenerator v1.0.0 | Built: ${new Date().toISOString()} */`
            },
            legalComments: 'none',
            drop: ['console', 'debugger'], // Remove console.log and debugger statements
            keepNames: false, // Allow name mangling for smaller size
            // Define global variables that should be preserved
            define: {
                'generatorApplicationURL': 'generatorApplicationURL'
            }
        });
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
        
        // Get file sizes
        const originalSize = Buffer.byteLength(concatenatedJS, 'utf8');
        const minifiedSize = fs.statSync(path.join(buildDir, 'app.min.js')).size;
        const compressionRatio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        
        console.log('✅ JavaScript bundle created successfully!');
        console.log(`📊 Original size: ${(originalSize / 1024).toFixed(1)} KB`);
        console.log(`📊 Minified size: ${(minifiedSize / 1024).toFixed(1)} KB`);
        console.log(`📊 Compression: ${compressionRatio}% smaller`);
        console.log(`📄 Output: build/app.min.js`);
        console.log(`🗺️  Source map: build/app.min.js.map`);
        
        return {
            success: true,
            originalSize,
            minifiedSize,
            compressionRatio
        };
        
    } catch (error) {
        console.error('❌ JavaScript build failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    buildJavaScript();
}

module.exports = { buildJavaScript, JS_FILES_ORDER };