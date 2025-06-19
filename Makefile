server: logo-json-embedded
	python3 -m http.server 8000

# Generate embedded HTML with logo data for production
logo-json-embedded: logo-json
	python3 embed_logos.py index.html index-production.html
	@echo "Production HTML with embedded logos created: index-production.html"
	@echo "For production, serve index-production.html instead of index.html"

# Development server with separate JSON loading
server-dev: logo-json
	@echo "Starting development server with separate JSON loading..."
	python3 -m http.server 8000

logo-json:
	rm -fr resources/images/logos/index
	mkdir -p resources/images/logos/index
	ls resources/images/logos/gemeinden | grep -v "120" | sort | python3 logo_json.py > resources/images/logos/index/gemeinden-logos.json
	ls resources/images/logos/bundeslaender | grep -v "120" | sort | python3 logo_json.py > resources/images/logos/index/bundeslaender-logos.json
	ls resources/images/logos/domains | sort | grep -v "120" | python3 logo_json.py > resources/images/logos/index/domains-logos.json

# Clean generated files
clean:
	rm -f index-production.html
	rm -fr resources/images/logos/index

.PHONY: server server-dev logo-json logo-json-embedded clean