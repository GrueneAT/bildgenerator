// QR Code Generation Logic
let qrCodeInstance = null;
let qrPreviewCanvas = null;

// QR Code Colors (from plan)
const QR_COLORS = {
    '#000000': 'Schwarz',
    '#FFFFFF': 'Weiß',
    '#538430': 'Dunkelgrün',
    '#82B624': 'Hellgrün',
    '#FFED00': 'Gelb',
    '#E6007E': 'Magenta'
};

const QR_BACKGROUNDS = {
    '#FFFFFF': 'Weiß',
    '#000000': 'Schwarz',
    'transparent': 'Transparent'
};

// Generate QR Code Preview
function generateQRPreview(isLiveUpdate = false) {
    if (!qrSelectedType) {
        if (!isLiveUpdate) {
            showQRAlert('Kein Inhaltstyp ausgewählt', 'error');
        }
        return;
    }
    
    try {
        const qrData = collectQRData();
        
        if (!qrData) {
            if (!isLiveUpdate) {
                clearQRPreview();
                updateQRStatus('Geben Sie Daten ein für die Vorschau');
            }
            return;
        }
        
        // Update status
        updateQRStatus('QR-Code wird generiert...');
        
        // Generate QR code
        const qrColor = jQuery('#qr-color-select').val() || '#000000';
        const qrBackground = jQuery('#qr-background-select').val() || '#FFFFFF';
        
        generateQRCode(qrData, qrColor, qrBackground)
            .then((qrCanvas) => {
                if (qrCanvas) {
                    displayQRPreview(qrCanvas);
                    qrGeneratedCode = {
                        data: qrData,
                        color: qrColor,
                        background: qrBackground,
                        canvas: qrCanvas
                    };
                    
                    if (!isLiveUpdate) {
                        updateQRStatus('QR-Code erfolgreich erstellt');
                    } else {
                        updateQRStatus('Vorschau aktualisiert');
                    }
                }
            })
            .catch((error) => {
                console.error('QR Code generation error:', error);
                if (!isLiveUpdate) {
                    showQRAlert('Fehler beim Erstellen des QR-Codes: ' + error.message, 'error');
                }
                updateQRStatus('Fehler bei der Generierung');
            });
            
    } catch (error) {
        console.error('QR Preview error:', error);
        if (!isLiveUpdate) {
            showQRAlert('Fehler bei der Vorschau: ' + error.message, 'error');
        }
        updateQRStatus('Vorschau-Fehler');
    }
}

// Collect QR Data from form inputs
function collectQRData() {
    if (!qrSelectedType) return null;
    
    try {
        switch (qrSelectedType) {
            case 'text':
                const text = jQuery('#qr-text-input').val().trim();
                return text || null;
                
            case 'url':
                let url = jQuery('#qr-url-input').val().trim();
                if (!url) return null;
                
                // Add https:// if missing
                if (!url.match(/^https?:\/\//)) {
                    url = 'https://' + url;
                }
                return url;
                
            case 'email':
                const email = jQuery('#qr-email-address').val().trim();
                if (!email) return null;
                
                const subject = jQuery('#qr-email-subject').val().trim();
                const body = jQuery('#qr-email-body').val().trim();
                
                let mailto = `mailto:${email}`;
                const params = [];
                
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);
                
                if (params.length > 0) {
                    mailto += '?' + params.join('&');
                }
                
                return mailto;
                
            case 'vcard':
                const lastname = jQuery('#qr-vcard-lastname').val().trim();
                if (!lastname) return null;
                
                const vcard = generateVCard();
                return vcard;
                
            default:
                return null;
        }
    } catch (error) {
        console.error('Error collecting QR data:', error);
        return null;
    }
}

