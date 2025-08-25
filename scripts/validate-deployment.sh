#!/bin/bash

# Post-deployment validation script for GRÜNE Bildgenerator
# Validates that the deployed application is functional and correct

set -e

# Configuration
DEPLOY_URL="${DEPLOY_URL:-https://bildgenerator.gruene.at}"
MAX_RETRIES=5
RETRY_DELAY=10
TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Wait for deployment to propagate
wait_for_deployment() {
    log_info "Waiting for deployment to propagate..."
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Attempt $attempt/$MAX_RETRIES: Checking deployment availability..."
        
        if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$DEPLOY_URL" | grep -q "200"; then
            log_success "Deployment is available!"
            return 0
        fi
        
        log_warning "Deployment not ready yet, waiting ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
        ((attempt++))
    done
    
    log_error "Deployment failed to become available after $MAX_RETRIES attempts"
    return 1
}

# Validate HTTP response
validate_http_response() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    log_info "Validating $description: $url"
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}:%{content_type}:%{time_total}" --max-time $TIMEOUT "$url")
    
    local status_code=$(echo "$response" | cut -d: -f1)
    local content_type=$(echo "$response" | cut -d: -f2)
    local response_time=$(echo "$response" | cut -d: -f3)
    
    if [ "$status_code" != "$expected_status" ]; then
        log_error "$description failed: Expected $expected_status, got $status_code"
        return 1
    fi
    
    log_success "$description: $status_code (${content_type}, ${response_time}s)"
    return 0
}

# Validate HTML content
validate_html_content() {
    log_info "Validating HTML content and structure..."
    
    local html_content
    html_content=$(curl -s --max-time $TIMEOUT "$DEPLOY_URL")
    
    # Check for expected title
    if ! echo "$html_content" | grep -q "<title>Grüne Bilder</title>"; then
        log_error "HTML validation failed: Expected title not found"
        return 1
    fi
    
    # Check for main application container
    if ! echo "$html_content" | grep -q "Grüner Bildgenerator"; then
        log_error "HTML validation failed: Main heading not found"
        return 1
    fi
    
    # Check for essential meta tags
    if ! echo "$html_content" | grep -q 'name="viewport"'; then
        log_error "HTML validation failed: Viewport meta tag missing"
        return 1
    fi
    
    # Check for production CSS bundle
    if ! echo "$html_content" | grep -q "app.min.css"; then
        log_error "HTML validation failed: Production CSS bundle (app.min.css) not found"
        return 1
    fi
    log_success "Production CSS bundle detected"
    
    # Check for production JavaScript bundles
    if ! echo "$html_content" | grep -q "app.min.js"; then
        log_error "HTML validation failed: Production JS bundle (app.min.js) not found"
        return 1
    fi
    
    if ! echo "$html_content" | grep -q "vendors.min.js"; then
        log_error "HTML validation failed: Vendor JS bundle (vendors.min.js) not found"
        return 1
    fi
    
    log_success "Production build detected with all required bundles"
    
    # Validate build metadata
    validate_build_metadata "$html_content"
    
    log_success "HTML content validation passed"
    return 0
}

