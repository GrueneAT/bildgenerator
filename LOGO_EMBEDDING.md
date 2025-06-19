# Logo Embedding System

This project includes an automated system to embed logo JSON data directly into HTML files for faster loading.

## How It Works

Instead of making a separate AJAX request to load `resources/images/logos/index.json`, the logo data is embedded directly into the HTML file as JavaScript, eliminating one HTTP request and improving page load performance.

## Build Commands

### Production Build (Recommended)
```bash
make server
# or explicitly:
make logo-json-embedded
```
This creates `index-production.html` with embedded logo data and starts the server.

### Development Build
```bash
make server-dev
```
Uses the original `index.html` with separate JSON loading for easier development.

### Generate Only
```bash
make logo-json-embedded
```
Generates `index-production.html` without starting the server.

### Clean
```bash
make clean
```
Removes generated files.

## Files

- `embed_logos.py` - Script that embeds JSON data into HTML
- `index.html` - Original HTML file (for development)
- `index-production.html` - Generated HTML with embedded logos (for production)
- `resources/images/logos/index.json` - Logo data source

## Performance Benefits

- **Eliminates 1 HTTP request** - Logo data loads with the page
- **Faster initialization** - Logo dropdown populates immediately
- **Better caching** - Logo data cached with main page
- **Reduced server load** - One less file to serve

## Technical Details

The system works by:

1. Reading `resources/images/logos/index.json`
2. Embedding it as `window.EMBEDDED_LOGO_DATA` in the HTML
3. JavaScript checks for embedded data first, falls back to AJAX if not found
4. Maintains full backward compatibility with existing code

## File Size Impact

Typical impact: +5-6KB to HTML file size (logo JSON is ~5KB)
This is offset by eliminating the separate HTTP request.