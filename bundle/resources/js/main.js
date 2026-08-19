// Application state
let canvas;
let contentRect;
let contentImage;
let logo;
let logoName;
let logoText;
let scaleMax;
let template;

// Application URL fallback - must be preserved for external scripts
if (typeof generatorApplicationURL === "undefined") {
  var generatorApplicationURL = "";
}

// Explicitly expose generatorApplicationURL to prevent minification
window.generatorApplicationURL = generatorApplicationURL;

function replaceCanvas() {
  template = jQuery("#canvas-template").find(":selected").attr("value");

  // Cleanup existing canvas
  if (canvas) {
    canvas.dispose();
  }

  const currentTemplate = TemplateConstants.getTemplate(template);
  const { width, height, topBorderMultiplier, border } = currentTemplate;

  // Setup responsive canvas container
  function resizeCanvas() {
    const wrapperWidth = jQuery(".app-canvas-wrapper").width();
    const $container = jQuery(".canvas-container");
    $container.css({
      width: wrapperWidth,
      height: (wrapperWidth * height) / width,
    });
  }

  jQuery(window).off("resize.canvas").on("resize.canvas", resizeCanvas);

  // Initialize fabric canvas
  canvas = new fabric.Canvas("meme-canvas", {
    width,
    height,
    selection: true,
    allowTouchScrolling: true,
    backgroundColor: AppConstants.COLORS.BACKGROUND_PRIMARY,
    preserveObjectStacking: true,
    targetFindTolerance: AppConstants.CANVAS.TARGET_FIND_TOLERANCE,
    perPixelTargetFind: true,
  });

  // Setup scale limits
  scaleMax = canvas.width * AppConstants.CANVAS.SCALE_MAX_MULTIPLIER;
  jQuery("#scale").attr("max", scaleMax);

  // Calculate border distances
  // For borderless templates (border: 0), borderDistance should be 0
  const borderDistance = border > 0 ? canvas.width / border : 0;
  const topDistance = borderDistance * topBorderMultiplier;

  // Create content rectangle
  contentRect = new fabric.Rect({
    top: topDistance,
    left: borderDistance,
    width: canvas.width - borderDistance * 2,
    height: canvas.height - (topDistance + borderDistance),
    fill: AppConstants.COLORS.BACKGROUND_SECONDARY,
    selectable: false,
  });

  canvas.add(contentRect);

  // Initialize canvas features
  console.log('[replaceCanvas] Initializing canvas features with canvas:', canvas ? 'defined' : 'undefined');
  resizeCanvas();
  CanvasUtils.enableSnap(canvas);
  CanvasUtils.enableRotationSnap(canvas);
  CanvasUtils.enablePictureMove(canvas);
  enableScalingUpdates();

  // Only add logo if enabled
  if (LogoState.isLogoEnabled()) {
    addLogo();
  }

  canvas.renderAll();

  // Keep the globally exposed reference pointing at the live canvas. Without
  // this, window.canvas only ever tracked the first canvas built during setup;
  // every later template switch replaced the internal canvas but left the
  // global stale, so tooling and tests reading window.canvas saw a disposed,
  // empty instance after any non-default template was selected.
  window.canvas = canvas;
  window.contentRect = contentRect;

  // Update dimensions display if the function exists (from wizard.js)
  if (typeof updateCanvasDimensions === "function") {
    setTimeout(() => {
      updateCanvasDimensions();
    }, 50);
  }
}

/**
 * Calculate the optimal logo top position based on template configuration.
 * All templates are borderless (border: 0).
 * Logo bottom margin is BORDERLESS_MARGIN_PERCENT of canvas height.
 */
function calculateLogoTop(logoHeight, template) {
  // Validate inputs
  if (!canvas || !template) {
    console.error('calculateLogoTop: canvas or template is not defined');
    return 0;
  }

  if (typeof logoHeight !== 'number' || logoHeight <= 0) {
    console.error('calculateLogoTop: invalid logoHeight', logoHeight);
    return 0;
  }

  const marginFromBottom = canvas.height * AppConstants.LOGO.BORDERLESS_MARGIN_PERCENT;
  const logoBottom = canvas.height - marginFromBottom;
  const logoTop = logoBottom - logoHeight;
  return logoTop;
}