# Validate build metadata
validate_build_metadata() {
    local html_content="$1"
    
    log_info "Validating build metadata..."
    
    # Extract build metadata
    local build_timestamp
    build_timestamp=$(echo "$html_content" | grep -o 'name="build-timestamp" content="[^"]*"' | sed 's/.*content="\([^"]*\)".*/\1/')
    
    local build_commit
    build_commit=$(echo "$html_content" | grep -o 'name="build-commit" content="[^"]*"' | sed 's/.*content="\([^"]*\)".*/\1/')
    
    local build_version
    build_version=$(echo "$html_content" | grep -o 'name="build-version" content="[^"]*"' | sed 's/.*content="\([^"]*\)".*/\1/')
    
    # Validate metadata exists
    if [ -z "$build_timestamp" ]; then
        log_warning "Build timestamp not found in HTML metadata"
    else
        log_success "Build timestamp: $build_timestamp"
        
        # Check if build is recent (within last 24 hours)
        if command -v date >/dev/null 2>&1; then
            local build_epoch
            build_epoch=$(date -d "$build_timestamp" +%s 2>/dev/null || echo "0")
            local current_epoch
            current_epoch=$(date +%s)
            local age_hours=$(( (current_epoch - build_epoch) / 3600 ))
            
            if [ "$build_epoch" -gt 0 ] && [ "$age_hours" -lt 24 ]; then
                log_success "Build age: ${age_hours} hours (fresh build)"
            elif [ "$build_epoch" -gt 0 ]; then
                log_warning "Build age: ${age_hours} hours (older build)"
            fi
        fi
    fi
    
    if [ -z "$build_commit" ] || [ "$build_commit" = "unknown" ]; then
        log_warning "Build commit not found in HTML metadata"
    else
        local short_commit="${build_commit:0:8}"
        log_success "Build commit: $short_commit"
        
        # Validate commit format (should be 40 character hash)
        if [ ${#build_commit} -eq 40 ] && echo "$build_commit" | grep -q "^[a-f0-9]*$"; then
            log_success "Commit hash format: valid"
        else
            log_warning "Commit hash format: invalid"
        fi
    fi
    
    if [ -z "$build_version" ] || [ "$build_version" = "unknown" ]; then
        log_warning "Build version not found in HTML metadata"
    else
        log_success "Build version: $build_version"
    fi
    
    # Validate against expected values if provided
    if [ -n "$EXPECTED_COMMIT" ] && [ "$build_commit" != "$EXPECTED_COMMIT" ]; then
        log_error "Build commit mismatch: expected $EXPECTED_COMMIT, got $build_commit"
        return 1
    fi
    
    if [ -n "$EXPECTED_VERSION" ] && [ "$build_version" != "$EXPECTED_VERSION" ]; then
        log_error "Build version mismatch: expected $EXPECTED_VERSION, got $build_version"
        return 1
    fi
    
    log_success "Build metadata validation completed"
    return 0
}

# Validate static assets
validate_static_assets() {
    log_info "Validating production static assets..."
    
    local assets=(
        "app.min.css:text/css:Production CSS Bundle"
        "app.min.js:application/javascript:Production JS Bundle"
        "vendors.min.js:application/javascript:Vendor JS Bundle"
        "jquery.min.js:application/javascript:jQuery Library"
        "resources/images/gruene-logo.svg:image/svg+xml:Logo SVG"
        "vendors/fontawesome/css/all.css:text/css:FontAwesome CSS"
    )
    
    local failed=0
    for asset_info in "${assets[@]}"; do
        IFS=':' read -r asset_path expected_type description <<< "$asset_info"
        
        local asset_url="$DEPLOY_URL/$asset_path"
        local response
        response=$(curl -s -o /dev/null -w "%{http_code}:%{content_type}" --max-time $TIMEOUT "$asset_url")
        
        local status_code=$(echo "$response" | cut -d: -f1)
        local content_type=$(echo "$response" | cut -d: -f2)
        
        if [ "$status_code" != "200" ]; then
            log_error "$description failed: $status_code"
            ((failed++))
            continue
        fi
        
        # Flexible content type checking
        if [[ "$content_type" != *"$expected_type"* ]] && [[ "$content_type" != "text/plain" ]]; then
            log_warning "$description: Unexpected content-type '$content_type' (expected '$expected_type')"
        fi
        
        log_success "$description: $status_code"
    done
    
    if [ $failed -gt 0 ]; then
        log_error "Static asset validation failed: $failed assets failed"
        return 1
    fi
    
    log_success "Static asset validation passed"
    return 0
}

# Validate application functionality
validate_application_functionality() {
    log_info "Validating application functionality..."
    
    # Test main logo index (required for the app to work)
    local endpoint="resources/images/logos/index.json"
    local endpoint_url="$DEPLOY_URL/$endpoint"
    local response
    response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$endpoint_url")
    
    local status_code=${response: -3}
    local json_content=${response%???}
    
    if [ "$status_code" != "200" ]; then
        log_error "Logo index endpoint failed: $status_code"
        log_error "Application cannot function without logo index"
        return 1
    fi
    
    # Validate JSON structure - should contain category arrays
    local categories_found=0
    if echo "$json_content" | grep -q '"Bundesländer"'; then
        ((categories_found++))
    fi
    if echo "$json_content" | grep -q '"Gemeinden"'; then
        ((categories_found++))
    fi
    if echo "$json_content" | grep -q '"Bezirke"'; then
        ((categories_found++))
    fi
    
    if [ "$categories_found" -gt 0 ]; then
        log_success "Logo index: $status_code ($categories_found categories found)"
    else
        log_warning "Logo index: $status_code (no standard categories found)"
    fi
    
    # Test a sample logo file if any logos are listed
    local first_logo
    first_logo=$(echo "$json_content" | grep -o '"[^"]*\.(png\|jpg\|jpeg\|svg)"' | head -1 | tr -d '"')
    
    if [ -n "$first_logo" ]; then
        local logo_url="$DEPLOY_URL/resources/images/logos/$first_logo"
        local logo_status
        logo_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$logo_url")
        
        if [ "$logo_status" = "200" ]; then
            log_success "Sample logo file accessible: $logo_status"
        else
            log_warning "Sample logo file failed: $logo_status ($first_logo)"
        fi
    else
        log_info "No logo files found in index to test"
    fi
    
    log_success "Application functionality validation completed"
    return 0
}

# Validate performance metrics
validate_performance() {
    log_info "Validating performance metrics..."
    
    # Test main page load time
    local load_time
    load_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$DEPLOY_URL")
    
    # Convert to milliseconds for easier comparison (without bc dependency)
    local load_time_ms
    if command -v bc >/dev/null 2>&1; then
        load_time_ms=$(echo "$load_time * 1000" | bc -l)
        load_time_ms=${load_time_ms%.*}  # Remove decimal places
    else
        # Fallback calculation using awk
        load_time_ms=$(awk "BEGIN {printf \"%.0f\", $load_time * 1000}")
    fi
    
    if [ "$load_time_ms" -gt 5000 ]; then
        log_warning "Page load time is slow: ${load_time}s (${load_time_ms}ms)"
    else
        log_success "Page load time: ${load_time}s (${load_time_ms}ms)"
    fi
    
    # Test asset sizes (if production build)
    if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$DEPLOY_URL/app.min.css" | grep -q "200"; then
        local css_size
        css_size=$(curl -s --max-time $TIMEOUT "$DEPLOY_URL/app.min.css" | wc -c)
        log_info "Production CSS bundle size: $css_size bytes"
        
        local js_size
        js_size=$(curl -s --max-time $TIMEOUT "$DEPLOY_URL/app.min.js" | wc -c)
        log_info "Production JS bundle size: $js_size bytes"
    fi
    
    return 0
}

# Main validation function
main() {
    log_info "Starting post-deployment validation for: $DEPLOY_URL"
    log_info "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    
    local failed=0
    
    # Wait for deployment
    if ! wait_for_deployment; then
        exit 1
    fi
    
    # Run validation tests
    validate_http_response "$DEPLOY_URL" "200" "Main page" || ((failed++))
    validate_html_content || ((failed++))
    validate_static_assets || ((failed++))
    validate_application_functionality || ((failed++))
    validate_performance
    
    # Summary
    echo
    if [ $failed -eq 0 ]; then
        log_success "🎉 All deployment validation tests passed!"
        log_info "Application is successfully deployed and functional"
        exit 0
    else
        log_error "💥 Deployment validation failed: $failed test(s) failed"
        log_error "Please check the deployment and try again"
        exit 1
    fi
}

# Run main function
main "$@"