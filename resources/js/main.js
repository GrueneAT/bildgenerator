// Application state
let canvas;
let contentRect;
let contentImage;
let logo;
let logoName;
let logoText;
let scaleMax;
let template;

// Application URL fallback
if (typeof generatorApplicationURL === "undefined") {
  var generatorApplicationURL = "";
}

// Helper function to scale elements appropriately for the canvas
function scaleElementToFit(element, maxWidthRatio = 0.5, maxHeightRatio = 0.4) {
  const maxWidth = canvas.width * maxWidthRatio;
  const maxHeight = canvas.height * maxHeightRatio;

  // Get the element's current dimensions
  const elementWidth = element.width || element.getScaledWidth();
  const elementHeight = element.height || element.getScaledHeight();

  // Calculate scale factors for both width and height
  const widthScale = maxWidth / elementWidth;
  const heightScale = maxHeight / elementHeight;

  // Use the smaller scale factor to ensure the element fits in both dimensions
  const scale = Math.min(widthScale, heightScale);

  if (element.type === "text") {
    // For text objects, use scaleToWidth but respect height constraints
    if (widthScale < heightScale) {
      element.scaleToWidth(maxWidth);
    } else {
      element.scaleToHeight(maxHeight);
    }
  } else if (element.scaleToWidth && element.scaleToHeight) {
    // For images, use the appropriate scaling method
    if (widthScale < heightScale) {
      element.scaleToWidth(maxWidth);
    } else {
      element.scaleToHeight(maxHeight);
    }
  } else {
    // For other objects like circles, set scale directly
    element.scale(scale);
  }

  // Update object coordinates after scaling
  element.setCoords();
}

// Utility functions
const isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

var template_values = {
  story: {
    width: 1080,
    height: 1920,
    topBorderMultiplier: 2,
    border: 10,
    logoTop: 0.83,
    logoTextTop: 0.9423,
    dpi: 200,
  },
  post: {
    width: 1080,
    height: 1080,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.79,
    logoTextTop: 0.948,
    dpi: 200,
  },
  post_45: {
    width: 1080,
    height: 1350,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.815,
    logoTextTop: 0.959,
    dpi: 200,
  },
  event: {
    width: 1200,
    height: 628,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.678,
    logoTextTop: 0.9,
    dpi: 200,
  },
  facebook_header: {
    width: 1958,
    height: 745,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.6,
    logoTextTop: 0.872,
    dpi: 150,
  },
  a2: {
    width: 4961,
    height: 7016,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.804,
    logoTextTop: 0.929,
    dpi: 150,
  },
  a2_quer: {
    width: 7016,
    height: 4961,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.694,
    logoTextTop: 0.856,
    dpi: 150,
  },
  a3: {
    width: 3508,
    height: 4961,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.804,
    logoTextTop: 0.929,
    dpi: 200,
  },
  a3_quer: {
    width: 4961,
    height: 3508,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.694,
    logoTextTop: 0.856,
    dpi: 200,
  },
  a4: {
    width: 2480,
    height: 3508,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.804,
    logoTextTop: 0.929,
    dpi: 250,
  },
  a4_quer: {
    width: 3508,
    height: 2480,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.694,
    logoTextTop: 0.856,
    dpi: 250,
  },
  a5: {
    width: 1748,
    height: 2480,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.804,
    logoTextTop: 0.929,
    dpi: 300,
  },
  a5_quer: {
    width: 2480,
    height: 1748,
    topBorderMultiplier: 1,
    border: 10,
    logoTop: 0.694,
    logoTextTop: 0.856,
    dpi: 300,
  },
};

function currentTemplate() {
  return template_values[
    jQuery("#canvas-template").find(":selected").attr("value")
  ];
}

