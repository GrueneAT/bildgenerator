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
                    'background: #257639; color: white; font-weight: bold; padding: 2px 6px;',
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
    //
    // The background is cover-scaled (see positionBackgroundImage), so it always
    // covers the content rect on both axes and overflows on the longer one. As
    // the user pans the image we clamp it so the content rect stays fully
    // covered — the image edge can never move inside the rect (which would
    // expose the green background). We clamp against the ACTUAL scaled size
    // rather than re-deriving a single-axis fit, so the logic is correct for
    // any aspect ratio.
    enablePictureMove(canvasInstance) {
        canvasInstance.on("object:moving", function (options) {
            if (options.target === contentImage) {
                const scaledWidth = options.target.getScaledWidth();
                const scaledHeight = options.target.getScaledHeight();

                // Allowed range for the image's top-left so the rect stays
                // covered: max edge flush at rect start, min edge flush at end.
                const maxLeft = contentRect.left;
                const minLeft = contentRect.left + contentRect.width - scaledWidth;
                const maxTop = contentRect.top;
                const minTop = contentRect.top + contentRect.height - scaledHeight;

                let left = options.target.left;
                let top = options.target.top;

                if (left > maxLeft) left = maxLeft;
                if (left < minLeft) left = minLeft;
                if (top > maxTop) top = maxTop;
                if (top < minTop) top = minTop;

                if (left !== options.target.left || top !== options.target.top) {
                    options.target.set({ left, top }).setCoords();
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
            this.disableScalingControls(contentImage);

            const clipRect = new fabric.Rect({
                left: contentRect.left,
                top: contentRect.top,
                width: contentRect.width,
                height: contentRect.height,
                absolutePositioned: true,
            });

            // Cover-scale: pick the larger of the two fit ratios so the image
            // always fully covers the content rect on BOTH axes. The clipPath
            // crops whatever overflows. This guarantees no background gap
            // (green border) for any image/canvas aspect-ratio combination.
            const coverScale = Math.max(
                contentRect.width / contentImage.width,
                contentRect.height / contentImage.height
            );
            contentImage.scale(coverScale);

            // Lock the axis that fits exactly; leave the overflowing axis free
            // so the user can still pan the image to reframe it. When the
            // image covers exactly (same aspect) both axes lock.
            const scaledWidth = contentImage.getScaledWidth();
            const scaledHeight = contentImage.getScaledHeight();
            const widthOverflow = scaledWidth - contentRect.width;
            const heightOverflow = scaledHeight - contentRect.height;
            const EPS = 0.5; // sub-pixel tolerance
            contentImage.lockMovementX = widthOverflow <= EPS;
            contentImage.lockMovementY = heightOverflow <= EPS;

            contentImage.clipPath = clipRect;
            canvas.add(contentImage);
            canvas.sendToBack(contentImage);
            // Center the image over the CONTENT RECT (not the whole canvas, so
            // bordered templates stay correct) on both axes. Splitting the
            // overflow evenly keeps the rect fully covered with no gap.
            contentImage.set({
                left: contentRect.left + (contentRect.width - scaledWidth) / 2,
                top: contentRect.top + (contentRect.height - scaledHeight) / 2,
            });
            contentImage.setCoords();
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
    async exportCanvas(format, quality, targetDPI = 200) {
        const screenDPI = 72;
        const maxPixels = 250000000;

        // Make the web fonts canvas-available BEFORE re-measuring/rendering.
        // The 2D canvas only uses a loaded web font after an explicit
        // document.fonts.load() for that exact weight/style — document.fonts.ready
        // and .check() are NOT sufficient. Awaiting the load here makes the
        // export deterministic regardless of how late the font finished loading
        // relative to text being added (fixed fallback glyphs in headless
        // reference runs and guarantees real downloads use Gotham Narrow too).
        if (typeof document !== "undefined" && document.fonts && document.fonts.load) {
            try {
                const fontSpecs = (typeof AppConstants !== "undefined" &&
                    AppConstants.FONTS && AppConstants.FONTS.PRELOAD_FONTS)
                    ? AppConstants.FONTS.PRELOAD_FONTS.map(function (f) {
                        const style = f.style && f.style !== "normal" ? f.style + " " : "";
                        return style + (f.weight || 400) + ' 16px "' + f.family + '"';
                    })
                    : [];
                await Promise.all(fontSpecs.map(function (spec) {
                    return document.fonts.load(spec).catch(function () {});
                }));
            } catch (e) {
                // Non-fatal: fall through to render with whatever is available.
            }
        }

        // Re-measure text with the now-loaded fonts before exporting.
        // Fabric caches a text object's char metrics at creation time; if a
        // web font (Gotham Narrow) finished loading AFTER the text was added, the
        // cached fallback metrics — and thus the exported PNG — stick unless we
        // force a re-measure. This makes the export deterministic regardless of
        // font-load timing (fixes fallback glyphs in headless reference runs).
        canvas.getObjects().forEach(function (obj) {
            if (obj && (obj.type === "text" || obj.type === "i-text" || obj.type === "textbox")) {
                obj.dirty = true;
                if (typeof obj.initDimensions === "function") obj.initDimensions();
                if (typeof obj.setCoords === "function") obj.setCoords();
            }
        });
        canvas.renderAll();

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