# ==============================================================================
# LOCAL DEVELOPMENT COMMANDS
# ==============================================================================
# Main command for local development with auto-rebuild on file changes
dev: logo-json
	@node scripts/inject-build-timestamp.js
	@echo "🚀 Starting DEVELOPMENT server with auto-rebuild..."
	@echo "📁 Watching: resources/css/ and resources/js/"
	@echo "🌐 Server: http://localhost:8000"
	@echo "⏱️  Timestamp banner shows last build time"
	@echo ""
	@echo "📝 When files change:"
	@echo "   • CSS files → Auto-rebuild CSS + update timestamp"
	@echo "   • JS files  → Update timestamp + notification"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@echo ""
	@make -j3 _dev-server _dev-watch-css _dev-watch-js

_dev-server:
	@python3 -m http.server 8000

_dev-watch-css:
	@npm run watch:css

_dev-watch-js:
	@npm run watch:js

# ==============================================================================
# PRODUCTION COMMANDS (used by CI/CD)
# ==============================================================================
# Production server with embedded logo data
server: logo-json-embedded
	python3 -m http.server 8000

# Generate embedded HTML with logo data for production
logo-json-embedded: logo-json
	python3 embed_logos.py index.html index-production.html
	@echo "Production HTML with embedded logos created: index-production.html"
	@echo "For production, serve index-production.html instead of index.html"

logo-json:
	rm -fr resources/images/logos/index
	mkdir -p resources/images/logos/index
	ls resources/images/logos/gemeinden | grep -v "120" | sort | python3 logo_json.py > resources/images/logos/index/gemeinden-logos.json
	ls resources/images/logos/bundeslaender | grep -v "120" | sort | python3 logo_json.py > resources/images/logos/index/bundeslaender-logos.json
	ls resources/images/logos/domains | sort | grep -v "120" | python3 logo_json.py > resources/images/logos/index/domains-logos.json

# Build for production
build: logo-json
	npm run build
	@echo "✅ Production build complete in ./build/"

build-clean: clean
	npm run build:clean
	@echo "✅ Clean production build complete in ./build/"

# Development build (just JS/CSS bundling)
build-dev:
	npm run build:js
	npm run build:css
	@echo "✅ Development build complete"

# Serve production build
serve-build: build
	cd build && python3 -m http.server 8000

# Clean generated files
clean:
	rm -f index-production.html
	rm -fr resources/images/logos/index
	rm -fr build/
	rm -f resources/css/output.css

.PHONY: dev _dev-server _dev-watch-css _dev-watch-js server logo-json logo-json-embedded build build-clean build-dev serve-build clean