function addLogo() {
  // If logo is disabled, remove existing logo and return early
  if (!LogoState.isLogoEnabled()) {
    if (logo != null) {
      canvas.remove(logo);
      canvas.remove(logoName);
      logo = null;
      logoName = null;
      canvas.renderAll();
    }
    return;
  }

  if (logo != null) {
    canvas.remove(logo);
    canvas.remove(logoName);
  }

  const template = currentTemplate();
  const scaleTo = template.logoWidth;
  logoText = (jQuery("#logo-selection").find(":selected").attr("value") || "")
    .trim()
    .toUpperCase();

  let logoFilename, textScaleTo, isLongLogo;

  // Check if text needs breaking (either has % or is too long)
  if (logoText.includes("%") || logoText.length > AppConstants.LOGO.MAX_TEXT_LENGTH) {
    logoFilename = AppConstants.LOGO.FILES.LONG;
    isLongLogo = true;

    if (logoText.includes("%")) {
      // Split by % and trim each part to remove whitespace
      const parts = logoText.split("%").map(part => part.trim());
      logoText = parts.join("\n");
    } else if (logoText.length > AppConstants.LOGO.MAX_TEXT_LENGTH) {
      // For long names without %, break at last space
      const lastSpace = logoText.lastIndexOf(" ");
      if (lastSpace > 0) {
        logoText = logoText.substring(0, lastSpace).trim() + "\n" +
                   logoText.substring(lastSpace).trim();
      }
    }

    textScaleTo = AppConstants.LOGO.TEXT_SCALE_LONG;
  } else {
    logoFilename = AppConstants.LOGO.FILES.SHORT;
    isLongLogo = false;
    textScaleTo = AppConstants.LOGO.TEXT_SCALE_SHORT;
  }

  fabric.Image.fromURL(
    generatorApplicationURL + "resources/images/logos/" + logoFilename,
    function (image) {
      // Error handling: Check if image loaded successfully
      if (!image || !image.width || !image.height) {
        console.error('Failed to load logo image:', logoFilename);
        return;
      }

      try {
        image.scaleToWidth(scaleTo);
        image.lockMovementX = true;
        image.lockMovementY = true;

        // Calculate optimal logo position automatically based on template type
        const logoHeight = image.getScaledHeight();
        image.top = calculateLogoTop(logoHeight, template);

        CanvasUtils.disableScalingControls(image);
        image.selectable = false;
        canvas.add(image);
        canvas.centerObjectH(image);
        canvas.bringToFront(image);

        // Calculate text position relative to logo top
        // Using logo WIDTH as reference since it's constant between short and long logos
        const barOffset = isLongLogo ? AppConstants.LOGO.BAR_OFFSET_FROM_TOP_LONG : AppConstants.LOGO.BAR_OFFSET_FROM_TOP;
        const offsetFromTop = image.getScaledWidth() * barOffset;
        const textTopPosition = image.top + offsetFromTop;

        // The region name is a transparent KNOCKOUT cut out of the white bar,
        // NOT solid green fill. The text uses 'destination-out' compositing so it
        // erases the bar pixels of the (white) logo. Because the text and the logo
        // image live in a single cached fabric.Group, that erase happens inside the
        // group's own offscreen cache: the letters become genuinely transparent in
        // the cache, and whatever is BEHIND the logo (the green canvas or an
        // uploaded background photo) shows through them once the group is composited
        // onto the canvas. A plain destination-out on a loose text object would
        // instead punch a hole straight through to nothing; isolating it in the
        // group is what makes it a true knockout limited to the bar.
        logoName = new fabric.Text(logoText, {
          top: textTopPosition,
          fontFamily: AppConstants.FONTS.DEFAULT_LOGO,
          fontSize: Math.floor(image.getScaledWidth() / 10),
          fontWeight: AppConstants.FONTS.WEIGHT_LOGO,
          charSpacing: AppConstants.FONTS.CHAR_SPACING,
          fontStyle: "normal",
          textAlign: "right",
          // fill is irrelevant under destination-out (only the text's alpha
          // matters), but a solid opaque fill keeps the erase crisp.
          fill: AppConstants.COLORS.LOGO_KNOCKOUT,
          stroke: AppConstants.COLORS.TEXT_STROKE,
          strokeWidth: 0,
          objectCaching: false,
          lineHeight: AppConstants.LOGO.LINE_HEIGHT,
          angle: AppConstants.LOGO.ANGLE,
          selectable: false,
          globalCompositeOperation: "destination-out",
        });

        // Add the text to the canvas only to size/position it with the exact same
        // logic as before; it is removed again before grouping so the knockout is
        // not double-rendered.
        canvas.add(logoName);

        // Fit the region name to the bar by ACTUAL rendered width, not by a
        // character-count heuristic. Some names that stay on one line (e.g.
        // "OBERHOFEN/IRRSEE", or any name without a space to break on) are still
        // wider than the bar; the old length check left them unscaled so the
        // right-aligned text overflowed and clipped the leading letter. Whenever
        // the text is wider than the available bar width we scale it down to fit;
        // otherwise we keep its natural size and just set the box width so the
        // right-alignment/centering stays unchanged for names that already fit.
        const availableWidth = image.getScaledWidth() * AppConstants.LOGO.WIDTH_SCALE;
        if (logoName.getScaledWidth() > availableWidth) {
          logoName.scaleToWidth(availableWidth);
          const topAdd = Math.floor((logoName.height - logoName.getScaledHeight()) / 2);
          logoName.top = logoName.top + topAdd;
        } else {
          logoName.width = availableWidth;
        }

        canvas.centerObjectH(logoName);

        // Combine the white logo image and the knockout text into one cached group.
        // Fabric recomputes each child's coordinates relative to the group, so the
        // absolute positioning computed above is preserved. objectCaching:true makes
        // the group render to its own cache, where the destination-out text cuts the
        // letters out of the white bar before the group is drawn to the canvas.
        canvas.remove(image);
        canvas.remove(logoName);

        const knockoutGroup = new fabric.Group([image, logoName], {
          selectable: false,
          objectCaching: true,
          lockMovementX: true,
          lockMovementY: true,
        });
        canvas.centerObjectH(knockoutGroup);

        // FLATTEN the destination-out group into a single PNG with real
        // transparent letter-holes, then place THAT plain image on the canvas.
        // Rationale: a live destination-out object renders fine in the editor but
        // the high-DPI download (canvas.toDataURL({multiplier})) re-renders it and
        // leaks the erase to solid BLACK. A plain image with baked alpha holes
        // scales cleanly at any export multiplier — the background (green canvas or
        // photo) shows through the holes both on screen and in the download.
        // Bake at the logo's native resolution so the upscaled export stays crisp.
        const gx = knockoutGroup.left;
        const gy = knockoutGroup.top;
        const gw = knockoutGroup.getScaledWidth();
        const nativeMultiplier = Math.max(1, (image.width || gw) / gw);
        const flatUrl = knockoutGroup.toDataURL({
          format: "png",
          multiplier: nativeMultiplier,
          enableRetinaScaling: false,
        });

        fabric.Image.fromURL(flatUrl, function (flat) {
          flat.set({ left: gx, top: gy });
          flat.scaleToWidth(gw);
          flat.selectable = false;
          flat.lockMovementX = true;
          flat.lockMovementY = true;
          CanvasUtils.disableScalingControls(flat);
          logo = flat;
          logoName = null;
          canvas.add(flat);
          CanvasUtils.bringLogoToFront();
          canvas.renderAll();
        });
      } catch (error) {
        console.error('Error while adding logo to canvas:', error);
      }
    },
    null, // crossOrigin
    {
      // Error callback for image loading failure
      onError: function() {
        console.error('Failed to load logo image file:', logoFilename);
      }
    }
  );
}

