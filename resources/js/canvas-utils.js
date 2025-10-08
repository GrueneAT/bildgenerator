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
    enableSnap(canvasInstance, snapZone = null) {
        console.log('[CanvasUtils.enableSnap] Initializing snap with canvas:', canvasInstance ? 'defined' : 'undefined');

        if (!snapZone) {
            snapZone = canvasInstance.width / AppConstants.CANVAS.SNAP_ZONE_RATIO;
        }

        console.log('[CanvasUtils.enableSnap] Snap zone calculated:', snapZone);

        canvasInstance.on("object:moving", function (options) {
            const target = options.target;

            // Skip if not eligible for snapping
            if (target === contentImage || target === logo || target === logoName) {
                return;
            }

            // Safety check for getCenterPoint method
            if (!target || typeof target.getCenterPoint !== 'function') {
                return;
            }

            const objectCenter = target.getCenterPoint();
            const canvasCenter = canvasInstance.width / 2;
            const distanceFromCenter = Math.abs(objectCenter.x - canvasCenter);

            if (distanceFromCenter < snapZone) {
                // Store center point before adjustment
                const centerBefore = target.getCenterPoint();

                // Calculate horizontal adjustment needed to center
                const deltaX = canvasCenter - centerBefore.x;

                // Apply adjustment while preserving vertical position
                target.set({
                    left: target.left + deltaX
                });
                target.setCoords();

                // Verify center after adjustment
                const centerAfter = target.getCenterPoint();

                console.log(
                    '%c[SNAP] CENTER SNAP',
                    'background: #8ab414; color: white; font-weight: bold; padding: 2px 6px;',
                    '\n  Object type:', target.type,
                    '\n  Center before:', `(${centerBefore.x.toFixed(2)}, ${centerBefore.y.toFixed(2)})`,
                    '\n  Center after:', `(${centerAfter.x.toFixed(2)}, ${centerAfter.y.toFixed(2)})`,
                    '\n  Canvas center:', canvasCenter.toFixed(2),
                    '\n  Adjustment:', deltaX.toFixed(2) + 'px',
                    '\n  Snap zone:', snapZone.toFixed(2) + 'px'
                );
            }
        });
    },

    // Rotation snapping functionality - snaps in real-time during rotation
    enableRotationSnap(canvasInstance, tolerance = null) {
        console.log('[CanvasUtils.enableRotationSnap] Initializing rotation snap with canvas:', canvasInstance ? 'defined' : 'undefined');

        if (!tolerance) {
            tolerance = AppConstants.CANVAS.ROTATION_SNAP_TOLERANCE;
        }

        const snapAngles = AppConstants.CANVAS.ROTATION_SNAP_ANGLES;
        console.log('[CanvasUtils.enableRotationSnap] Tolerance:', tolerance, 'Snap angles:', snapAngles);

        // Use object:rotating for real-time snapping while mouse is down
        canvasInstance.on("object:rotating", function (e) {
            const target = e.target;

            if (!target) {
                return;
            }

            // Exclude protected objects from rotation snapping
            if (target === contentImage || target === logo || target === logoName) {
                return;
            }

            // Safety check for getCenterPoint method
            if (typeof target.getCenterPoint !== 'function') {
                return;
            }

            // Normalize angle to 0-360 range
            let currentAngle = target.angle % 360;
            if (currentAngle < 0) {
                currentAngle += 360;
            }

            // Find closest snap angle
            let closestAngle = null;
            let minDifference = Infinity;

            for (const snapAngle of snapAngles) {
                // Calculate difference considering angle wrapping
                let difference = Math.abs(currentAngle - snapAngle);

                // Handle wrap-around (e.g., 359° to 0°)
                if (difference > 180) {
                    difference = 360 - difference;
                }

                if (difference < minDifference) {
                    minDifference = difference;
                    closestAngle = snapAngle;
                }
            }

            // Apply snap if within tolerance
            if (closestAngle !== null && minDifference <= tolerance) {
                // Store visual center point BEFORE rotation change
                const centerBefore = target.getCenterPoint();

                // Apply rotation snap
                target.set({ angle: closestAngle });

                // Get visual center point AFTER rotation change
                const centerAfter = target.getCenterPoint();

                // Calculate position adjustment to restore visual center
                const deltaX = centerBefore.x - centerAfter.x;
                const deltaY = centerBefore.y - centerAfter.y;

                // Restore original visual position
                target.set({
                    left: target.left + deltaX,
                    top: target.top + deltaY
                });

                target.setCoords();

                // Only log once per snap (reduce console spam)
                if (!target._isSnapped || target._snappedTo !== closestAngle) {
                    console.log(
                        '%c[SNAP] ROTATION SNAP',
                        'background: #e10078; color: white; font-weight: bold; padding: 2px 6px;',
                        '\n  Object type:', target.type,
                        '\n  Original angle:', currentAngle.toFixed(2) + '°',
                        '\n  Snapped to:', closestAngle + '°',
                        '\n  Difference:', minDifference.toFixed(2) + '°',
                        '\n  Tolerance:', tolerance + '°',
                        '\n  Center before:', `(${centerBefore.x.toFixed(2)}, ${centerBefore.y.toFixed(2)})`,
                        '\n  Center after:', `(${centerAfter.x.toFixed(2)}, ${centerAfter.y.toFixed(2)})`,
                        '\n  Position adjustment:', `(${deltaX.toFixed(2)}, ${deltaY.toFixed(2)})`
                    );
                }
                target._isSnapped = true;
                target._snappedTo = closestAngle;
            } else {
                // Clear snap state when outside tolerance
                target._isSnapped = false;
                target._snappedTo = null;
            }
        });
    },

    // Picture movement constraints
    enablePictureMove(canvasInstance) {
        canvasInstance.on("object:moving", function (options) {
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