function replaceCanvas() {
  template = jQuery("#canvas-template").find(":selected").attr("value");

  // Cleanup existing canvas
  if (canvas) {
    canvas.dispose();
  }

  const currentTemplate = template_values[template];
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
    backgroundColor: "rgba(138, 180, 20)",
    preserveObjectStacking: true,
    targetFindTolerance: 15,
    perPixelTargetFind: true,
  });

  // Setup scale limits
  scaleMax = canvas.width * 0.002;
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
    fill: "rgba(83,132,48)",
    selectable: false,
  });

  canvas.add(contentRect);

  // Initialize canvas features
  resizeCanvas();
  enableSnap();
  enablePictureMove();
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

  scaleTo = (contentRect.width + contentRect.height) / 10;
  logoText = (jQuery("#logo-selection").find(":selected").attr("value") || "")
    .trim()
    .toUpperCase();

  if (logoText.length > 16 || logoText.lastIndexOf("%") > 0) {
    var logoFilename = "Gruene_Logo_245_268.png";
    lastSpace = logoText.lastIndexOf("%");
    if (lastSpace < 0) {
      lastSpace = logoText.lastIndexOf(" ");
    }
    logoText =
      logoText.substring(0, lastSpace) +
      "\n" +
      logoText.substring(lastSpace + 1);
    textScaleTo = 4.8;
  } else {
    var logoFilename = "Gruene_Logo_245_248.png";
    textScaleTo = 6;
  }

  if (scaleTo < 121) {
    logoFilename = logoFilename
      .replace("245", "120")
      .replace("248", "121")
      .replace("268", "131");
  }

  logo_image = fabric.Image.fromURL(
    generatorApplicationURL + "resources/images/logos/" + logoFilename,
    function (image) {
      image.scaleToWidth(scaleTo);
      image.lockMovementX = true;
      image.lockMovementY = true;
      image.top = canvas.height * currentTemplate().logoTop;
      disableScalingControls(image);
      image.selectable = false;
      canvas.add(image);
      canvas.centerObjectH(image);
      canvas.bringToFront(image);
      // canvas.sendToBack(image);
      logo = image;

      // Since fonts are preloaded, we can create logo text directly
      logoName = new fabric.Text(logoText, {
        top: canvas.height * currentTemplate().logoTextTop,
        fontFamily: "Gotham Narrow Bold",
        fontSize: Math.floor(image.getScaledWidth() / 10),
        fontStyle: "normal",
        textAlign: "right",
        fill: "rgb(255,255,255)",
        stroke: "#000000",
        strokeWidth: 0,
        objectCaching: false,
        lineHeight: 0.8,
        angle: -5.5,
        selectable: false,
      });

      canvas.add(logoName);

      linebreak = logoText.lastIndexOf("\n");
      if (linebreak > 17 || logoText.length - linebreak > 17) {
        logoName.scaleToWidth(image.getScaledWidth() * 0.95);
        topAdd = Math.floor((logoName.height - logoName.getScaledHeight()) / 2);
        logoName.top = logoName.top + topAdd;
      } else {
        logoName.width = image.getScaledWidth() * 0.95;
      }
      // logoName.scaleToHeight(image.height/textScaleTo)

      // disableScalingControls(logoName)
      canvas.centerObjectH(logoName);
      logo_to_front();
      canvas.renderAll();
    }
  );
}

function logo_to_front(params) {
  canvas.bringToFront(logo);
  canvas.bringToFront(logoName);
}

function enableScalingUpdates() {
  canvas.on("object:scaling", function (options) {
    console.log("isScaling");
    updateScale(options.target);
  });
}

