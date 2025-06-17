// Font management
function loadFont(font) {
    const customFonts = ['Gotham Narrow'];
    const text = canvas.getActiveObject();
    
    if (!text) return;
    
    if (customFonts.includes(font)) {
        const fontObserver = new FontFaceObserver(font);
        fontObserver.load().then(function () {
            text.set("fontFamily", "");
            text.set("fontFamily", font);
            canvas.renderAll();
        });
    } else {
        text.set("fontFamily", font);
        canvas.renderAll();
    }
}

// UI state management
function updateInputs() {
    const activeObject = canvas.getActiveObject();

    if (activeObject && activeObject.get('type') === "text") {
        enableTextMethods();
        jQuery('#text').val(activeObject.text);
        jQuery('#text-color').val(activeObject.fill);
        jQuery('#font-style-select').val(activeObject.fontFamily);
        jQuery(`input[value="${activeObject.textAlign}"]`).parent().trigger('update-status');
        updateScale(activeObject);
    }
}

function updateScale(activeObject) {
    const scale = Number(parseFloat(activeObject.scaleX)).toFixed(2);
    jQuery('#scale').val(scale);
}

// Event handler utility
function bindHandler(selector, event, handler) {
    jQuery(selector).off(event).on(event, handler);
}

// Section toggle functionality
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const chevron = document.getElementById(sectionId + '-chevron');
    const button = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`);
    
    if (section.style.display === 'none' || section.classList.contains('hidden')) {
        // Show section
        section.style.display = 'block';
        section.classList.remove('hidden');
        chevron.style.transform = 'rotate(0deg)';
        button.setAttribute('aria-expanded', 'true');
    } else {
        // Hide section
        section.style.display = 'none';
        section.classList.add('hidden');
        chevron.style.transform = 'rotate(-90deg)';
        button.setAttribute('aria-expanded', 'false');
    }
}

// Canvas object event handlers
function loadObjectHandlers() {
    bindHandler('#text', 'input', function () {
        setValue("text", jQuery(this).val());
    });

    bindHandler('#scale', 'input', function () {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject !== contentImage) {
            activeObject.scale(parseFloat(this.value)).setCoords();
            canvas.renderAll();
            updateScale(activeObject);
        }
    });

    bindHandler('#text-color', 'change', function () {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.get('type') === "text") {
            setValue("fill", jQuery(this).find(":selected").attr('value'));
        }
    });

    bindHandler('input[name="align"]', 'change', function () {
        const alignValue = jQuery(this).attr('id');
        console.log('Text alignment changed to:', alignValue);
        setValue("textAlign", alignValue);
        
        // Also trigger visual update
        jQuery(this).parent().trigger('update-status');
    });

    bindHandler('#stroke-width', 'input', function () {
        const width = jQuery(this).val();
        setValue("strokeWidth", width == 0 ? null : width);
    });

    bindHandler('#shadow-depth', 'input', function () {
        setValue("shadow", createShadow('black', jQuery(this).val()));
    });

    bindHandler('#font-style-select', 'change', function () {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.get('type') === "text") {
            const selectedFont = jQuery(this).val();
            setValue("fontFamily", selectedFont);
        }
    });
}

/*****************************
 * Handle edit buttons style *
*****************************/

// Update style of font-style buttons
jQuery('.edit-btn').on('update-status', function () {
    if (jQuery(this).attr('data') == '') {
        jQuery(this).removeClass('active')
    } else {
        jQuery(this).addClass('active')
    }
})

//  Toggle font-style buttons
jQuery('#font-style .btn').on('click', function () {
    if (jQuery(this).attr('data') == '') {
        jQuery(this).addClass('active')
        jQuery(this).attr('data', jQuery(this).attr('value'))
    } else {
        jQuery(this).removeClass('active')
        jQuery(this).attr('data', '')
    }
    jQuery(this).trigger('change-value')
})

// Update style of text align buttons
jQuery('.align').on('update-status', function () {
    jQuery('.align').removeClass('active')
    jQuery(this).addClass('active')
})