function logo_to_front() {
  CanvasUtils.bringLogoToFront();
}

function enableScalingUpdates() {
  canvas.on("object:scaling", function (options) {
    console.log("isScaling");
    updateScale(options.target);
  });
}

function enablePictureMove() {
  CanvasUtils.enablePictureMove(canvas);
}

function disableScalingControls(object) {
  CanvasUtils.disableScalingControls(object);
}

function relativeScalingControlsOnly(object) {
  CanvasUtils.relativeScalingControlsOnly(object);
}

function enableSnap() {
  CanvasUtils.enableSnap(canvas);
}

// Application initialization function - called after fabric is ready
function initializeApplication() {
  // Initialize canvas first
  replaceCanvas();
  
  // Initialize fabric object defaults
  fabric.Object.prototype.set({
    transparentCorners: false,
    cornerColor: AppConstants.COLORS.CORNER_COLOR,
    borderColor: AppConstants.COLORS.BORDER_COLOR,
    cornerSize: parseInt(canvas.width) * AppConstants.CANVAS.CORNER_SIZE_MULTIPLIER,
    cornerStrokeColor: AppConstants.COLORS.CORNER_STROKE,
    borderScaleFactor: AppConstants.CANVAS.BORDER_SCALE_FACTOR,
    padding: AppConstants.CANVAS.PADDING,
  });

  // Initialize all event handlers
  EventHandlerUtils.initializeAllHandlers();

  // Update edit methods values to the selected canvas text
  canvas.on({
    "selection:created": updateInputs,
    "selection:updated": updateInputs,
    "selection:cleared": enableTextMethods,
  });

  // Expose canvas and other functions to global scope for testing
  window.canvas = canvas;
  window.processMeme = processMeme;
  window.contentImage = contentImage;
  window.contentRect = contentRect;
  window.logo = logo;
  window.logoName = logoName;
}

