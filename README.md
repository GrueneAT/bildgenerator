# Grüner Bildgenerator

Der grüne Bildgenerator ist ein browser-basiertes Tool zur Erstellung professioneller Grafiken für Social Media und Druckmaterialien der österreichischen Grünen Partei. Das Tool bietet eine benutzerfreundliche Oberfläche für die schnelle Erstellung von markenkonformen Designs.

## Supported Features

### 📐 **Template System**

#### **Social Media Formats**
- **Post Quadratisch** (1080×1080px) - Instagram/Facebook Posts
- **Post 4:5** (1080×1350px) - Optimierte Instagram Posts
- **Instagram/Facebook Story** (1080×1920px) - Vertikale Stories
- **Veranstaltung/Event** (1200×628px) - Facebook Event Header
- **Facebook Header** (1958×745px) - Ultra-breite Titelbilder

#### **Print Formats**
- **A4 Poster** (2480×3508px, 300 DPI) - Standard Poster
- **A4 Querformat** (3508×2480px, 300 DPI) - Landscape Poster
- **A3 Poster** (3508×4961px, 300 DPI) - Große Poster
- **A3 Querformat** (4961×3508px, 300 DPI) - Große Landscape Poster
- **A2 Poster** (4961×7016px, 150 DPI) - Extra große Poster
- **A2 Querformat** (7016×4961px, 150 DPI) - Extra große Landscape Poster
- **A5 Flyer** (1748×2480px, 300 DPI) - Kleine Flyer
- **A5 Querformat** (2480×1748px, 300 DPI) - Kleine Landscape Flyer

### ✏️ **Text System**

#### **Typography**
- **Gotham Narrow Ultra (900)** - Headlines und Akzente
- **Gotham Narrow Book (400)** - Fließtext und Beschreibungen
- **FontFaceObserver Integration** - Optimierte Schriftarten-Ladung
- **Multi-line Text Support** - Mehrzeilige Texteingabe
- **Auto-scaling** - Automatische Größenanpassung an Canvas

