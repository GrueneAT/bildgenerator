/**
 * Bildgenerator — programmatic entry point (window.Bildgenerator).
 *
 * Covers everything the two tools on this page can do: the image generator
 * (template, logo, background, text, shapes, images, QR on the image, export)
 * and the standalone QR generator.
 *
 * WHY THIS EXISTS
 *
 * The wizard is built for people. State lives in form controls, steps hide and
 * show one another, sections start collapsed, and the logo select sits behind a
 * search box that keeps its own label. Driving that from outside — a headless
 * browser, an AI assistant with a browser sandbox — means knowing a handful of
 * things the markup does not reveal:
 *
 *   1. #meme-input is the background-image FILE upload, not a text field.
 *   2. Text goes into #text and is committed with #add-text — and the section
 *      holding both starts collapsed, as do the element and QR sections.
 *   3. #logo-selection is a hidden <select> behind a search box that fires
 *      'change' itself; dispatching another one adds the logo twice.
 *   4. CanvasUtils.exportCanvas() resolves to { dataURL, actualDPI, targetDPI },
 *      not to a string.
 *   5. #add-circle does not add a circle — it CROPS the selected object into
 *      one. The circle you can add is #add-pink-circle.
 *   6. #add-image takes a File, so a caller holding a data: URL has to build
 *      one before the handler will look at it.
 *
 * NOT A SECOND RENDERER. Every method drives the same objects and handlers the
 * UI drives, so there is exactly one rendering path and the visual regression
 * suite still covers it. The gain is coupling: when the wizard changes, the
 * breakage surfaces in e2e/api.spec.js instead of in somebody else's script.
 */
