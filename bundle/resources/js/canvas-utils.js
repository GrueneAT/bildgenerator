// Canvas Utilities - Centralized canvas manipulation functions

// Canvas scaling and positioning utilities
const CanvasUtils = {
    // Scale element to fit within specified ratios
    scaleElementToFit(element, maxWidthRatio = 0.5, maxHeightRatio = 0.4) {
        const maxWidth = canvas.width * maxWidthRatio;
        const maxHeight = canvas.height * maxHeightRatio;

        const elementWidth = element.width || element.getScaledWidth();
        const elementHeight = element.height || element.getScaledHeight();

        const widthScale = maxWidth / elementWidth;
        const heightScale = maxHeight / elementHeight;
        const scale = Math.min(widthScale, heightScale);

        if (element.type === "text") {
            if (widthScale < heightScale) {
                element.scaleToWidth(maxWidth);
            } else {
                element.scaleToHeight(maxHeight);
            }
        } else if (element.scaleToWidth && element.scaleToHeight) {
            if (widthScale < heightScale) {
                element.scaleToWidth(maxWidth);
            } else {
                element.scaleToHeight(maxHeight);
            }
        } else {
            element.scale(scale);
        }

        element.setCoords();
    },

    // Control visibility configurations
    disableScalingControls(object) {
        object.setControlsVisibility({
            mt: false,
            mb: false,
            ml: false,
            mr: false,
            bl: false,
            br: false,
            tl: false,
            tr: false,
            mtr: false,
        });
    },

    relativeScalingControlsOnly(object) {
        object.setControlsVisibility({
            mt: false,
            mb: false,
            ml: false,
            mr: false,
            bl: true,
            br: true,
            tl: true,
            tr: true,
            mtr: true,
        });
    },

    // Canvas snapping functionality
    enableSnap(snapZone = null) {
        if (!snapZone) {
            snapZone = canvas.width / 20;
        }
        
        canvas.on("object:moving", function (options) {
            if (options.target != contentImage) {
                const objectWidth = options.target.getBoundingRect().width;
                const objectMiddle = options.target.left + objectWidth / 2;
                
                if (
                    objectMiddle > canvas.width / 2 - snapZone &&
                    objectMiddle < canvas.width / 2 + snapZone
                ) {
                    options.target
                        .set({
                            left: canvas.width / 2 - objectWidth / 2,
                        })
                        .setCoords();
                }
            }
        });
    },

    // Picture movement constraints
    enablePictureMove() {
        canvas.on("object:moving", function (options) {
            if (options.target === contentImage) {
                const imageRelatedHeight = options.target.height * (contentRect.width / contentImage.width);
                const imageRelatedWidth = options.target.width * (contentRect.height / contentImage.height);

                const maxTop = contentImage.top - contentRect.top - contentRect.height;
                const maxLeft = contentImage.left - contentRect.left - contentRect.width;

                // Snap to top if dragged beyond and image is larger than height
                if (
                    options.target.top > contentRect.top &&
                    imageRelatedHeight > contentRect.height
                ) {
                    options.target
                        .set({ top: contentRect.top })
                        .setCoords();
                }

                // Snap to left if dragged beyond and image is wider than width
                if (
                    options.target.left > contentRect.left &&
                    imageRelatedWidth > contentRect.width
                ) {
                    options.target
                        .set({ left: contentRect.left })
                        .setCoords();
                }

                // Snap to max boundaries
                if (
                    imageRelatedHeight > contentRect.height &&
                    imageRelatedHeight < maxTop * -1
                ) {
                    options.target
                        .set({
                            top: contentRect.height - imageRelatedHeight + contentRect.top,
                        })
                        .setCoords();
                }

                if (
                    imageRelatedWidth > contentRect.width &&
                    imageRelatedWidth < maxLeft * -1
                ) {
                    options.target
                        .set({
                            left: contentRect.width - imageRelatedWidth + contentRect.left,
                        })
                        .setCoords();
                }
            }
        });
    },

    // Background image positioning
    positionBackgroundImage() {
        if (contentImage != null) {
            canvas.remove(contentRect);
            canvas.remove(contentImage);
            
            contentImage.selectable = true;
            contentImage.top = contentRect.top;
            contentImage.left = contentRect.left;
            this.disableScalingControls(contentImage);

            const clipRect = new fabric.Rect({
                left: contentRect.left,
                top: contentRect.top,
                width: contentRect.width,
                height: contentRect.height,
                absolutePositioned: true,
            });

            if (contentRect.width > contentRect.height) {
                contentImage.scaleToWidth(contentRect.width);
                contentImage.lockMovementX = true;
                contentImage.lockMovementY = false;
            } else if (
                contentRect.width < contentRect.height ||
                contentImage.width > contentImage.height
            ) {
                contentImage.scaleToHeight(contentRect.height);
                contentImage.lockMovementY = true;
                contentImage.lockMovementX = false;
            } else {
                contentImage.scaleToWidth(contentRect.width);
                contentImage.lockMovementX = true;
                contentImage.lockMovementY = false;
            }
            
            contentImage.clipPath = clipRect;
            canvas.add(contentImage);
            canvas.sendToBack(contentImage);
            canvas.centerObjectH(contentImage);
        }
    },

    // Logo management
    bringLogoToFront() {
        if (logo) canvas.bringToFront(logo);
        if (logoName) canvas.bringToFront(logoName);
    },

    // Circle clipping utility
    applyCircleClip(activeObject, sizePercentage = 0.7) {
        if (!activeObject) return false;

        const isValidForCircle = 
            activeObject &&
            activeObject !== contentImage &&
            activeObject !== contentRect &&
            activeObject !== logo &&
            activeObject !== logoName &&
            (activeObject.type === "image" ||
             activeObject.type === "rect" ||
             activeObject.type === "circle");

        if (!isValidForCircle) return false;

        const originalWidth = activeObject.width;
        const originalHeight = activeObject.height;
        const smallestOriginalDimension = Math.min(originalHeight, originalWidth);
        const radius = (smallestOriginalDimension * sizePercentage) / 2;

        if (activeObject.clipPath) {
            activeObject.clipPath = null;
        } else {
            const clipPath = new fabric.Circle({
                radius: radius,
                left: 0,
                top: 0,
                originX: "center",
                originY: "center",
            });
            activeObject.clipPath = clipPath;
        }

        canvas.renderAll();
        return true;
    },

    // Canvas export with DPI handling
    exportCanvas(format, quality, targetDPI = 200) {
        const screenDPI = 72;
        const maxPixels = 250000000;

        const baseMultiplier = targetDPI / screenDPI;
        const finalWidth = canvas.width * baseMultiplier;
        const finalHeight = canvas.height * baseMultiplier;
        const totalPixels = finalWidth * finalHeight;

        let actualMultiplier = baseMultiplier;
        let actualDPI = targetDPI;

        if (totalPixels > maxPixels) {
            actualMultiplier = Math.sqrt(maxPixels / (canvas.width * canvas.height));
            actualDPI = Math.round(actualMultiplier * screenDPI);
            console.warn(`Canvas too large for ${targetDPI} DPI. Reduced to ${actualDPI} DPI`);
        }

        try {
            const dataURL = canvas.toDataURL({
                format: format,
                quality: quality,
                multiplier: actualMultiplier,
            });

            if (dataURL === "data:,") {
                throw new Error("Canvas export failed - empty result");
            }

            return { dataURL, actualDPI, targetDPI };
        } catch (error) {
            console.error("Canvas export error:", error);
            throw error;
        }
    }
};

// Make available globally
window.CanvasUtils = CanvasUtils;