// Generate vCard string
function generateVCard() {
    const fields = {
        title: jQuery('#qr-vcard-title').val().trim(),
        firstname: jQuery('#qr-vcard-firstname').val().trim(),
        lastname: jQuery('#qr-vcard-lastname').val().trim(),
        phone: jQuery('#qr-vcard-phone').val().trim(),
        email: jQuery('#qr-vcard-email').val().trim(),
        address: jQuery('#qr-vcard-address').val().trim(),
        zip: jQuery('#qr-vcard-zip').val().trim(),
        city: jQuery('#qr-vcard-city').val().trim(),
        website: jQuery('#qr-vcard-website').val().trim()
    };
    
    let vcard = 'BEGIN:VCARD\n';
    vcard += 'VERSION:3.0\n';
    
    // Name (required)
    const fullName = `${fields.title} ${fields.firstname} ${fields.lastname}`.trim();
    vcard += `FN:${fullName}\n`;
    vcard += `N:${fields.lastname};${fields.firstname};;${fields.title};\n`;
    
    // Optional fields
    if (fields.phone) vcard += `TEL:${fields.phone}\n`;
    if (fields.email) vcard += `EMAIL:${fields.email}\n`;
    
    if (fields.address || fields.zip || fields.city) {
        vcard += `ADR:;;${fields.address};${fields.city};;${fields.zip};\n`;
    }
    
    if (fields.website) {
        let website = fields.website;
        if (!website.match(/^https?:\/\//)) {
            website = 'https://' + website;
        }
        vcard += `URL:${website}\n`;
    }
    
    vcard += 'END:VCARD';
    
    return vcard;
}

// Generate QR Code using qrcode.js library
function generateQRCode(data, foregroundColor, backgroundColor) {
    return new Promise((resolve, reject) => {
        try {
            // Create temporary container for QR generation
            const tempDiv = document.createElement('div');
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);

            // Determine QR code size
            const qrSize = 512; // High resolution for quality

            // Check if foreground is white or near-white
            const isWhiteForeground = isColorWhiteOrNearWhite(foregroundColor);

            // Use a placeholder color for background when:
            // 1. We want transparency AND
            // 2. The foreground is white/near-white
            // This prevents white foreground pixels from being made transparent
            const PLACEHOLDER_COLOR = '#FF00FF'; // Magenta as placeholder
            const useBackgroundPlaceholder = backgroundColor === 'transparent' && isWhiteForeground;
            const actualColorLight = backgroundColor === 'transparent'
                ? (useBackgroundPlaceholder ? PLACEHOLDER_COLOR : '#FFFFFF')
                : backgroundColor;

            // QR code options
            const options = {
                text: data,
                width: qrSize,
                height: qrSize,
                colorDark: foregroundColor,
                colorLight: actualColorLight,
                correctLevel: QRCode.CorrectLevel.M, // Medium error correction
                quietZone: backgroundColor !== 'transparent' ? Math.floor(qrSize * 0.05) : 0,
                quietZoneColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor
            };

            // Check for contrast issues
            if (foregroundColor === backgroundColor && backgroundColor !== 'transparent') {
                reject(new Error('Vordergrund- und Hintergrundfarbe müssen unterschiedlich sein.'));
                return;
            }

            // Generate QR code
            const qr = new QRCode(tempDiv, options);

            // Wait for generation and extract canvas
            setTimeout(() => {
                try {
                    const qrImg = tempDiv.querySelector('img');
                    if (!qrImg) {
                        document.body.removeChild(tempDiv);
                        reject(new Error('QR-Code Bild konnte nicht generiert werden.'));
                        return;
                    }

                    // Create final canvas with proper quiet zone
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let finalSize = qrSize;
                    let quietZoneSize = 0;

                    if (backgroundColor !== 'transparent') {
                        quietZoneSize = Math.floor(qrSize * 0.05);
                        finalSize = qrSize + (quietZoneSize * 2);
                    }

                    canvas.width = finalSize;
                    canvas.height = finalSize;

                    // Fill background
                    if (backgroundColor !== 'transparent') {
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(0, 0, finalSize, finalSize);
                    }

                    // Helper function to make background pixels transparent
                    const makeBackgroundTransparent = () => {
                        if (backgroundColor === 'transparent') {
                            const imageData = ctx.getImageData(0, 0, finalSize, finalSize);
                            const pixelData = imageData.data;

                            for (let i = 0; i < pixelData.length; i += 4) {
                                const r = pixelData[i];
                                const g = pixelData[i + 1];
                                const b = pixelData[i + 2];

                                if (useBackgroundPlaceholder) {
                                    // When using placeholder, only make magenta pixels transparent
                                    // Magenta is RGB(255, 0, 255)
                                    if (r > 250 && g < 5 && b > 250) {
                                        pixelData[i + 3] = 0; // Set alpha to 0 (fully transparent)
                                    }
                                } else {
                                    // Standard case: make white/near-white pixels transparent
                                    // This is safe because foreground is NOT white
                                    if (r > 250 && g > 250 && b > 250) {
                                        pixelData[i + 3] = 0; // Set alpha to 0 (fully transparent)
                                    }
                                }
                            }

                            ctx.putImageData(imageData, 0, 0);
                        }
                    };

                    // Draw QR code
                    qrImg.onload = () => {
                        ctx.drawImage(qrImg, quietZoneSize, quietZoneSize, qrSize, qrSize);
                        makeBackgroundTransparent();

                        // Clean up
                        document.body.removeChild(tempDiv);

                        resolve(canvas);
                    };

                    // If image is already loaded
                    if (qrImg.complete) {
                        ctx.drawImage(qrImg, quietZoneSize, quietZoneSize, qrSize, qrSize);
                        makeBackgroundTransparent();
                        document.body.removeChild(tempDiv);
                        resolve(canvas);
                    }

                } catch (error) {
                    document.body.removeChild(tempDiv);
                    reject(error);
                }
            }, 200); // Wait for QR generation

        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to check if a color is white or near-white
function isColorWhiteOrNearWhite(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Check if all RGB values are above 250 (near-white threshold)
    return r > 250 && g > 250 && b > 250;
}

// Display QR Preview
function displayQRPreview(canvas) {
    const previewContainer = jQuery('#qr-preview-display');
    const placeholder = jQuery('#qr-preview-placeholder');
    
    // Clear previous preview
    previewContainer.empty();
    
    // Create display canvas (scaled down for preview)
    const displayCanvas = document.createElement('canvas');
    const displayCtx = displayCanvas.getContext('2d');
    
    const maxSize = 300; // Maximum preview size
    const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
    
    displayCanvas.width = canvas.width * scale;
    displayCanvas.height = canvas.height * scale;
    
    // Enable crisp pixel rendering
    displayCtx.imageSmoothingEnabled = false;
    displayCtx.webkitImageSmoothingEnabled = false;
    displayCtx.mozImageSmoothingEnabled = false;
    displayCtx.msImageSmoothingEnabled = false;
    
    displayCtx.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
    
    // Add styling
    displayCanvas.style.maxWidth = '100%';
    displayCanvas.style.height = 'auto';
    displayCanvas.style.border = '1px solid #e5e7eb';
    displayCanvas.style.borderRadius = '8px';
    displayCanvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    
    // Show preview
    previewContainer.append(displayCanvas).removeClass('hidden');
    placeholder.addClass('hidden');
    
    // Store reference for download
    qrPreviewCanvas = canvas;
}

// Clear QR Preview
function clearQRPreview() {
    const previewContainer = jQuery('#qr-preview-display');
    const placeholder = jQuery('#qr-preview-placeholder');
    
    previewContainer.addClass('hidden').empty();
    placeholder.removeClass('hidden');
    
    qrPreviewCanvas = null;
    qrGeneratedCode = null;
    
    updateQRStatus('Wählen Sie einen Inhaltstyp');
}

// Download QR Code
function downloadQRCode() {
    if (!qrGeneratedCode || !qrPreviewCanvas) {
        showQRAlert('Kein QR-Code zum Herunterladen verfügbar.', 'warning');
        return;
    }
    
    try {
        // Get current colors (in case they were changed)
        const currentColor = jQuery('#qr-color-select').val();
        const currentBackground = jQuery('#qr-background-select').val();
        
        // Regenerate with current settings if they changed
        if (currentColor !== qrGeneratedCode.color || currentBackground !== qrGeneratedCode.background) {
            updateQRStatus('QR-Code wird mit neuen Einstellungen generiert...');
            
            generateQRCode(qrGeneratedCode.data, currentColor, currentBackground)
                .then((newCanvas) => {
                    performDownload(newCanvas);
                })
                .catch((error) => {
                    showQRAlert('Fehler beim Erstellen des finalen QR-Codes: ' + error.message, 'error');
                });
        } else {
            performDownload(qrPreviewCanvas);
        }
        
    } catch (error) {
        console.error('Download error:', error);
        showQRAlert('Fehler beim Download: ' + error.message, 'error');
    }
}

// Perform actual download
function performDownload(canvas) {
    try {
        // Convert to blob
        canvas.toBlob((blob) => {
            if (!blob) {
                showQRAlert('Fehler beim Erstellen der Bild-Datei.', 'error');
                return;
            }
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = generateQRFileName();
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            updateQRStatus('QR-Code erfolgreich heruntergeladen');
            showQRAlert('QR-Code wurde heruntergeladen!', 'success');
            
        }, 'image/png', 1.0);
        
    } catch (error) {
        console.error('Download execution error:', error);
        showQRAlert('Fehler beim Download-Vorgang: ' + error.message, 'error');
    }
}

// Generate filename for QR code
function generateQRFileName() {
    const type = qrSelectedType || 'qrcode';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `qrcode-${type}-${timestamp}.png`;
}

// Setup color change handlers
function setupQRColorHandlers() {
    jQuery('#qr-color-select, #qr-background-select').on('change', function() {
        if (qrGeneratedCode && qrCurrentStep === 3) {
            // Regenerate preview with new colors
            setTimeout(() => {
                generateQRPreview();
            }, 100);
        }
    });
}

// Initialize QR Generator
function initializeQRGenerator() {
    setupQRColorHandlers();
    console.log('QR Code Generator initialized');
}

// Initialize when document is ready
jQuery(document).ready(function() {
    // Don't auto-initialize - will be called when needed
    console.log('QR Code Generator module loaded');
});