function enablePictureMove() {
  canvas.on("object:moving", function (options) {
    if (options.target === contentImage) {
      // Relation between uploaded picture and canvas rect as image width/height are unscaled in calculations
      imageRelatedHeight =
        options.target.height * (contentRect.width / contentImage.width);
      imageRelatedWidth =
        options.target.width * (contentRect.height / contentImage.height);

      // Max top and left minus values before images are snapped
      maxTop = contentImage.top - contentRect.top - contentRect.height;
      maxLeft = contentImage.left - contentRect.left - contentRect.width;

      // If image is dragged beyond top, but only if its larger than the height snap it to top
      if (
        options.target.top > contentRect.top &&
        imageRelatedHeight > contentRect.height
      ) {
        options.target
          .set({
            top: contentRect.top,
          })
          .setCoords();
      }

      // If image is dragged beyond left, but only if its wider than the width snap it to left
      if (
        options.target.left > contentRect.left &&
        imageRelatedWidth > contentRect.width
      ) {
        options.target
          .set({
            left: contentRect.left,
          })
          .setCoords();
      }

      // Snap images to Max Top/Left if they get dragged to top or left so the image wouldn't fit anymore
      // First if check is so they aren't triggered accidentally when dragging in the other direction
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
}

function disableScalingControls(object) {
  object.setControlsVisibility({
    mt: false, // middle top disable
    mb: false, // midle bottom
    ml: false, // middle left
    mr: false, // I think you get it
    bl: false,
    br: false,
    tl: false,
    tr: false,
    mtr: false,
  });
}

function relativeScalingControlsOnly(object) {
  object.setControlsVisibility({
    mt: false, // middle top disable
    mb: false, // midle bottom
    ml: false, // middle left
    mr: false, // I think you get it
    bl: true,
    br: true,
    tl: true,
    tr: true,
    mtr: true,
  });
}

function enableSnap() {
  var snapZone = canvas.width / 20;
  canvas.on("object:moving", function (options) {
    if (options.target != contentImage) {
      var objectWidth = options.target.getBoundingRect().width;
      var objectMiddle = options.target.left + objectWidth / 2;
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
}

replaceCanvas();
jQuery("#canvas-template")
  .off("change")
  .on("change", function () {
    replaceCanvas();
    // Update dimensions display if the function exists (from wizard.js)
    if (typeof updateCanvasDimensions === "function") {
      setTimeout(() => {
        updateCanvasDimensions();
      }, 100);
    }
  });
jQuery("#logo-selection")
  .off("change")
  .on("change", function () {
    addLogo();
  });
jQuery("#scale-direction")
  .off("change")
  .on("change", function () {
    positionBackgroundImage();
  });
jQuery("#add-text")
  .off("click")
  .on("click", function () {
    if (jQuery("#text").val() == "") {
      showAlert("Error! Text field is empty");
      return;
    }

    // Since fonts are preloaded, we can create text directly
    const initialFontSize = canvas.width / 2;
    const selectedFont =
      jQuery("#font-style-select").val() || "Gotham Narrow Ultra Italic";
    var text = new fabric.Text(jQuery("#text").val(), {
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

    relativeScalingControlsOnly(text);
    scaleElementToFit(text, 0.8, 0.5);

    canvas.centerObject(text);
    text.set({
      top: canvas.height / 2 - text.getScaledHeight() / 2,
    });

    // Ensure coordinates are properly set after all transformations
    text.setCoords();
    canvas.setActiveObject(text);
    updateScale(text);
    canvas.renderAll();
  });
jQuery("#generate-meme")
  .off("click")
  .on("click", function () {
    if (logoText != "") {
      if (
        confirm(
          "Hast du das Copyright bei Fotos überprüft und angegeben und das Impressum wo notwendig hinzugefügt?"
        )
      ) {
        var currentTemplate = template_values[template];
        var targetDPI = currentTemplate.dpi || 200; // Use template DPI or default 200
        var screenDPI = 72;
        var maxPixels = 250000000; // 250MP browser limit with safety margin

        var baseMultiplier = targetDPI / screenDPI;
        var finalWidth = canvas.width * baseMultiplier;
        var finalHeight = canvas.height * baseMultiplier;
        var totalPixels = finalWidth * finalHeight;

        var actualMultiplier = baseMultiplier;
        var actualDPI = targetDPI;

        if (totalPixels > maxPixels) {
          actualMultiplier = Math.sqrt(
            maxPixels / (canvas.width * canvas.height)
          );
          actualDPI = Math.round(actualMultiplier * screenDPI);
          console.warn(
            `Canvas too large for ${targetDPI} DPI. Reduced to ${actualDPI} DPI for format ${template}`
          );
        }

        try {
          var dataURL = canvas.toDataURL({
            format: jQuery("#image-format").find(":selected").attr("value"),
            quality: parseFloat(
              jQuery("#image-quality").find(":selected").attr("value")
            ),
            multiplier: actualMultiplier,
          });

          if (dataURL === "data:,") {
            throw new Error("Canvas export failed - empty result");
          }

          var link = document.createElement("a");
          link.href = dataURL;
          link.download = createImgName();
          link.click();

          if (actualDPI < targetDPI) {
            alert(
              `Download erfolgreich mit ${actualDPI} DPI (reduziert von ${targetDPI} DPI für Kompatibilität)`
            );
          }
        } catch (error) {
          console.error("Canvas export error:", error);
          alert(
            "Fehler beim Erstellen des Bildes. Das Format ist möglicherweise zu groß für diesen Browser."
          );
        }
      }
    } else {
      alert("Wähle bitte ein Logo aus vor dem Download!");
    }
  });

jQuery("#add-image")
  .off("input")
  .on("input", function () {
    const file = this.files[0];
    const fileType = file["type"];
    jQuery("#add-image").val("");

    if (!isImage(fileType)) {
      showAlert("Error! Invalid Image");
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      var image = new Image();
      image.src = reader.result;
      image.onload = function () {
        fabric.Image.fromURL(
          reader.result,
          function (image) {
            scaleElementToFit(image, 0.5, 0.4);
            relativeScalingControlsOnly(image);
            canvas.add(image).setActiveObject(image);
            canvas.centerObject(image);
            updateScale(image);
            logo_to_front();
          },
          {
            opacity: jQuery("#opacity").val(),
          }
        );
      };
    };
    reader.readAsDataURL(file);
  });
jQuery("#remove-element")
  .off("click")
  .on("click", function () {
    if (
      canvas.getActiveObject() != contentImage &&
      canvas.getActiveObject() != logo
    ) {
      canvas.remove(canvas.getActiveObject());
    }
  });

jQuery("#bring-to-front")
  .off("click")
  .on("click", function () {
    var activeObject = canvas.getActiveObject();
    if (
      activeObject &&
      activeObject != contentImage &&
      activeObject != contentRect
    ) {
      canvas.bringToFront(activeObject);
      // Keep logo always on top
      logo_to_front();
      canvas.renderAll();
    }
  });

jQuery("#add-circle")
  .off("click")
  .on("click", function () {
    var active_image = canvas.getActiveObject();
    var sizeString = jQuery("#circle-radius").val();
    var size = parseInt(sizeString) || 2;

    console.log("=== BUTTON CLICK DEBUG ===");
    console.log("Raw size value from dropdown:", sizeString);
    console.log("Parsed size value:", size);
    console.log("Size type:", typeof size);

    // Check if we have a valid object selected
    if (!active_image) {
      showAlert(
        "Bitte wählen Sie zuerst ein Element aus, um einen Kreis-Ausschnitt anzuwenden.",
        "warning"
      );
      return;
    }

    // Check if it's a valid object type for circle clipping
    var isValidForCircle =
      active_image &&
      active_image !== contentImage &&
      active_image !== contentRect &&
      active_image !== logo &&
      active_image !== logoName &&
      (active_image.type === "image" ||
        active_image.type === "rect" ||
        active_image.type === "circle");

    if (isValidForCircle) {
      // Get the original (unscaled) dimensions of the image
      var originalWidth = active_image.width;
      var originalHeight = active_image.height;
      var smallestOriginalDimension = Math.min(originalHeight, originalWidth);

      console.log("=== CIRCLE DEBUG ===");
      console.log("Selected size value:", size);
      console.log(
        "Original image dimensions:",
        originalWidth,
        "x",
        originalHeight
      );
      console.log(
        "Current scale factors:",
        active_image.scaleX,
        active_image.scaleY
      );
      console.log("Smallest original dimension:", smallestOriginalDimension);

      // Map size values to percentages (90%, 70%, 50%)
      var sizePercentage;
      switch (size) {
        case 2:
          sizePercentage = 0.9;
          break; // Groß - 90%
        case 3:
          sizePercentage = 0.7;
          break; // Mittel - 70%
        case 4:
          sizePercentage = 0.5;
          break; // Klein - 50%
        default:
          sizePercentage = 0.7;
          break; // Default to Mittel
      }

      console.log("Size percentage:", sizePercentage * 100 + "%");

      // Calculate radius based on original dimensions (not scaled)
      // This ensures consistent circle sizes regardless of image scaling
      var radius = (smallestOriginalDimension * sizePercentage) / 2;

      console.log("Calculated radius (original scale):", radius);
      console.log("Circle diameter (original scale):", radius * 2);
      console.log(
        "Circle coverage of original image:",
        (sizePercentage * 100).toFixed(0) + "%"
      );

      if (active_image.clipPath) {
        // Remove existing circle overlay
        active_image.clipPath = null;
      } else {
        // Create circle clip path centered on the object
        // For Fabric.js clipPath, the coordinates are relative to the object's local coordinate system
        // Center the circle at (0,0) which is the object's origin
        var clipPath = new fabric.Circle({
          radius: radius,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
        });

        console.log("Final clipPath circle - radius:", radius);
        console.log("ClipPath centered at object origin (0,0)");

        active_image.clipPath = clipPath;
      }

      canvas.renderAll();
    } else if (active_image === contentImage) {
      showAlert(
        'Kreis-Ausschnitt kann nicht auf das Hintergrundbild angewendet werden. Fügen Sie zuerst ein eigenes Bild über "Bild hinzufügen" ein.',
        "warning"
      );
    } else if (active_image === logo || active_image === logoName) {
      showAlert(
        "Kreis-Ausschnitt kann nicht auf das Logo angewendet werden. Wählen Sie ein eingefügtes Bild aus.",
        "warning"
      );
    } else {
      showAlert(
        "Kreis-Ausschnitt kann nur auf eingefügte Bilder und Elemente angewendet werden. Wählen Sie zuerst ein Element aus.",
        "warning"
      );
    }
  });

jQuery("#add-pink-circle")
  .off("click")
  .on("click", function () {
    radius = contentRect.width / 4;
    var pinkCircle = new fabric.Circle({
      top: contentRect.height / 3,
      left: contentRect.width / 3,
      radius: radius,
      fill: "rgb(225,0,120)",
    });
    scaleElementToFit(pinkCircle, 0.3, 0.3);
    relativeScalingControlsOnly(pinkCircle);
    canvas.add(pinkCircle);
    for (object of canvas.getObjects()) {
      console.log(object);
      console.log(object.get("type"));
      if (object.get("type") == "text") {
        console.log("Front");
        canvas.bringToFront(object);
      }
    }
    canvas.renderAll();
  });

jQuery("#add-cross")
  .off("click")
  .on("click", function () {
    fabric.Image.fromURL(
      generatorApplicationURL + "resources/images/Ankreuzen.png",
      function (image) {
        scaleElementToFit(image, 0.4, 0.3);
        canvas.add(image);
        canvas.centerObject(image);
        canvas.bringToFront(image);
        // canvas.sendToBack(image)
      }
    );
  });

jQuery("#add-qr-code")
  .off("click")
  .on("click", function () {
    const qrText = jQuery("#qr-text").val().trim();

    if (qrText === "") {
      showAlert("Error! QR Code Text field is empty");
      return;
    }

    // Check if QRCode library is available
    if (typeof QRCode === "undefined") {
      showAlert("Error! QR Code library not loaded");
      return;
    }

    // Create a temporary div to generate QR code
    const tempDiv = document.createElement("div");
    tempDiv.style.display = "none";
    document.body.appendChild(tempDiv);

    try {
      // Calculate optimal QR code size based on canvas dimensions
      // Target QR size should be proportional to canvas size for sharpness
      const targetQRSize = Math.max(
        512,
        Math.min(2048, Math.floor(canvas.width / 4))
      );

      // Generate QR code using qrcodejs library
      const qrColor = jQuery("#qr-color").val() || "#000000";
      const qr = new QRCode(tempDiv, {
        text: qrText,
        width: targetQRSize,
        height: targetQRSize,
        colorDark: qrColor,
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });

      // Wait a moment for QR code to be generated, then extract the image
      setTimeout(function () {
        const qrImg = tempDiv.querySelector("img");
        if (qrImg) {
          // Create canvas to add white border (5% of QR size)
          const borderPercent = 0.05;
          const borderSize = Math.floor(targetQRSize * borderPercent);
          const totalSize = targetQRSize + borderSize * 2;

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = totalSize;
          tempCanvas.height = totalSize;
          const ctx = tempCanvas.getContext("2d");

          // Fill with white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, totalSize, totalSize);

          // Draw QR code in center
          ctx.drawImage(
            qrImg,
            borderSize,
            borderSize,
            targetQRSize,
            targetQRSize
          );

          // Add bordered QR code image to canvas
          fabric.Image.fromURL(tempCanvas.toDataURL(), function (qrImage) {
            scaleElementToFit(qrImage, 0.25, 0.25);
            relativeScalingControlsOnly(qrImage);
            canvas.add(qrImage).setActiveObject(qrImage);
            canvas.centerObject(qrImage);
            updateScale(qrImage);
            logo_to_front();

            // Clean up
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

fabric.Object.prototype.set({
  transparentCorners: false,
  cornerColor: "yellow",
  borderColor: "rgba(88,42,114)",
  cornerSize: parseInt(canvas.width) * 0.03,
  cornerStrokeColor: "#000000",
  borderScaleFactor: 2,
  padding: 4,
});

// add event listener handlers to edit methods
loadObjectHandlers();

// Update edit methods values to the selected canvas text
canvas.on({
  "selection:created": updateInputs,
  "selection:updated": updateInputs,
  "selection:cleared": enableTextMethods,
});

function processMeme(memeInfo) {
  // Add meme template as canvas background
  fabric.Image.fromURL(
    `${memeInfo.url}`,
    function (meme) {
      if (contentImage != null) {
        canvas.remove(contentImage);
      }
      contentImage = meme;
      positionBackgroundImage();
    },
    {
      crossOrigin: "anonymous",
    }
  );
}

function positionBackgroundImage() {
  if (contentImage != null) {
    canvas.remove(contentRect);
    canvas.remove(contentImage);
    widthRelation = contentRect.width / contentImage.width;
    originalHeight = contentImage.height;
    contentImage = contentImage;
    contentImage.selectable = true;
    contentImage.top = contentRect.top;
    contentImage.left = contentRect.left;
    disableScalingControls(contentImage);

    let clipRect = new fabric.Rect({
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
    if (isValidJSON(logoDataOverride)) {
      generateLogoSelection(jQuery.parseJSON(logoDataOverride));
      return;
    }
  }

  if (typeof logoIndexOverride !== "undefined") {
    logoIndex = logoIndexOverride;
  } else {
    logoIndex = defaultIndex;
  }

  jQuery.getJSON(logoIndex, function (data) {
    generateLogoSelection(data);
  }).fail(function(jqxhr, textStatus, error) {
    console.error("Failed to load logo data:", textStatus, error);
    // Show user-friendly error message
    if (typeof showAlert === "function") {
      showAlert("Fehler beim Laden der Logo-Daten. Bitte Seite neu laden.", "warning");
    }
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
