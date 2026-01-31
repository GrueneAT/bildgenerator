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
    
    // Get build metadata
    const buildTimestamp = new Date().toISOString();
    const buildCommit = getBuildCommit();
    const buildVersion = getBuildVersion();
    
    // Replace vendor CSS and individual CSS files with bundled version
    html = html.replace(
        /<link rel="stylesheet" href="vendors\/fontawesome\/css\/all\.css"\s*\/?>[\s\S]*?<link rel="stylesheet"[\s\S]*?href="resources\/css\/style\.css\?v=[\d\.]+"\s*\/?>/g,
        '<link rel="stylesheet" href="app.min.css">'
    );
    
    // Replace vendor JavaScript files with bundled version
    const vendorReplacePattern = /<script src="vendors\/jquery\/jquery-3\.7\.1\.min\.js"><\/script>[\s\S]*?<script src="vendors\/qrcode\.min\.js"><\/script>/g;
    html = html.replace(vendorReplacePattern, 
        '<!-- jQuery loaded separately -->\n    <script src="jquery.min.js"></script>\n    \n    <!-- Bundled vendor libraries -->\n    <script src="vendors.min.js"></script>');
    
    // Replace individual application JavaScript files with bundled version
    const jsReplacePattern = /<!-- Core utilities - must load first -->[\s\S]*?<script src="resources\/js\/qrcode\/qrcode-handlers\.js"><\/script>/g;
    html = html.replace(jsReplacePattern, '<!-- Application bundle -->\n    <script src="app.min.js"></script>');
    
    // Add build metadata to head
    html = html.replace(
        /<title>([^<]+)<\/title>/,
        `<title>$1</title>\n    <!-- Build Metadata -->\n    <meta name="build-timestamp" content="${buildTimestamp}">\n    <meta name="build-commit" content="${buildCommit}">\n    <meta name="build-version" content="${buildVersion}">\n    <!-- Built: ${buildTimestamp} -->`
    );
    
    // Add cache busting with build timestamp
    const timestamp = Date.now();
    html = html.replace(/app\.min\.css/g, `app.min.css?v=${timestamp}`);
    html = html.replace(/app\.min\.js/g, `app.min.js?v=${timestamp}`);
    html = html.replace(/vendors\.min\.js/g, `vendors.min.js?v=${timestamp}`);
    html = html.replace(/jquery\.min\.js/g, `jquery.min.js?v=${timestamp}`);
    
    fs.writeFileSync(outputPath, html);
}

function getBuildCommit() {
    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
        console.warn('⚠️  Could not get git commit hash:', error.message);
        return 'unknown';
    }
}

function getBuildVersion() {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        return packageJson.version;
    } catch (error) {
        console.warn('⚠️  Could not get package version:', error.message);
        return 'unknown';
    }
}

async function copyAssets() {
    const buildDir = path.join(__dirname, '..', 'build');
    const rootDir = path.join(__dirname, '..');

    // Copy vendor directories that need to be preserved (CSS/fonts only)
    const vendorDirs = [
        'vendors/fontawesome'
    ];

    const vendorDir = path.join(buildDir, 'vendors');
    if (!fs.existsSync(vendorDir)) {
        fs.mkdirSync(vendorDir, { recursive: true });
    }

    // Copy vendor directories (FontAwesome CSS and fonts)
    for (const dir of vendorDirs) {
        const srcPath = path.join(__dirname, '..', dir);
        const destPath = path.join(buildDir, dir);

        if (fs.existsSync(srcPath)) {
            execSync(`cp -r "${srcPath}" "${path.dirname(destPath)}/"`, { cwd: path.join(__dirname, '..') });
            console.log(`   📋 Copied: ${dir}/`);
        }
    }

    console.log('   ✅ Vendor JavaScript libraries are now bundled in vendors.min.js and jquery.min.js');

    // Copy resources directory (fonts, images, etc.)
    const resourcesDir = path.join(buildDir, 'resources');
    execSync(`cp -r resources/ "${resourcesDir}/"`, { cwd: path.join(__dirname, '..') });
    console.log('   📋 Copied: resources/');

    // Copy root-level files needed for GitHub Pages deployment
    const rootFiles = ['robots.txt', '.nojekyll', 'CNAME'];
    for (const file of rootFiles) {
        const srcPath = path.join(rootDir, file);
        const destPath = path.join(buildDir, file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`   📋 Copied: ${file}`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    build();
}

module.exports = { build };