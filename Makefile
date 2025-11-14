# ==============================================================================
# DOCKER DEVELOPMENT COMMANDS
# ==============================================================================
# Docker container configuration
DOCKER_IMAGE_NAME := gruene-bildgenerator-dev
DOCKER_CONTAINER_NAME := gruene-bildgenerator-container
DOCKER_PORT := 8000

# Build the Docker image from Dockerfile.claude
docker-build:
	@echo "🐳 Building Docker image from Dockerfile.claude..."
	docker build -f Dockerfile.claude -t $(DOCKER_IMAGE_NAME) .
	@echo "✅ Docker image built: $(DOCKER_IMAGE_NAME)"

# Run development server in Docker with live file watching
docker-dev: docker-build
	@echo "🐳 Starting development server in Docker container..."
	@echo "📁 Mounting current directory for live file changes"
	@echo "🌐 Server will be available at: http://localhost:$(DOCKER_PORT)"
	@echo "⚠️  Note: File changes are synced - browser reload required"
	@echo ""
	@echo "Press Ctrl+C to stop the container"
	@echo ""
	docker run --rm -it \
		--name $(DOCKER_CONTAINER_NAME) \
		-p $(DOCKER_PORT):8000 \
		-v "$$(pwd):/home/claudeuser/workspace" \
		-w /home/claudeuser/workspace \
		--entrypoint /bin/bash \
		$(DOCKER_IMAGE_NAME) \
		-c "npm run build && make dev"

# Run development server in Docker (detached mode)
docker-dev-detached: docker-build
	@echo "🐳 Starting development server in Docker (background mode)..."
	@docker run -d \
		--name $(DOCKER_CONTAINER_NAME) \
		-p $(DOCKER_PORT):8000 \
		-v "$$(pwd):/home/claudeuser/workspace" \
		-w /home/claudeuser/workspace \
		--entrypoint /bin/bash \
		$(DOCKER_IMAGE_NAME) \
		-c "npm run build && make dev"
	@echo "✅ Container started in background"
	@echo "🌐 Server: http://localhost:$(DOCKER_PORT)"
	@echo "📊 View logs: make docker-logs"
	@echo "🛑 Stop server: make docker-stop"

# View logs from running Docker container
docker-logs:
	@docker logs -f $(DOCKER_CONTAINER_NAME)

# Stop the Docker container
docker-stop:
	@echo "🛑 Stopping Docker container..."
	@docker stop $(DOCKER_CONTAINER_NAME) 2>/dev/null || true
	@echo "✅ Container stopped"

# Remove the Docker container
docker-clean: docker-stop
	@echo "🧹 Cleaning up Docker container..."
	@docker rm $(DOCKER_CONTAINER_NAME) 2>/dev/null || true
	@echo "✅ Container removed"

# Remove Docker image
docker-clean-image: docker-clean
	@echo "🧹 Removing Docker image..."
	@docker rmi $(DOCKER_IMAGE_NAME) 2>/dev/null || true
	@echo "✅ Image removed"

# Shell into running Docker container
docker-shell:
	@docker exec -it $(DOCKER_CONTAINER_NAME) /bin/bash

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

.PHONY: docker-build docker-dev docker-dev-detached docker-logs docker-stop docker-clean docker-clean-image docker-shell dev _dev-server _dev-watch-css _dev-watch-js server logo-json logo-json-embedded build build-clean build-dev serve-build clean