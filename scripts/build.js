#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { buildJavaScript } = require('./build-js');
const { buildCSS } = require('./build-css');

async function build() {
    console.log('🏗️  Starting build process...\n');
    
    const startTime = Date.now();
    
    try {
        // Step 1: Build Tailwind CSS first (dependency for CSS bundle)
        console.log('📝 Building Tailwind CSS...');
        execSync('npm run build-css-prod', { stdio: 'inherit' });
        console.log('✅ Tailwind CSS built\n');
        
        // Step 2: Build CSS bundle
        console.log('🎨 Building CSS bundle...');
        const cssResult = await buildCSS();
        console.log('');
        
        // Step 3: Build JavaScript bundle
        console.log('📦 Building JavaScript bundle...');
        const jsResult = await buildJS();
        console.log('');
        
        // Step 4: Create production HTML
        console.log('📄 Creating production HTML...');
        await createProductionHTML();
        console.log('✅ Production HTML created\n');
        
        // Step 5: Copy assets
        console.log('📂 Copying assets...');
        await copyAssets();
        console.log('✅ Assets copied\n');
        
        // Build summary
        const endTime = Date.now();
        const buildTime = ((endTime - startTime) / 1000).toFixed(1);
        
        console.log('🎉 Build completed successfully!');
        console.log(`⏱️  Total build time: ${buildTime}s`);
        console.log('📊 Build summary:');
        console.log(`   CSS: ${(cssResult.originalSize / 1024).toFixed(1)} KB → ${(cssResult.minifiedSize / 1024).toFixed(1)} KB (${cssResult.compressionRatio}% smaller)`);
        console.log(`   JS:  ${(jsResult.originalSize / 1024).toFixed(1)} KB → ${(jsResult.minifiedSize / 1024).toFixed(1)} KB (${jsResult.compressionRatio}% smaller)`);
        console.log('\n🚀 Ready for production!');
        console.log('📁 Output directory: ./build/');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

async function buildJS() {
    return await buildJavaScript();
}

async function createProductionHTML() {
    const templatePath = path.join(__dirname, '..', 'index.html');
    const outputPath = path.join(__dirname, '..', 'build', 'index.html');
    
    let html = fs.readFileSync(templatePath, 'utf8');
    
    // Replace individual CSS files with bundled version
    html = html.replace(
        /<link rel="stylesheet" href="resources\/css\/output\.css\?v=[\d\.]+"\s*\/?>[\s\S]*?<link rel="stylesheet"[\s\S]*?href="resources\/css\/style\.css\?v=[\d\.]+"\s*\/?>/g,
        '<link rel="stylesheet" href="app.min.css">'
    );
    
    // Replace individual JavaScript files with bundled version
    const jsReplacePattern = /<!-- Core utilities - must load first -->[\s\S]*?<script src="resources\/js\/qrcode\/qrcode-handlers\.js"><\/script>/g;
    html = html.replace(jsReplacePattern, '<script src="app.min.js"></script>');
    
    // Update title and add build info
    html = html.replace(
        /<title>([^<]+)<\/title>/,
        `<title>$1</title>\n    <!-- Built: ${new Date().toISOString()} -->`
    );
    
    // Add cache busting with build timestamp
    const timestamp = Date.now();
    html = html.replace(/app\.min\.css/g, `app.min.css?v=${timestamp}`);
    html = html.replace(/app\.min\.js/g, `app.min.js?v=${timestamp}`);
    
    fs.writeFileSync(outputPath, html);
}

async function copyAssets() {
    const buildDir = path.join(__dirname, '..', 'build');
    
    // Copy vendor dependencies that are still needed
    const vendorFiles = [
        'vendors/jquery/jquery-3.7.1.min.js',
        'vendors/mustache/mustache.js',
        'vendors/imagesloaded/imagesloaded.pkgd.min.js',
        'vendors/masonry/masonry.pkgd.min.js',
        'vendors/fabric-js/fabric.min.js',
        'vendors/fontfaceobserver/fontfaceobserver.standalone.js',
        'vendors/qrcode.min.js'
    ];
    
    // Copy vendor directories that need to be preserved
    const vendorDirs = [
        'vendors/fontawesome'
    ];
    
    const vendorDir = path.join(buildDir, 'vendors');
    if (!fs.existsSync(vendorDir)) {
        fs.mkdirSync(vendorDir, { recursive: true });
    }
    
    for (const file of vendorFiles) {
        const srcPath = path.join(__dirname, '..', file);
        const destPath = path.join(buildDir, file);
        
        if (fs.existsSync(srcPath)) {
            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.copyFileSync(srcPath, destPath);
            console.log(`   📋 Copied: ${file}`);
        }
    }
    
    // Copy vendor directories
    for (const dir of vendorDirs) {
        const srcPath = path.join(__dirname, '..', dir);
        const destPath = path.join(buildDir, dir);
        
        if (fs.existsSync(srcPath)) {
            execSync(`cp -r "${srcPath}" "${path.dirname(destPath)}/"`, { cwd: path.join(__dirname, '..') });
            console.log(`   📋 Copied: ${dir}/`);
        }
    }
    
    // Copy resources directory (fonts, images, etc.)
    const resourcesDir = path.join(buildDir, 'resources');
    execSync(`cp -r resources/ "${resourcesDir}/"`, { cwd: path.join(__dirname, '..') });
    console.log('   📋 Copied: resources/');
}

// Run if called directly
if (require.main === module) {
    build();
}

module.exports = { build };