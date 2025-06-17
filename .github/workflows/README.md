# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the GRÜNE Bildgenerator project.

## Workflows

### 1. Test Suite (`test.yml`)
**Triggers:**
- Pushes to `develop` branch
- Pull requests targeting `main` branch

**Purpose:** Run comprehensive testing on feature branches and PRs before they can be merged.

**Actions:**
- ✅ Install dependencies
- ✅ Run unit and integration tests
- ✅ Generate coverage reports
- ✅ Build production CSS
- ✅ Verify build artifacts

### 2. Deploy to Production (`deploy.yml`)
**Triggers:**
- Pushes to `main` branch only

**Purpose:** Deploy to production after all tests pass.

**Workflow:**
1. **Test Job** - Runs the complete test suite first
2. **Deploy Job** - Only runs if tests pass (`needs: test`)

**Deploy Actions:**
- ✅ Run full test suite again (safety check)
- ✅ Build production assets
- 🚀 Deploy to GitHub Pages
- 🧹 Exclude development files from deployment

## Deployment Safety

The deployment workflow ensures safety through:

1. **Test Dependency** - Deploy job has `needs: test` dependency
2. **Branch Protection** - Only runs on `main` branch
3. **Test Gate** - All tests must pass before deployment starts
4. **Production Build** - Fresh build of all assets before deployment

## Branch Strategy

```
develop ──→ PR ──→ main ──→ production
   ↓         ↓       ↓
 tests    tests   deploy
```

- **`develop`** - Feature development with continuous testing
- **`main`** - Production-ready code that triggers deployment
- **PRs** - Gated by required test passage

## Configuration Notes

### GitHub Pages Deployment
- Deploys entire repository except development files
- Uses `peaceiris/actions-gh-pages@v3` action
- Excludes: `node_modules/`, `tests/`, `coverage/`, `.github/`, config files

### Custom Domain
Update the `cname` field in `deploy.yml` with your domain:
```yaml
cname: your-actual-domain.com
```

Or remove the line if using GitHub Pages default domain.

### Required Secrets
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- No additional secrets required for basic deployment

## Adding Branch Protection

To enforce test passage before merging to `main`:

1. Go to Settings → Branches
2. Add protection rule for `main` branch
3. Enable "Require status checks to pass"
4. Select "Test Suite" workflow
5. Enable "Require up-to-date branches"

This ensures no code reaches production without passing tests.