#!/bin/bash

# Generate Reference Images for Visual Regression Tests
# This script generates all reference images needed for visual regression testing

set -e

echo "🎨 GRÜNE Image Generator - Visual Regression Reference Generation"
echo "================================================================="

# Check if playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not installed. Please install Node.js and npm."
    exit 1
fi

# Check if make is available
if ! command -v make &> /dev/null; then
    echo "❌ Error: make is not installed."
    exit 1
fi

# Ensure logo JSON files are generated
echo "📋 Generating logo JSON files..."
make logo-json

# Create reference images directory
mkdir -p visual-regression/reference-images
mkdir -p visual-regression/comparison-results

echo "🖼️  Generating reference images..."
echo "This will take several minutes as each test needs to run and capture screenshots."
echo ""

# Set environment variable for reference generation
export GENERATE_REFERENCE=true

# Generate reference images for each test category
test_files=(
    "visual-regression/tests/core-functionality.spec.js"
    "visual-regression/tests/templates.spec.js"
    "visual-regression/tests/text-system.spec.js"
    "visual-regression/tests/background-images.spec.js"
    "visual-regression/tests/elements.spec.js"
    "visual-regression/tests/qr-codes.spec.js"
    "visual-regression/tests/layouts.spec.js"
    "visual-regression/tests/wizard-navigation.spec.js"
    "visual-regression/tests/error-handling.spec.js"
    "visual-regression/tests/positioning.spec.js"
)

total_files=${#test_files[@]}
current_file=0

for test_file in "${test_files[@]}"; do
    current_file=$((current_file + 1))
    echo "[$current_file/$total_files] Processing: $(basename "$test_file")"
    
    if npx playwright test "$test_file" --quiet; then
        echo "  ✅ Reference images generated successfully"
    else
        echo "  ⚠️  Some tests may have failed - check output above"
    fi
    echo ""
done

# Count generated reference images
reference_count=$(find visual-regression/reference-images -name "*.png" 2>/dev/null | wc -l || echo "0")

echo "🎉 Reference image generation complete!"
echo "📊 Generated $reference_count reference images"
echo ""
echo "📁 Reference images saved to: visual-regression/reference-images/"
echo ""
echo "Next steps:"
echo "1. Review the generated reference images to ensure they look correct"
echo "2. Run the full test suite: npx playwright test visual-regression/"
echo "3. If tests fail, compare diff images in visual-regression/comparison-results/"
echo ""
echo "💡 To update specific reference images later:"
echo "   GENERATE_REFERENCE=true npx playwright test visual-regression/tests/SPECIFIC_TEST.spec.js"