#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');

// Define vendor CSS files to bundle first
const VENDOR_CSS_FILES = [
    'vendors/fontawesome/css/all.css'
];

// Define the CSS files to bundle in order
const CSS_FILES_ORDER = [
    ...VENDOR_CSS_FILES,          // Vendor CSS files first
    'resources/css/fonts.css',     // Custom fonts
    'resources/css/output.css',    // Tailwind CSS (needs to be built first)
    'resources/css/style.css'      // Custom styles last
];

async function buildCSS() {
    try {
        console.log('🎨 Building CSS bundle...');
        
        // Ensure build directory exists
        const buildDir = path.join(__dirname, '..', 'build');
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }
        
        // Read and concatenate all CSS files
        let concatenatedCSS = '';
        
        for (const filePath of CSS_FILES_ORDER) {
            const fullPath = path.join(__dirname, '..', filePath);
            
            if (fs.existsSync(fullPath)) {
                console.log(`📦 Adding: ${filePath}`);
                let content = fs.readFileSync(fullPath, 'utf8');
                
                // Fix font URLs for bundled CSS
                if (filePath === 'resources/css/fonts.css') {
                    content = content.replace(/url\("\.\.\/fonts\//g, 'url("resources/fonts/');
                } else if (filePath === 'vendors/fontawesome/css/all.css') {
                    // Fix FontAwesome webfont URLs for bundled CSS
                    content = content.replace(/url\("\.\.\/webfonts\//g, 'url("vendors/fontawesome/webfonts/');
                    content = content.replace(/url\('\.\.\/webfonts\//g, 'url(\'vendors/fontawesome/webfonts/');
                }
                
                concatenatedCSS += `\n/* === ${filePath} === */\n`;
                concatenatedCSS += content;
                concatenatedCSS += '\n';
            } else {
                console.warn(`⚠️  File not found: ${filePath}`);
            }
        }
        
        // Add build banner
        const banner = `/*! Grüne Bildgenerator Styles v1.0.0 | Built: ${new Date().toISOString()} */\n`;
        concatenatedCSS = banner + concatenatedCSS;
        
        // Process with PostCSS and cssnano for optimization
        const result = await postcss([
            cssnano({
                preset: ['default', {
                    discardComments: {
                        removeAll: true
                    },
                    normalizeWhitespace: true,
                    minifySelectors: true,
                    minifyParams: true,
                    minifyFontValues: true,
                    convertValues: true,
                    mergeRules: true,
                    mergeLonghand: true,
                    uniqueSelectors: true,
                    reduceIdents: false, // Keep animation names readable
                    zindex: false // Don't optimize z-index values
                }]
            })
        ]).process(concatenatedCSS, {
            from: undefined,
            to: path.join(buildDir, 'app.min.css'),
            map: { inline: false }
        });
        
        // Write minified CSS
        fs.writeFileSync(path.join(buildDir, 'app.min.css'), result.css);
        
        // Write source map if generated
        if (result.map) {
            fs.writeFileSync(path.join(buildDir, 'app.min.css.map'), result.map.toString());
        }
        
        // Get file sizes
        const originalSize = Buffer.byteLength(concatenatedCSS, 'utf8');
        const minifiedSize = Buffer.byteLength(result.css, 'utf8');
        const compressionRatio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        
        console.log('✅ CSS bundle created successfully!');
        console.log(`📊 Original size: ${(originalSize / 1024).toFixed(1)} KB`);
        console.log(`📊 Minified size: ${(minifiedSize / 1024).toFixed(1)} KB`);
        console.log(`📊 Compression: ${compressionRatio}% smaller`);
        console.log(`📄 Output: build/app.min.css`);
        
        if (result.map) {
            console.log(`🗺️  Source map: build/app.min.css.map`);
        }
        
        return {
            success: true,
            originalSize,
            minifiedSize,
            compressionRatio
        };
        
    } catch (error) {
        console.error('❌ CSS build failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    buildCSS();
}

module.exports = { buildCSS, CSS_FILES_ORDER, VENDOR_CSS_FILES };