#### **Text Styling**
- **Farben**: Gelb (#FFD200), Weiß (#FFFFFF), Schwarz (#000000)
- **Ausrichtung**: Links, Zentriert, Rechts mit visuellen Buttons
- **Zeilenhöhe**: Klein (0.8), Mittel (0.9), Groß (1.1)
- **Schatten-Effekte**: 0-30px Tiefe mit präziser Kontrolle
- **Real-time Editing** - Live-Bearbeitung ausgewählter Textobjekte

### 🏛️ **Logo System**

#### **Logo-Kategorien**
- **Bundesländer** - Alle österreichischen Bundesländer
- **Gemeinden** - Städte und Gemeinden
- **Bezirke** - Bezirksorganisationen  
- **Klubs** - Partei-Klubs und Gruppierungen
- **Gebiete** - Regionale Organisationen

#### **Logo-Features**
- **Suchbare Auswahl** - Intelligente Logo-Suche mit Custom Dropdown
- **Automatische Textgenerierung** - Organisationsname unter Logo
- **Größenvarianten** - 120px und 245px Versionen
- **Smart Positioning** - Template-spezifische Positionierung
- **Embedded Data** - Eingebettete Logo-Daten für schnellere Ladung
- **Text Wrapping** - Automatischer Umbruch bei langen Organisationsnamen

### 🖼️ **Background Image System**

#### **Bild-Quellen**
- **Vorgefertigte Galerie** - Kuratierte Template-Bilder
- **Custom Upload** - JPEG, PNG, WebP, SVG Support
- **Masonry Grid Layout** - Responsive Bild-Galerie
- **Cross-origin Support** - Externe Bild-URLs

#### **Bild-Manipulation**
- **Automatisches Cropping** - Anpassung an Content-Bereich
- **Skalierung und Positionierung** - Präzise Bildkontrolle
- **Clipping Boundaries** - Automatische Begrenzung auf Canvas
- **High-Resolution Support** - Optimierte Performance für große Bilder

### 🎨 **Additional Elements**

#### **Grafische Elemente**
- **Rosa Kreis** - Dekoratives Markenelement
- **Häkchen/Checkmark** - Vorgefertigtes Checkmark-Icon
- **Custom Images** - Upload eigener Grafiken mit voller Manipulation

#### **QR Code Generator**
- **Farben**: Schwarz, Dunkelgrün (Markenfarbe)
- **Content Types**: URLs, Text, spezielle Zeichen
- **Qualität**: 512-2048px High-Resolution Rendering
- **Features**: Weißer Rand, Error Correction Level M
- **Smart Sizing** - Canvas-basierte Größenoptimierung

### 🛠️ **Element Manipulation**

#### **Advanced Controls**
- **Circle Clipping** - Runde Masken für Bilder
  - Groß (90%), Mittel (70%), Klein (50%)
- **Precision Scaling** - 0.1 bis 2.0 Skalierung mit Slider
- **Layer Management** - In den Vordergrund/Hintergrund
- **Multi-Selection** - Mehrere Objekte gleichzeitig bearbeiten
- **Smart Constraints** - Schutz von Logo und Hintergrund
- **Snap Alignment** - Automatische Zentrierung und Ausrichtung

### 🏗️ **Production Build System**

#### **Optimized Assets**
- **JavaScript Bundle** - 55% size reduction through minification
- **CSS Bundle** - 11% size reduction with PostCSS optimization
- **Source Maps** - Full debugging support in production
- **Cache Busting** - Automatic versioning for browser cache management
- **Tree Shaking** - Unused code elimination

#### **Build Commands**
```bash
npm run build         # Full production build
npm run build:js      # JavaScript bundle only
npm run build:css     # CSS bundle only
npm run build:clean   # Clean build
make build            # Make-based build with logo processing
```

#### **GitHub Actions Integration**
- **Automated Deployment** - GitHub Pages deployment on main branch
- **Build Testing** - PR build validation with size analysis
- **Release Creation** - Tagged releases with deployment packages
- **Visual Regression** - Automated UI testing

### 🚀 **Deployment Options**

#### **Automated Deployment (Recommended)**
- **GitHub Pages** - Push to main branch for automatic deployment
- **Zero Configuration** - Built-in CI/CD pipeline
- **Performance Optimized** - Minified and compressed assets

#### **Manual Deployment**
- **Static Hosting** - Netlify, Vercel, AWS S3
- **Traditional Servers** - Apache, Nginx with static files
- **CDN Ready** - Optimized for global content delivery

### 💾 **Export & Download**

#### **Format Options**
- **PNG** - Verlustfreie Qualität für beste Bildqualität
- **JPEG** - Komprimierte Ausgabe für kleinere Dateien
- **Quality Settings** - Hoch (1.0), Mittel (0.5), Niedrig (0.1)

#### **Resolution Control**
- **Template-spezifische DPI** - Optimiert für jeden Format-Typ
- **Browser Safety Limits** - Automatische Größenbegrenzung
- **Smart Downscaling** - Intelligente Auflösungsreduktion
- **Multiplier-based Rendering** - Präzise DPI-Berechnung

### 🖱️ **User Interface**

#### **Wizard Navigation**
- **4-Schritt Workflow** - Geführte Benutzerführung
- **Progress Indicators** - Desktop und Mobile Fortschrittsanzeige
- **Step Validation** - Automatische Validierung und Weiterleitung
- **Start Over** - Workflow-Reset Funktionalität

#### **Responsive Design**
- **Mobile Optimized** - Touch-freundliche Bedienung
- **Tablet Support** - Mittelgroße Bildschirme
- **Desktop Interface** - Vollständige Desktop-Erfahrung
- **Adaptive Components** - Responsive UI-Elemente

#### **Advanced UI Controls**
- **Searchable Select** - Custom Dropdown-Komponenten
- **Button Groups** - Gruppierte Auswahl-Buttons
- **Range Sliders** - Präzise numerische Kontrolle
- **File Upload** - Drag-and-Drop Styling
- **Collapsible Sections** - Erweiterte Optionen

### 🔧 **Technical Features**

#### **Performance Optimizations**
- **Font Preloading** - FontFaceObserver Integration
- **Embedded Logo Data** - Base64-kodierte Logos
- **Canvas Object Caching** - Optimierte Rendering-Performance
- **Lazy Loading** - Intelligente Bild-Ladung
- **Memory Management** - Automatische Speicherbereinigung

#### **State Management**
- **LocalStorage** - Persistierung von Organisationseinstellungen
- **Session State** - Sitzungsdaten-Erhaltung
- **Auto-save Preferences** - Automatisches Speichern der Auswahl
- **Smart Restoration** - Intelligente Wiederherstellung

#### **Browser Compatibility**
- **Cross-browser Support** - Moderne Browser-Unterstützung
- **Canvas API** - Hardware-beschleunigte Grafik-Rendering
- **File API** - Native Datei-Upload Unterstützung
- **Touch Events** - Mobile Touch-Unterstützung
- **Keyboard Navigation** - Barrierefreie Bedienung

#### **Quality Assurance**
- **Visual Regression Testing** - Automatisierte UI-Tests mit Pixelmatch
- **Error Handling** - Robuste Fehlerbehandlung
- **Fallback Systems** - Backup-Mechanismen für kritische Features
- **Performance Monitoring** - Überwachung der Anwendungsleistung

### 📱 **Platform Integration**

#### **Social Media Ready**
- **Optimierte Größen** - Perfekt für Instagram, Facebook, Twitter
- **Brand Compliance** - Automatische Marken-Einhaltung
- **Quick Export** - Ein-Klick Export für Social Platforms

#### **Print Production**
- **High-DPI Output** - 150-300 DPI für professionellen Druck
- **CMYK-optimierte Farben** - Druckfähige Farbpalette
- **Precise Dimensions** - Exakte Maße für Druckereien
- **Quality Control** - Automatische Qualitätsprüfung

## Getting Started

### Prerequisites
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Internetverbindung für Logo-Daten
- JavaScript aktiviert

### Usage
1. **Template wählen** - Gewünschtes Format auswählen
2. **Organisation auswählen** - Logo und Branding festlegen  
3. **Content hinzufügen** - Text, Bilder, QR-Codes einfügen
4. **Design anpassen** - Farben, Größen, Positionen optimieren
5. **Export** - Gewünschtes Format herunterladen

## Development

### Build Commands
```bash
# CSS Development (with watch mode)
npm run build-css

# Production CSS Build
npm run build-css-prod

# Start Development Server
make server

# Generate Logo JSON Files
make logo-json
```

### Testing
```bash
# Run Visual Regression Tests
npm run test:visual

# Run All Tests
npm run test:all

# Test with UI
npm run test:visual-ui
```

## License
[MIT](LICENSE)