function processMeme(memeInfo) {
  // Add meme template as canvas background
  fabric.Image.fromURL(
    `${memeInfo.url}`,
    function (meme) {
      if (contentImage != null) {
        canvas.remove(contentImage);
      }
      contentImage = meme;
      // Update global reference for testing
      window.contentImage = contentImage;
      positionBackgroundImage();
    },
    {
      crossOrigin: "anonymous",
    }
  );
}

function positionBackgroundImage() {
  CanvasUtils.positionBackgroundImage();
}

function generateLogoSelection(data) {
  const $logoSelect = jQuery("#logo-selection");

  jQuery.each(data, function (index, names) {
    var items = [];
    jQuery.each(names.sort(), function (index, name) {
      items.push(
        '<option value="' +
          name.toUpperCase() +
          '">' +
          name.replace("%", " ").toUpperCase() +
          "</option>"
      );
    });
    $logoSelect.append(
      '<optgroup label="' + index + '">' + items.join("") + "</optgroup>"
    );
  });

  // Refresh the searchable select component
  const searchableSelect = $logoSelect.data("searchable-select");
  if (searchableSelect) {
    searchableSelect.refresh();
  }
}

function loadLogoSelection() {
  // Check for embedded logo data first (production mode)
  if (typeof window.EMBEDDED_LOGO_DATA !== "undefined") {
    console.log("Using embedded logo data for faster loading");
    generateLogoSelection(window.EMBEDDED_LOGO_DATA);
    return;
  }

  // Fallback to AJAX loading (development mode)
  console.log("Loading logo data via AJAX request");
  const defaultIndex =
    generatorApplicationURL + "resources/images/logos/index.json";

  if (typeof logoDataOverride !== "undefined") {
    if (ValidationUtils.isValidJSON(logoDataOverride)) {
      generateLogoSelection(jQuery.parseJSON(logoDataOverride));
      return;
    }
  }

  let logoIndex;
  if (typeof logoIndexOverride !== "undefined") {
    logoIndex = logoIndexOverride;
  } else {
    logoIndex = defaultIndex;
  }

  jQuery
    .getJSON(logoIndex, function (data) {
      generateLogoSelection(data);
    })
    .fail(function (jqxhr, textStatus, error) {
      console.error("Failed to load logo data:", textStatus, error);
      showAlert(
        "Fehler beim Laden der Logo-Daten. Bitte Seite neu laden.",
        "warning"
      );
    });
}

loadLogoSelection();

function autoPlayYouTubeModal() {
  var trigger = jQuery("body").find('[data-toggle="modal"]');
  trigger.click(function () {
    var theModal = jQuery(this).data("target"),
      videoSRC = jQuery(this).attr("data-theVideo"),
      videoSRCauto = videoSRC + "?autoplay=1";
    jQuery(theModal + " iframe").attr("src", videoSRCauto);
    jQuery(theModal + " button.close").click(function () {
      jQuery(theModal + " iframe").attr("src", videoSRC);
    });
  });
}
jQuery(document).ready(function () {
  autoPlayYouTubeModal();
});
