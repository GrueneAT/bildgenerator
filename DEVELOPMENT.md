# Development Guide

## Quick Start for Local Development

### Main Command (Recommended)
```bash
make dev
```

This starts the development server with:
- ✅ Auto-rebuild on CSS file changes
- ✅ File change notifications for JS
- ✅ Development timestamp banner showing last reload
- ✅ HTTP server on http://localhost:8000

**What happens when you save files:**
- **CSS files** (`resources/css/`) → Auto-rebuild → Refresh browser to see changes
- **JS files** (`resources/js/`) → Console notification → Refresh browser to see changes

### Other Commands

| Command | Purpose | Use Case |
|---------|---------|----------|
| `make dev` | **Development server with auto-rebuild** | Active development (recommended) |
| `make server` | Production server with embedded logos | Testing production build locally |
| `make build` | Build production bundle | Create optimized production files |
| `make clean` | Clean generated files | Fresh start |

## Development Workflow

1. **Start development server:**
   ```bash
   make dev
   ```

2. **Edit files:**
   - Open http://localhost:8000 in your browser
   - Edit CSS/JS files in `resources/`
   - Watch console for rebuild notifications

3. **See changes:**
   - CSS changes: Wait for rebuild, refresh browser
   - JS changes: Refresh browser (no rebuild needed in dev mode)
   - Timestamp banner shows when page was last loaded

4. **Stop server:**
   - Press `Ctrl+C`

## File Organization

```
resources/
├── css/
│   ├── input.css       # Tailwind source (don't edit output.css)
│   ├── output.css      # Auto-generated (watched by dev server)
│   ├── style.css       # Custom styles
│   └── fonts.css       # Font definitions
├── js/
│   ├── main.js         # Main application
│   ├── canvas-utils.js # Canvas utilities (snapping, rotation, etc.)
│   ├── constants.js    # Configuration constants
│   └── ...             # Other modules
└── images/
    └── logos/          # Logo assets
```

## Development Features

### Build Timestamp Banner
- Shows in yellow banner at top of page
- Only visible on localhost/127.0.0.1
- **Shows when files were last built/changed**, not when page was loaded
- Updates automatically when CSS or JS files change
- Helps verify that changes have been properly propagated
- Automatically hidden in production

**How it works:**
- Initial timestamp injected when you run `make dev`
- CSS file changes → Rebuild CSS → Update timestamp
- JS file changes → Update timestamp → Show notification
- Simply refresh browser to see the updated build time

### File Watching
- CSS changes detected automatically
- JS changes show console notification
- Both require browser refresh to see changes

### Auto-Rebuild
- CSS is minified on each change
- Fast rebuild (~1-2 seconds)
- No manual build step needed during development

## CI/CD Integration

The CI/CD pipeline uses different commands:
- `make logo-json` - Generate logo index files
- `make build` - Create production bundle
- `npm run build` - Build JS/CSS bundles

The `make dev` command is **NOT** used in CI/CD - it's for local development only.

## Troubleshooting

**Port 8000 already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Then restart
make dev
```

**CSS changes not showing:**
- Wait for rebuild to complete (watch console)
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check that `resources/css/output.css` was updated

**JS changes not showing:**
- Browser cache issue - hard refresh
- Check browser console for errors
- Verify file was saved correctly

## Testing

```bash
# Run all tests
npm test

# Run visual regression tests
npm run test:visual

# Run specific test
npm run test:visual-positioning
```

See `package.json` for all available test commands.
