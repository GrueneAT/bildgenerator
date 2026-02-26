# External Integrations

**Analysis Date:** 2026-02-26

## APIs & External Services

**Not Applicable:**
- Application is purely client-side with no backend API calls
- No external service SDKs or API clients integrated
- All processing occurs in the browser (canvas manipulation, QR generation, image processing)

## Data Storage

**Databases:**
- Not used - Application is stateless client-side only

**File Storage:**
- Local filesystem only
- Logo assets bundled in repository: `resources/images/logos/`
  - Municipal logos: `resources/images/logos/gemeinden/`
  - State/federal logos: `resources/images/logos/bundeslaender/`
  - Domain-specific logos: `resources/images/logos/domains/`
- Generated logo indexes (JSON): `resources/images/logos/index/`
  - `gemeinden-logos.json`
  - `bundeslaender-logos.json`
  - `domains-logos.json`

**Caching:**
- Browser-based localStorage (optional, not explicitly implemented)
- Static asset caching via HTTP cache headers (GitHub Pages)
- No server-side caching

## Authentication & Identity

**Auth Provider:**
- Not required - Application is public, no user authentication
- No login system
- No user accounts or session management
- No API key management

## Monitoring & Observability

**Error Tracking:**
- Not integrated - Application has no error reporting service
- Client-side errors logged to browser console only
- No external error aggregation (Sentry, Bugsnag, etc.)

**Logs:**
- Browser console logging only
- No log aggregation service
- Development mode timestamp banner for build awareness

**Analytics:**
- Not integrated
- No user activity tracking
- No telemetry or usage analytics

## CI/CD & Deployment

**Hosting:**
- GitHub Pages (production)
  - Repository: `GrueneAT/gruene-bildgenerator`
  - Deployment URL: `https://bildgenerator.gruene.at` (via CNAME)
  - Static hosting with automatic deployment on main branch pushes

**CI Pipeline:**
- GitHub Actions (`.github/workflows/static.yml`)
- Jobs: Test → Visual Regression → E2E → Build → Deploy → Post-Validation → Commit Artifacts
- Automatic deployment to GitHub Pages on main branch only
- Manual trigger available for visual baseline updates
- Production artifacts committed to `production` branch after successful validation

**Actions Used:**
- `actions/checkout@v4` - Repository checkout
- `actions/setup-node@v4` - Node.js environment (v20)
- `actions/setup-python@v4` - Python environment (3.x)
- `codecov/codecov-action@v3` - Code coverage upload
- `actions/upload-artifact@v4` - Artifact storage
- `actions/download-artifact@v4` - Artifact retrieval
- `actions/configure-pages@v4` - GitHub Pages setup
- `actions/upload-pages-artifact@v3` - Pages artifact upload
- `actions/deploy-pages@v4` - Pages deployment

## Environment Configuration

**Required env vars:**
- None for application runtime
- CI environment variables used in GitHub Actions:
  - `CI=true` - Set for test runs to enable retries and parallel execution
  - `DEPLOY_URL` - Post-deployment validation target (set by workflow)
  - `EXPECTED_COMMIT` - Validation against expected git commit hash
  - `EXPECTED_VERSION` - Validation against expected version (hardcoded "1.0.0")
  - `GENERATE_REFERENCE=true` - Visual baseline generation trigger

**Secrets location:**
- GitHub Secrets (none currently required)
- `GITHUB_TOKEN` - Built-in GitHub Actions token (automatic)
- No custom secrets needed for application

## Webhooks & Callbacks

**Incoming:**
- GitHub push webhook triggers CI/CD pipeline
- GitHub pull request webhook triggers tests on branches
- Manual workflow dispatch trigger available

**Outgoing:**
- None - Application does not send webhooks or callbacks

## External Dependencies Summary

**Completely Isolated:**
- No external API dependencies
- No third-party service integrations
- No CDN dependencies (all assets self-hosted)
- No image processing services (local canvas operations only)

**GitHub Pages Integration:**
- Automatic deployment via Actions workflow
- Custom domain via CNAME: `bildgenerator.gruene.at`
- Build artifacts committed to `production` branch
- Robots.txt, .nojekyll, CNAME files copied to build output for GitHub Pages compatibility

## Email & Communication

**Support Contact:**
- Email link in UI: `florian.motlik@gruene.at`
- No automated email sending
- No notification systems

## Content Delivery

**Static Assets:**
- GitHub Pages (CDN-backed)
- All assets served from repository
- No external CDN configuration needed
- Asset caching handled by GitHub Pages HTTP headers

## Deployment Validation

**Post-Deployment Checks** (`scripts/validate-deployment.sh`):
- HTTP response validation (200 status)
- HTML content verification (title, heading, meta tags)
- Production asset bundle detection (app.min.css, app.min.js, vendors.min.js)
- Static asset availability checks
- Application functionality validation (logo index endpoint)
- Performance metrics collection
- Build metadata validation (timestamp, commit hash, version)
- Concurrent deployment protection (single deployment queued)

---

*Integration audit: 2026-02-26*
