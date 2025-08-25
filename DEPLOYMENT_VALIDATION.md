# Deployment Validation

This document describes the post-deployment validation system for the GRÜNE Bildgenerator application.

## Overview

The deployment validation system ensures that the deployed application is functional and matches the expected build artifacts. It runs automatically after successful deployments to GitHub Pages and can also be executed manually for testing.

## Validation Components

### 1. Build Metadata Injection

The build process (`scripts/build.js`) automatically injects metadata into the production HTML:

- **Build Timestamp**: When the build was created (ISO 8601 format)
- **Build Commit**: Git commit hash of the deployed version
- **Build Version**: Package.json version number

Example metadata in production HTML:
```html
<meta name="build-timestamp" content="2024-01-15T10:30:45.123Z">
<meta name="build-commit" content="abc123def456...">
<meta name="build-version" content="1.0.0">
```

### 2. Validation Script

The main validation script (`scripts/validate-deployment.sh`) performs comprehensive checks:

#### HTTP Response Validation
- ✅ Main page returns 200 status code
- ✅ Static assets (CSS, JS, images) are accessible
- ✅ Response times are reasonable
- ✅ Content-type headers are correct

#### Content Validation
- ✅ HTML structure contains expected elements
- ✅ Application title and branding are present
- ✅ Essential meta tags are included
- ✅ Production vs development build detection

#### Build Metadata Validation
- ✅ Build timestamp is present and recent
- ✅ Git commit hash format is valid
- ✅ Version matches expected values
- ✅ Build age reporting (warns if > 24 hours old)

#### Application Functionality
- ✅ Logo JSON endpoints are accessible
- ✅ Core application files are present
- ✅ No critical JavaScript errors

### 3. CI/CD Integration

The validation runs automatically in GitHub Actions:

1. **Trigger**: After successful deployment to GitHub Pages
2. **Dependencies**: Requires build and deployment jobs to complete
3. **Environment Variables**:
   - `DEPLOY_URL`: GitHub Pages URL
   - `EXPECTED_COMMIT`: Expected git commit hash
   - `EXPECTED_VERSION`: Expected version number
4. **Timeout**: 10 minutes maximum
5. **Failure Handling**: Blocks production branch commits if validation fails

## Usage

### Automatic Validation (CI/CD)

Validation runs automatically when code is pushed to the `main` branch:

```bash
git push origin main
# GitHub Actions will:
# 1. Run tests
# 2. Build the application  
# 3. Deploy to GitHub Pages
# 4. Run post-deployment validation
# 5. Commit to production branch (if validation passes)
```

### Manual Validation

You can run validation manually against any deployed version:

```bash
# Validate production deployment
npm run validate:deployment

# Validate custom URL
DEPLOY_URL="https://example.com" ./scripts/validate-deployment.sh

# Validate with expected commit/version
DEPLOY_URL="https://example.com" \
EXPECTED_COMMIT="abc123def456..." \
EXPECTED_VERSION="1.0.0" \
./scripts/validate-deployment.sh
```

### Local Testing

To test the validation script against a local build:

```bash
# Start local server
npm run serve:build

# In another terminal, validate local deployment
DEPLOY_URL="http://localhost:8000" ./scripts/validate-deployment.sh
```

## Configuration

### Environment Variables

- `DEPLOY_URL`: Target URL to validate (default: https://bildgenerator.gruene.at)
- `EXPECTED_COMMIT`: Expected git commit hash (optional)
- `EXPECTED_VERSION`: Expected version number (optional)
- `MAX_RETRIES`: Maximum retry attempts for deployment availability (default: 5)
- `RETRY_DELAY`: Seconds between retries (default: 10)
- `TIMEOUT`: HTTP request timeout in seconds (default: 30)

### Customization

The validation script can be customized by modifying:

- **Asset URLs**: Update the `assets` array in `validate_static_assets()`
- **Content Checks**: Modify validation rules in `validate_html_content()`
- **Performance Thresholds**: Adjust timing limits in `validate_performance()`
- **Metadata Requirements**: Update build metadata checks in `validate_build_metadata()`

## Troubleshooting

### Common Issues

1. **Deployment Propagation Delays**
   - Solution: The script waits 30 seconds for propagation
   - Manual fix: Increase `RETRY_DELAY` or `MAX_RETRIES`

2. **Build Metadata Missing**
   - Cause: Using development build instead of production
   - Solution: Ensure `npm run build` was executed

3. **Asset Loading Failures**
   - Cause: Incorrect asset paths or CDN issues
   - Solution: Check network connectivity and asset URLs

4. **Version Mismatches**
   - Cause: Cached deployment or incorrect expected values
   - Solution: Verify expected values and clear CDN cache

### Logs and Debugging

The validation script provides detailed logging:

- 🔵 Info messages (general progress)
- ✅ Success messages (passed validations)
- ⚠️ Warning messages (non-critical issues)
- ❌ Error messages (validation failures)

Enable verbose debugging by modifying the script's logging functions or adding additional checks as needed.

## Security Considerations

- The validation script only performs read-only operations
- No sensitive data is exposed in build metadata
- All HTTP requests have reasonable timeouts
- Script validates against known-safe URLs only

## Performance Impact

The validation adds minimal overhead to the deployment process:

- **Duration**: Typically 1-3 minutes
- **Network**: Minimal bandwidth usage (fetches only essential assets)
- **Resources**: Runs on GitHub Actions infrastructure
- **Blocking**: Only blocks production branch commits, not main deployment