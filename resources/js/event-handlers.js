// Event Handler Utilities - Centralized event handling patterns

const EventHandlerUtils = {
    // Generic event binding utility
    bindHandler(selector, event, handler) {
        jQuery(selector).off(event).on(event, handler);
    },

    // Batch event binding
    bindHandlers(handlerMap) {
        Object.keys(handlerMap).forEach(selector => {
            const handlers = handlerMap[selector];
            Object.keys(handlers).forEach(event => {
                this.bindHandler(selector, event, handlers[event]);
            });
        });
    },

    // Canvas object handlers
    setupCanvasObjectHandlers() {
        const handlers = {
            '#text': {
                'input': function() {
                    setValue("text", jQuery(this).val());
                }
            },
            '#scale': {
                'input': function() {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject && activeObject !== contentImage) {
                        activeObject.scale(parseFloat(this.value)).setCoords();
                        canvas.renderAll();
                        updateScale(activeObject);
                    }
                }
            },
            '#text-color': {
                'change': function() {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject && activeObject.get('type') === "text") {
                        setValue("fill", jQuery(this).find(":selected").attr('value'));
                    }
                }
            },
            'input[name="align"]': {
                'change': function() {
                    const alignValue = jQuery(this).attr('id');
                    setValue("textAlign", alignValue);
                    jQuery(this).parent().trigger('update-status');
                }
            },
            '#stroke-width': {
                'input': function() {
                    const width = jQuery(this).val();
                    setValue("strokeWidth", width == 0 ? null : width);
                }
            },
            '#shadow-depth': {
                'input': function() {
                    setValue("shadow", createShadow('black', jQuery(this).val()));
                }
            },
            '#font-style-select': {
                'change': function() {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject && activeObject.get('type') === "text") {
                        const selectedFont = jQuery(this).val();
                        setValue("fontFamily", selectedFont);
                    }
                }
            },
            '#line-height': {
                'change': function() {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject && activeObject.get('type') === "text") {
                        const lineHeight = parseFloat(jQuery(this).val());
                        setValue("lineHeight", lineHeight);
                    }
                }
            }
        };

        this.bindHandlers(handlers);
    },

    // Main application handlers
    setupMainAppHandlers() {
        const handlers = {
            '#canvas-template': {
                'change': function() {
                    replaceCanvas();
                    if (typeof updateCanvasDimensions === "function") {
                        setTimeout(() => {
                            updateCanvasDimensions();
                        }, 100);
                    }
                }
            },
            '#logo-selection': {
                'change': function() {
                    addLogo();
                }
            },
            '#scale-direction': {
                'change': function() {
                    CanvasUtils.positionBackgroundImage();
                }
            },
            '#remove-element': {
                'click': function() {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject && 
                        activeObject !== contentImage && 
                        activeObject !== logo) {
                        canvas.remove(activeObject);
                    }
                }
            },
            '#bring-to-front': {
                'click': function() {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject && 
                        activeObject !== contentImage && 
                        activeObject !== contentRect) {
                        canvas.bringToFront(activeObject);
                        CanvasUtils.bringLogoToFront();
                        canvas.renderAll();
                    }
                }
            }
        };

        this.bindHandlers(handlers);
    },

    // Text creation handler
    setupTextHandler() {
        this.bindHandler('#add-text', 'click', function() {
            const textValidation = ValidationUtils.validateTextInput(jQuery("#text").val());
            
            if (!textValidation.isValid) {
                showAlert("Error! " + textValidation.error);
                return;
            }

            const initialFontSize = canvas.width / 2;
            const selectedFont = jQuery("#font-style-select").val() || "Gotham Narrow Ultra Italic";
            
            const text = new fabric.Text(jQuery("#text").val(), {
                fontFamily: selectedFont,
                fontSize: initialFontSize,
                fontStyle: "normal",
                textAlign: jQuery('input[name="align"]:checked').val(),
                fill: jQuery("#text-color").find(":selected").attr("value"),
                stroke: "#000000",
                strokeWidth: 0,
                shadow: createShadow("#000000", jQuery("#shadow-depth").val()),
                objectCaching: false,
                lineHeight: parseFloat(jQuery("#line-height").val()) || 1.0,
                centeredScaling: false,
                selectable: true,
                moveable: true,
                hasControls: true,
                hasBorders: true,
                perPixelTargetFind: true,
            });

            canvas.add(text);
            CanvasUtils.relativeScalingControlsOnly(text);
            CanvasUtils.scaleElementToFit(text, 0.8, 0.5);
            canvas.centerObject(text);
            text.set({
                top: canvas.height / 2 - text.getScaledHeight() / 2,
            });

            text.setCoords();
            canvas.setActiveObject(text);
            updateScale(text);
            canvas.renderAll();
        });
    },

    // Image upload handler
    setupImageUploadHandler() {
        this.bindHandler('#add-image', 'input', function() {
            const file = this.files[0];
            if (!file) return;

            const fileValidation = ValidationUtils.isValidImageFile(file);
            jQuery("#add-image").val("");

            if (!fileValidation) {
                showAlert("Error! Invalid Image");
                return;
            }

            const reader = new FileReader();
            reader.onload = function() {
                const image = new Image();
                image.src = reader.result;
                image.onload = function() {
                    fabric.Image.fromURL(reader.result, function(fabricImage) {
                        CanvasUtils.scaleElementToFit(fabricImage, 0.5, 0.4);
                        CanvasUtils.relativeScalingControlsOnly(fabricImage);
                        canvas.add(fabricImage).setActiveObject(fabricImage);
                        canvas.centerObject(fabricImage);
                        updateScale(fabricImage);
                        CanvasUtils.bringLogoToFront();
                    }, {
                        opacity: jQuery("#opacity").val(),
                    });
                };
            };
            reader.readAsDataURL(file);
        });
    },

    // Circle clip handler
    setupCircleClipHandler() {
        this.bindHandler('#add-circle', 'click', function() {
            const activeObject = canvas.getActiveObject();
            const sizeString = jQuery("#circle-radius").val();
            const size = parseInt(sizeString) || 2;

            const validation = ValidationUtils.validateCircleClipTarget(activeObject);
            
            if (!validation.isValid) {
                showAlert(validation.error, validation.type || 'warning');
                return;
            }

            // Map size values to percentages
            const sizePercentageMap = {
                2: 0.9, // Groß - 90%
                3: 0.7, // Mittel - 70%
                4: 0.5  // Klein - 50%
            };
            
            const sizePercentage = sizePercentageMap[size] || 0.7;
            CanvasUtils.applyCircleClip(activeObject, sizePercentage);
        });
    },

    // Pink circle handler
    setupPinkCircleHandler() {
        this.bindHandler('#add-pink-circle', 'click', function() {
            const radius = contentRect.width / 4;
            const pinkCircle = new fabric.Circle({
                top: contentRect.height / 3,
                left: contentRect.width / 3,
                radius: radius,
                fill: "rgb(225,0,120)",
            });
            
            CanvasUtils.scaleElementToFit(pinkCircle, 0.3, 0.3);
            CanvasUtils.relativeScalingControlsOnly(pinkCircle);
            canvas.add(pinkCircle);
            
            // Bring text objects to front
            canvas.getObjects().forEach(object => {
                if (object.get("type") === "text") {
                    canvas.bringToFront(object);
                }
            });
            
            canvas.renderAll();
        });
    },

    // Cross/check mark handler
    setupCrossHandler() {
        this.bindHandler('#add-cross', 'click', function() {
            fabric.Image.fromURL(
                generatorApplicationURL + "resources/images/Ankreuzen.png",
                function(image) {
                    CanvasUtils.scaleElementToFit(image, 0.4, 0.3);
                    canvas.add(image);
                    canvas.centerObject(image);
                    canvas.bringToFront(image);
                }
            );
        });
    },

    // QR Code handler
    setupQRCodeHandler() {
        this.bindHandler('#add-qr-code', 'click', function() {
            const qrText = jQuery("#qr-text").val().trim();
            const validation = ValidationUtils.validateQRInput(qrText);
            
            if (!validation.isValid) {
                showAlert("Error! " + validation.error);
                return;
            }

            const tempDiv = document.createElement("div");
            tempDiv.style.display = "none";
            document.body.appendChild(tempDiv);

            try {
                const targetQRSize = Math.max(512, Math.min(2048, Math.floor(canvas.width / 4)));
                const qrColor = jQuery("#qr-color").val() || "#000000";
                
                const qr = new QRCode(tempDiv, {
                    text: qrText,
                    width: targetQRSize,
                    height: targetQRSize,
                    colorDark: qrColor,
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M,
                });

                setTimeout(function() {
                    const qrImg = tempDiv.querySelector("img");
                    if (qrImg) {
                        const borderPercent = 0.05;
                        const borderSize = Math.floor(targetQRSize * borderPercent);
                        const totalSize = targetQRSize + borderSize * 2;

                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = totalSize;
                        tempCanvas.height = totalSize;
                        const ctx = tempCanvas.getContext("2d");

                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, totalSize, totalSize);
                        ctx.drawImage(qrImg, borderSize, borderSize, targetQRSize, targetQRSize);

                        fabric.Image.fromURL(tempCanvas.toDataURL(), function(qrImage) {
                            CanvasUtils.scaleElementToFit(qrImage, 0.25, 0.25);
                            CanvasUtils.relativeScalingControlsOnly(qrImage);
                            canvas.add(qrImage).setActiveObject(qrImage);
                            canvas.centerObject(qrImage);
                            updateScale(qrImage);
                            CanvasUtils.bringLogoToFront();
                            document.body.removeChild(tempDiv);
                        });
                    } else {
                        showAlert("Error generating QR Code image");
                        document.body.removeChild(tempDiv);
                    }
                }, 100);
            } catch (error) {
                showAlert("Error generating QR Code: " + error.message);
                document.body.removeChild(tempDiv);
            }
        });
    },

    // Download handler
    setupDownloadHandler() {
        this.bindHandler('#generate-meme', 'click', function() {
            const validation = ValidationUtils.validateDownload();
            
            if (!validation.isValid) {
                alert(validation.error);
                return;
            }

            if (confirm("Hast du das Copyright bei Fotos überprüft und angegeben und das Impressum wo notwendig hinzugefügt?")) {
                const currentTemplate = template_values[template];
                const targetDPI = currentTemplate.dpi || 200;
                const format = jQuery("#image-format").find(":selected").attr("value");
                const quality = parseFloat(jQuery("#image-quality").find(":selected").attr("value"));

                try {
                    const exportResult = CanvasUtils.exportCanvas(format, quality, targetDPI);
                    
                    const link = document.createElement("a");
                    link.href = exportResult.dataURL;
                    link.download = createImgName();
                    link.click();

                    if (exportResult.actualDPI < exportResult.targetDPI) {
                        alert(`Download erfolgreich mit ${exportResult.actualDPI} DPI (reduziert von ${exportResult.targetDPI} DPI für Kompatibilität)`);
                    }
                } catch (error) {
                    alert("Fehler beim Erstellen des Bildes. Das Format ist möglicherweise zu groß für diesen Browser.");
                }
            }
        });
    },

    // Initialize all handlers
    initializeAllHandlers() {
        this.setupCanvasObjectHandlers();
        this.setupMainAppHandlers();
        this.setupTextHandler();
        this.setupImageUploadHandler();
        this.setupCircleClipHandler();
        this.setupPinkCircleHandler();
        this.setupCrossHandler();
        this.setupQRCodeHandler();
        this.setupDownloadHandler();
    }
};

// Make available globally
window.EventHandlerUtils = EventHandlerUtils;