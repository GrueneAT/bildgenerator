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
    const wrapperWidth = jQuery(".fabric-canvas-wrapper").width();
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
  const borderDistance = canvas.width / border;
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
  addLogo();

  canvas.renderAll();

  // Update dimensions display if the function exists (from wizard.js)
  if (typeof updateCanvasDimensions === "function") {
    setTimeout(() => {
      updateCanvasDimensions();
    }, 50);
  }
}

function addLogo() {
  if (logo != null) {
    canvas.remove(logo);
    canvas.remove(logoName);
  }

  const scaleTo = (contentRect.width + contentRect.height) / AppConstants.LOGO.SCALE_RATIO;
  logoText = (jQuery("#logo-selection").find(":selected").attr("value") || "")
    .trim()
    .toUpperCase();

  let logoFilename, textScaleTo;
  
  // Check if text needs breaking (either has % or is too long)
  if (logoText.includes("%") || logoText.length > AppConstants.LOGO.MAX_TEXT_LENGTH) {
    logoFilename = AppConstants.LOGO.FILES.LONG;
    
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
    textScaleTo = AppConstants.LOGO.TEXT_SCALE_SHORT;
  }

  if (scaleTo < 121) {
    logoFilename = logoFilename
      .replace("245", "120")
      .replace("248", "121")
      .replace("268", "131");
  }

  fabric.Image.fromURL(
    generatorApplicationURL + "resources/images/logos/" + logoFilename,
    function (image) {
      image.scaleToWidth(scaleTo);
      image.lockMovementX = true;
      image.lockMovementY = true;
      image.top = canvas.height * currentTemplate().logoTop;
      CanvasUtils.disableScalingControls(image);
      image.selectable = false;
      canvas.add(image);
      canvas.centerObjectH(image);
      canvas.bringToFront(image);
      logo = image;

      logoName = new fabric.Text(logoText, {
        top: canvas.height * currentTemplate().logoTextTop,
        fontFamily: AppConstants.FONTS.DEFAULT_LOGO,
        fontSize: Math.floor(image.getScaledWidth() / 10),
        fontStyle: "normal",
        textAlign: "right",
        fill: AppConstants.COLORS.LOGO_TEXT,
        stroke: AppConstants.COLORS.TEXT_STROKE,
        strokeWidth: 0,
        objectCaching: false,
        lineHeight: AppConstants.LOGO.LINE_HEIGHT,
        angle: AppConstants.LOGO.ANGLE,
        selectable: false,
      });

      canvas.add(logoName);

      const linebreak = logoText.lastIndexOf("\n");
      if (linebreak > 17 || logoText.length - linebreak > 17) {
        logoName.scaleToWidth(image.getScaledWidth() * AppConstants.LOGO.WIDTH_SCALE);
        const topAdd = Math.floor((logoName.height - logoName.getScaledHeight()) / 2);
        logoName.top = logoName.top + topAdd;
      } else {
        logoName.width = image.getScaledWidth() * AppConstants.LOGO.WIDTH_SCALE;
      }

      canvas.centerObjectH(logoName);
      CanvasUtils.bringLogoToFront();
      canvas.renderAll();
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