const Bildgenerator = {
    VERSION: 2,

    // ---------------------------------------------------------------- lookup

    /** Template names accepted by setTemplate / render({ template }). */
    templates() {
        return Object.keys(TemplateConstants.TEMPLATES);
    },

    /** Organisation values accepted by setLogo / render({ logo }). */
    logos() {
        return this._optionValues("#logo-selection");
    },

    /**
     * Every remaining choice, read from the live controls rather than hardcoded
     * — a new colour in the markup shows up here without touching this file.
     */
    options() {
        return {
            textColors: this._optionValues("#text-color"),
            fontStyles: AppConstants.FONTS.OPTIONS.map(function (o) { return o.id; }),
            lineHeights: this._optionValues("#line-height"),
            alignments: ["left", "center", "right"],
            shapes: ["pinkCircle", "cross"],
            clipSizes: this._optionValues("#circle-radius"),
            qrColorsOnImage: this._optionValues("#qr-color"),
            qrColors: this._optionValues("#qr-color-select"),
            qrBackgrounds: this._optionValues("#qr-background-select"),
            formats: ["png", "jpeg"],
        };
    },

    // ----------------------------------------------------------- step 1: format

    /**
     * Select a template and wait until the canvas has been rebuilt at its
     * dimensions. The change replaces the canvas and discards everything on it,
     * so this belongs first.
     */
    async setTemplate(name) {
        const template = TemplateConstants.getTemplate(name);
        if (!template) {
            throw new Error(
                `Unknown template "${name}". Available: ${this.templates().join(", ")}`
            );
        }
        jQuery("#canvas-template").val(name).trigger("change");
        await this._waitFor(
            () => canvas && canvas.width === template.width && canvas.height === template.height,
            `canvas to be rebuilt at ${template.width}x${template.height}`
        );
        // Matching dimensions are not the end of it: replaceCanvas() re-adds the
        // logo asynchronously afterwards. Returning here would let the next call
        // race that load and stack a second logo on the first.
        await this._waitUntilQuiet();
        return this;
    },

    /** Turn the automatic organisation logo on or off. */
    async setLogoEnabled(enabled) {
        LogoState.setLogoEnabled(Boolean(enabled));
        // addLogo() reads the state itself: it removes the placed logo when the
        // feature is off and re-adds it when it is on.
        addLogo();
        await this._waitUntilQuiet();
        return this;
    },

    /**
     * Place an organisation logo. Sets the value and fires exactly one change
     * event — the handler behind it adds the logo, so a second event would
     * stack a duplicate on the first.
     */
    async setLogo(value) {
        if (!this.logos().includes(value)) {
            throw new Error(`Unknown logo "${value}". See Bildgenerator.logos().`);
        }
        LogoState.setLogoEnabled(true);
        jQuery("#logo-selection").val(value).trigger("change");
        // addLogo() loads the logo, bakes the knockout and loads the result
        // again — two async hops with no completion signal. window.logo is no
        // help: main.js snapshots it once during init and never syncs it.
        await this._waitUntilQuiet();
        return this;
    },

    // ------------------------------------------------------- step 2: background

    /**
     * Set the background image from a data: URL or an absolute URL. Goes
     * straight to processMeme() rather than through the #meme-input file
     * picker, so callers never have to synthesise a File.
     */
    async setBackground(url) {
        if (typeof url !== "string" || !url) {
            throw new Error("setBackground() needs a data: URL or an absolute URL");
        }
        processMeme({ url: url });
        await this._waitFor(() => !!window.contentImage, "background image to load");
        await this._waitUntilQuiet();
        return this;
    },

    // ----------------------------------------------------------- step 3: design

    /**
     * Add a headline.
     *
     * @param {string} text
     * @param {Object} [options]
     * @param {string} [options.color]      value from options().textColors
     * @param {string} [options.fontStyle]  id from options().fontStyles
     * @param {string} [options.align]      left | center | right
     * @param {string} [options.lineHeight] value from options().lineHeights
     * @param {number} [options.shadow]     shadow depth
     */
    async addText(text, options) {
        const opts = options || {};
        const validation = ValidationUtils.validateTextInput(text);
        if (!validation.isValid) {
            throw new Error(`Invalid text: ${validation.error}`);
        }

        this._openSection("text-section");

        if (opts.color) jQuery("#text-color").val(opts.color);
        if (opts.fontStyle) jQuery("#font-style-select").val(opts.fontStyle);
        if (opts.align) jQuery(`input[name="align"]#${opts.align}`).prop("checked", true);
        if (opts.lineHeight) jQuery("#line-height").val(opts.lineHeight);
        if (typeof opts.shadow === "number") jQuery("#shadow-depth").val(opts.shadow);

        const before = canvas.getObjects().length;
        jQuery("#text").val(text);
        jQuery("#add-text").trigger("click");
        await this._waitFor(
            () => canvas.getObjects().length > before,
            "text object to be added to the canvas"
        );
        await this._waitUntilQuiet();
        return this;
    },

    /**
     * Add a decorative element: 'pinkCircle' (magenta circle) or 'cross' (the
     * Wahlkreuz). Note that the UI's circle button does something else
     * entirely — see clipToCircle().
     */
    async addShape(kind) {
        const buttons = { pinkCircle: "#add-pink-circle", cross: "#add-cross" };
        const selector = buttons[kind];
        if (!selector) {
            throw new Error(
                `Unknown shape "${kind}". Available: ${Object.keys(buttons).join(", ")}`
            );
        }
        this._openSection("elements-section");
        const before = canvas.getObjects().length;
        jQuery(selector).trigger("click");
        await this._waitFor(
            () => canvas.getObjects().length > before,
            `shape "${kind}" to be added`
        );
        await this._waitUntilQuiet();
        return this;
    },

    /**
     * Add a free-standing image on top of the design (not the background).
     * The handler reads a File from the input, so the URL is wrapped in one
     * here rather than bypassing the app's own validation.
     */
    async addImage(url) {
        if (typeof url !== "string" || !url) {
            throw new Error("addImage() needs a data: URL or an absolute URL");
        }
        this._openSection("elements-section");

        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], "bild.png", { type: blob.type || "image/png" });
        const transfer = new DataTransfer();
        transfer.items.add(file);

        const input = document.getElementById("add-image");
        input.files = transfer.files;

        const before = canvas.getObjects().length;
        jQuery(input).trigger("input");
        await this._waitFor(
            () => canvas.getObjects().length > before,
            "image to be added to the canvas"
        );
        await this._waitUntilQuiet();
        return this;
    },

    /**
     * Crop the most recently added object into a circle. This is what the UI
     * labels "Kreis": it does not add anything, it clips what is selected.
     *
     * @param {string|number} [size] value from options().clipSizes
     *                               (2 = gross 90%, 3 = mittel 70%, 4 = klein 50%)
     */
    async clipToCircle(size) {
        this._openSection("elements-section");
        const objects = canvas.getObjects();
        if (!canvas.getActiveObject() && objects.length) {
            canvas.setActiveObject(objects[objects.length - 1]);
        }
        if (size) jQuery("#circle-radius").val(String(size));
        jQuery("#add-circle").trigger("click");
        await this._waitUntilQuiet();
        return this;
    },

    /**
     * Place a QR code on the image.
     *
     * @param {Object} spec
     * @param {string} spec.text    the encoded content
     * @param {string} [spec.color] value from options().qrColorsOnImage
     */
    async addQRCode(spec) {
        const opts = spec || {};
        if (!opts.text) throw new Error("addQRCode() needs { text }");

        this._openSection("qr-section", "#show-qr-section");

        if (opts.color) jQuery("#qr-color").val(opts.color);
        const before = canvas.getObjects().length;
        jQuery("#qr-text").val(opts.text);
        jQuery("#add-qr-code").trigger("click");
        await this._waitFor(
            () => canvas.getObjects().length > before,
            "QR code to be added to the canvas"
        );
        await this._waitUntilQuiet();
        return this;
    },

    // ----------------------------------------------------------- step 4: export

    /**
     * Export the canvas. Unwraps CanvasUtils.exportCanvas() and reports the
     * pixel dimensions the caller actually gets — the template's dimensions
     * multiplied by dpi/72.
     *
     * @param {Object} [options]
     * @param {string} [options.format='png']  png | jpeg
     * @param {number} [options.quality=1]     0-1, only meaningful for jpeg
     * @param {number} [options.dpi=200]
     */
    async export(options) {
        const opts = options || {};
        const result = await CanvasUtils.exportCanvas(
            opts.format || "png",
            typeof opts.quality === "number" ? opts.quality : 1,
            typeof opts.dpi === "number" ? opts.dpi : 200
        );
        const scale = result.actualDPI / 72;
        return {
            dataURL: result.dataURL,
            width: Math.round(canvas.width * scale),
            height: Math.round(canvas.height * scale),
            dpi: result.actualDPI,
        };
    },

    // ------------------------------------------------------------ all at once

    /**
     * Build one image end to end. Order matters and is fixed here: the template
     * rebuilds the canvas, the background sits behind everything, and the rest
     * is centred against what is already there. Text goes last so it stays on
     * top of the elements.
     *
     * @param {Object} spec
     * @param {string}   spec.template      from templates()
     * @param {string}   [spec.background]  data: URL or absolute URL
     * @param {string}   [spec.logo]        from logos()
     * @param {boolean}  [spec.logoEnabled] false to leave the logo off
     * @param {string}   [spec.text]        headline
     * @param {string}   [spec.textColor]   from options().textColors
     * @param {string}   [spec.fontStyle]   from options().fontStyles
     * @param {string}   [spec.align]       left | center | right
     * @param {string}   [spec.lineHeight]  from options().lineHeights
     * @param {number}   [spec.shadow]      shadow depth
     * @param {string[]} [spec.shapes]      any of options().shapes
     * @param {string[]} [spec.images]      data: or absolute URLs
     * @param {Object}   [spec.qr]          { text, color } — QR on the image
     * @param {string}   [spec.format='png']
     * @param {number}   [spec.quality]
     * @param {number}   [spec.dpi=200]
     * @returns {Promise<{dataURL: string, width: number, height: number, dpi: number}>}
     */
    async render(spec) {
        if (!spec || typeof spec !== "object" || !spec.template) {
            throw new Error("render() needs at least { template }");
        }
        await this.setTemplate(spec.template);
        if (spec.logoEnabled === false) await this.setLogoEnabled(false);
        if (spec.background) await this.setBackground(spec.background);
        if (spec.logo) await this.setLogo(spec.logo);

        for (const url of spec.images || []) {
            await this.addImage(url);
        }
        for (const shape of spec.shapes || []) {
            await this.addShape(shape);
        }
        if (spec.qr) await this.addQRCode(spec.qr);
        if (spec.text) {
            await this.addText(spec.text, {
                color: spec.textColor,
                fontStyle: spec.fontStyle,
                align: spec.align,
                lineHeight: spec.lineHeight,
                shadow: spec.shadow,
            });
        }
        return this.export({
            format: spec.format,
            quality: spec.quality,
            dpi: spec.dpi,
        });
    },

    // ------------------------------------------------ standalone QR generator

    /**
     * The second tool on this page: a QR code on its own, not placed on an
     * image. Calls the generator directly instead of walking its three-step
     * wizard — the wizard only collects these same values.
     *
     * @param {Object} spec
     * @param {string} spec.data         encoded content (URL, text, mailto:, vCard)
     * @param {string} [spec.color]      from options().qrColors
     * @param {string} [spec.background] from options().qrBackgrounds ('transparent' allowed)
     * @returns {Promise<{dataURL: string, width: number, height: number}>}
     */
    async renderQRCode(spec) {
        const opts = spec || {};
        if (!opts.data) throw new Error("renderQRCode() needs { data }");

        const element = await generateQRCode(
            opts.data,
            opts.color || "#000000",
            opts.background || "#FFFFFF"
        );
        return {
            dataURL: element.toDataURL("image/png"),
            width: element.width,
            height: element.height,
        };
    },

    // ----------------------------------------------------------- housekeeping

    /**
     * Back to a blank design. Calls resetWizard() directly — the #start-over
     * button guards itself with a confirm() dialog that nothing can answer in
     * a headless run.
     */
    async reset() {
        resetWizard();
        await this._waitUntilQuiet();
        return this;
    },

    // --------------------------------------------------------------- internals

    _optionValues(selector) {
        return jQuery(`${selector} option`)
            .map(function () { return this.value; })
            .get()
            .filter(Boolean);
    },

    /**
     * Expand one of the collapsed panels in step 3. Some have a dedicated
     * opener button, the rest go through toggleSection().
     */
    _openSection(id, openerSelector) {
        const section = document.getElementById(id);
        if (!section || !section.classList.contains("hidden")) return;
        if (openerSelector && document.querySelector(openerSelector)) {
            jQuery(openerSelector).trigger("click");
        } else {
            toggleSection(id);
        }
    },

    /**
     * Wait until the canvas stops changing. The app signals readiness through
     * canvas state rather than events — addLogo() alone is two async image
     * loads deep — so quiescence is the only honest completion signal.
     */
    async _waitUntilQuiet(settleMs = 400, timeout = 15000) {
        const started = Date.now();
        let last = -1;
        let stableSince = 0;
        while (Date.now() - started < timeout) {
            const count = canvas ? canvas.getObjects().length : -1;
            if (count !== last) {
                last = count;
                stableSince = Date.now();
            } else if (Date.now() - stableSince >= settleMs) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        throw new Error(`Canvas never settled within ${timeout}ms`);
    },

    /**
     * Poll until a condition holds. Fails loudly with what it was waiting for:
     * a caller that times out here has hit a changed UI, and a silent partial
     * render would be worse than an error.
     */
    async _waitFor(condition, description, timeout = 15000) {
        const started = Date.now();
        while (Date.now() - started < timeout) {
            let ok = false;
            try {
                ok = !!condition();
            } catch (e) {
                ok = false;
            }
            if (ok) return;
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(`Timed out after ${timeout}ms waiting for ${description}`);
    },
};

if (typeof window !== "undefined") {
    window.Bildgenerator = Bildgenerator;
}
