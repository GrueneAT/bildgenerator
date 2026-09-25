/**
 * Bildgenerator — programmatic entry point (window.Bildgenerator).
 *
 * The wizard is built for people: state lives in form controls, steps hide and
 * show one another, and the logo select sits behind a search box that keeps its
 * own label. Driving that from outside — a headless browser, an AI assistant
 * with a browser sandbox — means knowing four things the markup does not
 * reveal, each of which has already cost a caller a debugging round:
 *
 *   1. #meme-input is the background-image FILE upload, not a text field.
 *   2. Text goes into #text and is committed with #add-text — and the section
 *      holding both starts collapsed.
 *   3. #logo-selection is a hidden <select> behind a search box that fires
 *      'change' itself; dispatching another one adds the logo twice.
 *   4. CanvasUtils.exportCanvas() resolves to { dataURL, actualDPI, targetDPI },
 *      not to a string.
 *
 * This object collapses them into one call. More importantly it gives callers
 * something stable to depend on: when the wizard changes, the breakage surfaces
 * in this file's own test rather than in somebody else's script.
 *
 * Deliberately NOT a second renderer. Every method drives the same objects the
 * UI drives, so there is exactly one rendering path and the existing visual
 * regression suite still covers it.
 */
const Bildgenerator = {
    VERSION: 1,

    /** Names accepted by setTemplate / render({ template }). */
    templates() {
        return Object.keys(TemplateConstants.TEMPLATES);
    },

    /** Organisation values accepted by setLogo / render({ logo }). */
    logos() {
        return jQuery("#logo-selection option")
            .map(function () { return this.value; })
            .get()
            .filter(Boolean);
    },

    /**
     * Select a template and wait until the canvas has been rebuilt at its
     * dimensions. Changing the template replaces the canvas, so everything
     * else has to happen afterwards.
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
        // Matching dimensions are not the end of the change: replaceCanvas()
        // re-adds the logo asynchronously afterwards. Returning here would let
        // the next call race that load and stack a second logo on the first.
        await this._waitUntilQuiet();
        return this;
    },

    /**
     * Place an organisation logo. Sets the select's value and fires exactly one
     * change event — the handler behind it adds the logo, so a second event
     * would stack a duplicate on top of the first.
     */
    async setLogo(value) {
        if (!this.logos().includes(value)) {
            throw new Error(`Unknown logo "${value}". See Bildgenerator.logos().`);
        }
        LogoState.setLogoEnabled(true);
        jQuery("#logo-selection").val(value).trigger("change");
        // addLogo() loads the logo image, bakes the knockout and loads the
        // result again — two async hops with no completion signal. window.logo
        // is no help: main.js snapshots it once during init and never syncs it.
        await this._waitUntilQuiet();
        return this;
    },

    /**
     * Set the background image from a data: URL or an absolute URL. Goes
     * straight to processMeme() rather than through #meme-input, so callers
     * never have to synthesise a File object.
     */
    async setBackground(url) {
        if (typeof url !== "string" || !url) {
            throw new Error("setBackground() needs a data: URL or an absolute URL");
        }
        processMeme({ url: url });
        await this._waitFor(() => !!window.contentImage, "background image to load");
        return this;
    },

    /**
     * Add a headline. Fills #text and clicks #add-text, expanding the
     * collapsed section first when the UI is showing it.
     */
    async addText(text, options) {
        const opts = options || {};
        const validation = ValidationUtils.validateTextInput(text);
        if (!validation.isValid) {
            throw new Error(`Invalid text: ${validation.error}`);
        }

        const section = document.getElementById("text-section");
        if (section && section.classList.contains("hidden")) {
            toggleSection("text-section");
        }

        if (opts.color) jQuery("#text-color").val(opts.color);
        if (opts.fontStyle) jQuery("#font-style-select").val(opts.fontStyle);
        if (opts.align) jQuery(`input[name="align"][value="${opts.align}"]`).prop("checked", true);
        if (opts.lineHeight) jQuery("#line-height").val(opts.lineHeight);

        const before = canvas.getObjects().length;
        jQuery("#text").val(text);
        jQuery("#add-text").trigger("click");
        await this._waitFor(
            () => canvas.getObjects().length > before,
            "text object to be added to the canvas"
        );
        return this;
    },

    /**
     * Export the canvas. Unwraps CanvasUtils.exportCanvas() and reports the
     * pixel dimensions the caller actually gets, which are the template's
     * dimensions multiplied by dpi/72.
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

    /**
     * Render one image end to end. Order matters: the template rebuilds the
     * canvas, the background sits behind everything, and text is centred
     * against whatever is already there.
     *
     * @param {Object} spec
     * @param {string} spec.template     Key from Bildgenerator.templates()
     * @param {string} [spec.background] data: URL or absolute URL
     * @param {string} [spec.logo]       Value from Bildgenerator.logos()
     * @param {string} [spec.text]       Headline
     * @param {string} [spec.textColor]  Value of a #text-color option
     * @param {string} [spec.fontStyle]  Id from AppConstants.FONTS.OPTIONS
     * @param {string} [spec.align]      left | center | right
     * @param {number} [spec.dpi=200]
     * @param {string} [spec.format=png]
     * @returns {Promise<{dataURL: string, width: number, height: number, dpi: number}>}
     */
    async render(spec) {
        if (!spec || typeof spec !== "object" || !spec.template) {
            throw new Error("render() needs at least { template }");
        }
        await this.setTemplate(spec.template);
        if (spec.background) await this.setBackground(spec.background);
        if (spec.logo) await this.setLogo(spec.logo);
        if (spec.text) {
            await this.addText(spec.text, {
                color: spec.textColor,
                fontStyle: spec.fontStyle,
                align: spec.align,
                lineHeight: spec.lineHeight,
            });
        }
        return this.export({
            format: spec.format,
            quality: spec.quality,
            dpi: spec.dpi,
        });
    },

    /**
     * Poll until a condition holds. The wizard signals readiness through
     * canvas state rather than events, so there is nothing to await directly.
     * Fails loudly with what it was waiting for — a caller that times out here
     * has hit a changed UI, and a silent partial render would be worse.
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
