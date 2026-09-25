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
    VERSION: 11,

    /** The object the most recent add* call put on the canvas. */
    _lastAdded: null,

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
            shapes: ["pinkCircle", "cross", "panel"],
            clipSizes: this._optionValues("#circle-radius"),
            qrColorsOnImage: this._optionValues("#qr-color"),
            qrColors: this._optionValues("#qr-color-select"),
            qrBackgrounds: this._optionValues("#qr-background-select"),
            formats: ["png", "jpeg"],
            positions: [
                "top-left", "top", "top-right",
                "left", "center", "right",
                "bottom-left", "bottom", "bottom-right",
            ],
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
        this._lastAdded = null; // the canvas is discarded and rebuilt
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
     * Whether the region name on the logo bar is transparent (a knockout) or
     * filled with the brand green.
     *
     * Transparent shows whatever lies behind the logo through the letters. On
     * the plain green canvas that is the green and looks right; over a
     * background photo the photo shows through and the name becomes
     * unreadable. setBackground() therefore turns this off by itself the
     * first time a photo arrives — call this afterwards to override.
     */
    async setLogoKnockout(enabled) {
        LogoState.setKnockoutEnabled(Boolean(enabled));
        if (LogoState.isLogoEnabled()) {
            addLogo();
            await this._waitUntilQuiet();
        }
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
     *
     * The photo is cover-scaled, so one axis overflows and gets cropped.
     * `focusX` / `focusY` decide which part survives: 0.5 is the centre and
     * the long-standing default, 0 pins the left or top edge, 1 the right or
     * bottom. A portrait in a landscape template usually wants focusY near 0
     * so the face is not cut off — centring is a guess, and often the wrong
     * one.
     *
     * @param {string} url
     * @param {Object} [options]
     * @param {number} [options.focusX=0.5]
     * @param {number} [options.focusY=0.5]
     */
    async setBackground(url, options) {
        if (typeof url !== "string" || !url) {
            throw new Error("setBackground() needs a data: URL or an absolute URL");
        }
        const opts = options || {};
        const focus = function (v) {
            if (v === undefined) return undefined;
            if (typeof v !== "number" || v < 0 || v > 1) {
                throw new Error("setBackground() focus values run from 0 to 1");
            }
            return v;
        };
        // Set before the image loads: positionBackgroundImage() reads it.
        CanvasUtils.setBackgroundFocus(focus(opts.focusX), focus(opts.focusY));
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
     * @param {string} [options.align]      left | center | right — how the lines
     *                                        sit inside the text block. To move
     *                                        the block itself, use place().
     * @param {string} [options.lineHeight] value from options().lineHeights
     * @param {number} [options.shadow]     shadow depth
     * @param {boolean|Object} [options.panel] put a green surface behind this
     *                                        text — required by the brand rule
     *                                        when a background photo is set
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

        await this._addTracking(function () {
            jQuery("#text").val(text);
            jQuery("#add-text").trigger("click");
        }, "text object to be added to the canvas");

        // Convenience for the brand rule: put a green surface under this text,
        // sized to it. Doing it here rather than leaving the arithmetic to the
        // caller is the difference between a rule that gets followed and one
        // that gets skipped.
        if (opts.panel) {
            await this._panelBehind(this.lastAdded(), opts.panel);
        }
        return this;
    },

    /**
     * Add a decorative element: 'pinkCircle' (magenta circle) or 'cross' (the
     * Wahlkreuz). Note that the UI's circle button does something else
     * entirely — see clipToCircle().
     */
    async addShape(kind) {
        const buttons = {
            pinkCircle: "#add-pink-circle",
            cross: "#add-cross",
            panel: "#add-panel",
        };
        const selector = buttons[kind];
        if (!selector) {
            throw new Error(
                `Unknown shape "${kind}". Available: ${Object.keys(buttons).join(", ")}`
            );
        }
        this._openSection("elements-section");
        await this._addTracking(function () {
            jQuery(selector).trigger("click");
        }, `shape "${kind}" to be added`);
        return this;
    },

    /**
     * Put a green surface behind one text, sized to it with padding, and keep
     * the text on top. The padding is a share of the text's own height, so it
     * scales with the type rather than with the canvas.
     */
    async _panelBehind(text, options) {
        const opts = typeof options === "object" && options !== null ? options : {};
        await this.addPanel();
        const panel = this.lastAdded();

        // Bind the two together. Without this a later place() moves the text
        // and leaves the surface where it was — the text ends up half off its
        // own panel, which is worse than having no panel at all.
        text._gatPanel = panel;
        text._gatPanelPadding = typeof opts.padding === "number" ? opts.padding : 0.35;
        this._refitPanel(text);

        // The text stays the tracked element: a caller writing
        // addText(t, { panel: true }) then place(...) means the text.
        this._lastAdded = text;
        return this;
    },

    /**
     * Re-size and re-centre a text's green surface on the text. Called after
     * anything that moves or scales the text, so the two never come apart.
     */
    _refitPanel(text) {
        const panel = text && text._gatPanel;
        if (!panel || !canvas.getObjects().includes(panel)) return;

        const padding = text._gatPanelPadding || 0.35;
        const width = text.getScaledWidth();
        const height = text.getScaledHeight();

        panel.set({
            scaleX: (width + height * padding * 2) / panel.width,
            scaleY: (height + height * padding) / panel.height,
        });
        panel._gatBaseScale = panel.scaleX;
        panel.setCoords();
        panel.set({
            left: text.left + width / 2 - panel.getScaledWidth() / 2,
            top: text.top + height / 2 - panel.getScaledHeight() / 2,
        });
        panel.setCoords();

        canvas.bringToFront(text);
        CanvasUtils.bringLogoToFront();
        canvas.renderAll();
    },

    /**
     * Add a green surface for type to sit on.
     *
     * The brand guide requires typography to be combined with green. Without
     * a photo the whole canvas already is green, so this is only needed over
     * a background image — but there it is not optional: white text laid
     * straight over a photograph breaks the rule, however legible it looks.
     *
     * The panel lands behind every text already on the canvas.
     *
     * @param {Object} [options]
     * @param {number} [options.width=0.8]  share of the usable width
     * @param {number} [options.height=0.28] share of the usable height
     */
    async addPanel(options) {
        const opts = options || {};
        this._openSection("elements-section");
        const panel = await this._addTracking(function () {
            jQuery("#add-panel").trigger("click");
        }, "green panel to be added");

        if (typeof opts.width === "number" || typeof opts.height === "number") {
            const width = (typeof opts.width === "number" ? opts.width : 0.8) * contentRect.width;
            const height = (typeof opts.height === "number" ? opts.height : 0.28) * contentRect.height;
            panel.set({ scaleX: width / panel.width, scaleY: height / panel.height });
            panel._gatBaseScale = panel.scaleX;
            panel.setCoords();
            canvas.centerObject(panel);
            canvas.renderAll();
        }
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

        await this._addTracking(function () {
            jQuery(input).trigger("input");
        }, "image to be added to the canvas");
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
        if (this._lastAdded && canvas.getObjects().includes(this._lastAdded)) {
            canvas.setActiveObject(this._lastAdded);
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
        const payload = opts.text || this.qrPayload(opts);
        if (!payload) {
            throw new Error(
                "addQRCode() needs { text }, or a { type } of " +
                "text | url | email | vcard with its fields"
            );
        }

        this._openSection("qr-section", "#show-qr-section");

        if (opts.color) jQuery("#qr-color").val(opts.color);
        await this._addTracking(function () {
            jQuery("#qr-text").val(payload);
            jQuery("#add-qr-code").trigger("click");
        }, "QR code to be added to the canvas");
        return this;
    },

    /**
     * Move the most recently added object to a named position.
     *
     * Everything the wizard adds lands centred — text, QR, shapes and images
     * all pile up on the same spot. Dragging them apart is what a person does
     * next; this is that drag.
     *
     * The target box is the canvas inset by the brand's protective margin
     * M = 0.06 x short edge, which no element may enter. When an organisation
     * logo is present, the bottom row stops above it instead of overlapping.
     *
     * @param {string} position from options().positions
     * @param {Object} [options]
     * @param {fabric.Object} [options.target] object to move (default: the last one)
     */
    async place(position, options) {
        const opts = options || {};
        const objects = canvas.getObjects();
        const target = opts.target !== undefined
            ? this._resolveTarget(opts.target)
            : this._lastAdded;
        if (!target || !objects.includes(target)) {
            throw new Error("place() needs an element that was added first");
        }
        this._assertEditable(target, "place");

        const margin = this.protectiveMargin();
        const width = target.getScaledWidth();
        const height = target.getScaledHeight();

        // Free positioning: { x, y } as fractions of the canvas, 0 = left/top
        // edge of the usable area, 1 = right/bottom. Still clamped to the
        // protective margin, because that is a brand rule and not a default.
        // Centre on another element — the Stoerer pattern from the brand guide
        // is a magenta circle with a short text on it, which needs exactly
        // this and nothing else.
        if (position && typeof position === "object" && position.onto !== undefined) {
            const host = this._resolveTarget(position.onto);
            if (host === target) throw new Error("place({ onto }) needs a different element");
            target.set({
                left: host.left + (host.getScaledWidth() - width) / 2,
                top: host.top + (host.getScaledHeight() - height) / 2,
            });
            target.setCoords();
            this._refitPanel(target);
            canvas.renderAll();
            return this;
        }

        if (position && typeof position === "object") {
            const inRange = function (v) {
                return v === undefined || (typeof v === "number" && v >= 0 && v <= 1);
            };
            if (!inRange(position.x) || !inRange(position.y)) {
                throw new Error(
                    "place({ x, y }) takes fractions between 0 and 1; the " +
                    "protective margin is not optional"
                );
            }
            const usableWidth = canvas.width - 2 * margin - width;
            const usableHeight = canvas.height - 2 * margin - height;
            target.set({
                left: margin + Math.max(0, usableWidth) * (position.x || 0),
                top: margin + Math.max(0, usableHeight) * (position.y || 0),
            });
            target.setCoords();
            this._refitPanel(target);
            canvas.renderAll();
            return this;
        }

        const valid = this.options().positions;
        if (!valid.includes(position)) {
            throw new Error(
                `Unknown position "${position}". Available: ${valid.join(", ")}, ` +
                `or { x, y } with values between 0 and 1`
            );
        }

        // The logo is placed by the app at the bottom; keep clear of it.
        let bottomLimit = canvas.height - margin;
        const placedLogo = this._logoObject();
        if (placedLogo && placedLogo !== target) {
            bottomLimit = Math.min(bottomLimit, placedLogo.top - margin);
        }

        const [row, column] = this._resolvePosition(position);
        let left = {
            start: margin,
            centre: (canvas.width - width) / 2,
            end: canvas.width - margin - width,
        }[column];
        let top = {
            start: margin,
            centre: (canvas.height - height) / 2,
            end: bottomLimit - height,
        }[row];

        // An element wider or taller than the usable area would otherwise be
        // pushed off the canvas entirely. Clamp instead — objects() still
        // reports insideMargin false, so the caller can see it does not fit.
        left = Math.max(0, left);
        top = Math.max(0, top);

        target.set({ left: left, top: top });
        target.setCoords();
        this._refitPanel(target);
        canvas.renderAll();
        return this;
    },

    /**
     * Scale an element. The wizard exposes this as a slider on the selected
     * object; there is no font-size field, so this is how text gets bigger or
     * smaller too.
     *
     * The factor is RELATIVE TO THE SIZE IT WAS ADDED AT: 1 leaves it as the
     * app placed it, 0.5 is half, 2 is double.
     *
     * Relative on purpose. The app inserts a text at whatever scale makes it
     * fit 80 % of the canvas — for a longer headline that is around 0.1. An
     * absolute resize(0.35) would therefore make it roughly three times WIDER
     * than the canvas, the opposite of what the number suggests.
     *
     * @param {number} factor relative to the inserted size, must be positive
     * @param {Object} [options]
     * @param {fabric.Object} [options.target] default: the last element added
     */
    async resize(factor, options) {
        const opts = options || {};
        const target = opts.target !== undefined
            ? this._resolveTarget(opts.target)
            : this.lastAdded();
        if (!target) throw new Error("resize() needs an element that was added first");
        this._assertEditable(target, "resize");
        if (typeof factor !== "number" || !(factor > 0)) {
            throw new Error("resize() needs a positive number");
        }
        const base = target._gatBaseScale || target.scaleX || 1;
        target.scale(base * factor).setCoords();
        this._refitPanel(target);
        canvas.renderAll();
        return this;
    },

    /**
     * Scale an element so it fits inside another one, leaving a little air.
     * Pairs with place({ onto }) for the Stoerer pattern.
     *
     * @param {number|Object} host   index from objects(), or an element
     * @param {number} [ratio=0.6]   share of the host's width to occupy
     */
    async fitInto(host, ratio) {
        const target = this.lastAdded();
        if (!target) throw new Error("fitInto() needs an element that was added first");
        const into = this._resolveTarget(host);
        const share = typeof ratio === "number" ? ratio : 0.6;
        const current = target.getScaledWidth();
        if (!current) throw new Error("fitInto() cannot measure the element");
        const wanted = into.getScaledWidth() * share;
        target.scale((target.scaleX || 1) * (wanted / current)).setCoords();
        canvas.renderAll();
        return this;
    },

    /**
     * Rotate an element. The wizard offers this as the rotation handle on a
     * selected object, and while dragging it snaps to 0, 90, 180 and 270
     * degrees within a 2 degree tolerance. Programmatic rotation sets the
     * angle exactly and does not snap — pass the right angle.
     *
     * @param {number} degrees clockwise, absolute (not relative)
     * @param {Object} [options]
     * @param {fabric.Object} [options.target] default: the last element added
     */
    async rotate(degrees, options) {
        const opts = options || {};
        const target = opts.target !== undefined
            ? this._resolveTarget(opts.target)
            : this.lastAdded();
        if (!target) throw new Error("rotate() needs an element that was added first");
        this._assertEditable(target, "rotate");
        if (typeof degrees !== "number" || !isFinite(degrees)) {
            throw new Error("rotate() needs a number of degrees");
        }
        target.rotate(((degrees % 360) + 360) % 360);
        target.setCoords();
        this._refitPanel(target);
        canvas.renderAll();
        return this;
    },

    /**
     * The brand's protective margin in canvas pixels: M = 0.06 x short edge.
     * No element may fall inside it. Exposed so callers can reason about
     * placement themselves.
     */
    protectiveMargin() {
        return 0.06 * Math.min(canvas.width, canvas.height);
    },

    /**
     * The object the most recent add* call put on the canvas.
     *
     * Deliberately public: callers that inspect the canvas themselves hit the
     * same trap the facade had to solve. canvas.getObjects() ends with the
     * organisation LOGO, not with the element just added — addLogo() and the
     * QR handler both call bringLogoToFront(). Reading the last entry gives
     * you the logo.
     */
    lastAdded() {
        const objects = canvas.getObjects();
        return this._lastAdded && objects.includes(this._lastAdded) ? this._lastAdded : null;
    },

    /**
     * The placed organisation logo, or null. addLogo() flattens it into a
     * non-selectable image and keeps it in front, so it is the last
     * non-selectable image on the canvas.
     */
    _logoObject() {
        const images = canvas.getObjects().filter(function (o) {
            return o.type === "image" && o.selectable === false;
        });
        return images.length ? images[images.length - 1] : null;
    },

    _resolvePosition(position) {
        const rows = { top: "start", bottom: "end" };
        const columns = { left: "start", right: "end" };
        const parts = position.split("-");
        let row = "centre";
        let column = "centre";
        for (const part of parts) {
            if (rows[part]) row = rows[part];
            else if (columns[part]) column = columns[part];
        }
        return [row, column];
    },

    // ------------------------------------------------- inspect and edit what is there

    /**
     * Everything currently on the canvas, in stacking order (last = in front).
     *
     * Without this a caller is blind: it can add elements but never check what
     * it built, and it cannot address anything but the most recent element.
     * `index` is what select(), remove(), update() and the *target* options
     * take.
     */
    objects() {
        const margin = this.protectiveMargin();
        const logoObject = this._logoObject();
        return canvas.getObjects().map(function (o, index) {
            return {
                index: index,
                type: o.type,
                // Only the ONE rect the app created as the canvas surface is
                // "canvas". Any other rect is a green panel a caller added,
                // and must not inherit the canvas's protected status.
                role: o === logoObject ? "logo"
                    : o === contentImage ? "background"
                    : o === contentRect ? "canvas"
                    : o.type === "rect" ? "panel"
                    : o.type,
                text: o.type === "text" ? o.text : undefined,
                color: o.fill,
                left: Math.round(o.left),
                top: Math.round(o.top),
                width: Math.round(o.getScaledWidth()),
                height: Math.round(o.getScaledHeight()),
                angle: Math.round(o.angle || 0),
                scale: Math.round((o.scaleX || 1) * 1000) / 1000,
                // All four edges, not just the origin. An element wider or
                // taller than the usable area sits at the margin on the left
                // and still runs off the right — reporting that as "inside"
                // is worse than not reporting at all.
                insideMargin:
                    o.left >= margin - 0.5 &&
                    o.top >= margin - 0.5 &&
                    o.left + o.getScaledWidth() <= canvas.width - margin + 0.5 &&
                    o.top + o.getScaledHeight() <= canvas.height - margin + 0.5,
                editable: o !== logoObject && o !== contentImage && o.type !== "rect",
            };
        });
    },

    /**
     * Make an element the active one and the target of the next edit.
     * Accepts the index from objects(), or a fabric object.
     */
    select(which) {
        const target = this._resolveTarget(which);
        canvas.setActiveObject(target);
        canvas.renderAll();
        this._lastAdded = target;
        return this;
    },

    /**
     * Change properties of an element that is already on the canvas.
     *
     * The wizard does this by selecting an object and touching the colour,
     * alignment, line-height or shadow control; the handlers write straight
     * onto the active object. Without this a caller has to delete and rebuild
     * an element to change its colour.
     *
     * @param {Object} changes  text, color, align, lineHeight, shadow, fontStyle
     * @param {Object} [options]
     * @param {number|Object} [options.target] index from objects(), or object
     */
    async update(changes, options) {
        const opts = options || {};
        const target = this._resolveTarget(
            opts.target !== undefined ? opts.target : this.lastAdded()
        );
        this._assertEditable(target, "update");
        const spec = changes || {};

        if (spec.text !== undefined) {
            const validation = ValidationUtils.validateTextInput(spec.text);
            if (!validation.isValid) throw new Error(`Invalid text: ${validation.error}`);
            target.set("text", spec.text);
        }
        if (spec.color !== undefined) target.set("fill", spec.color);
        if (spec.align !== undefined) target.set("textAlign", spec.align);
        if (spec.lineHeight !== undefined) target.set("lineHeight", parseFloat(spec.lineHeight));
        if (spec.shadow !== undefined) target.set("shadow", createShadow("#000000", spec.shadow));
        if (spec.fontStyle !== undefined) {
            const option = AppConstants.FONTS.OPTIONS.find(function (o) {
                return o.id === spec.fontStyle;
            });
            if (!option) {
                throw new Error(
                    `Unknown fontStyle "${spec.fontStyle}". ` +
                    `Available: ${AppConstants.FONTS.OPTIONS.map((o) => o.id).join(", ")}`
                );
            }
            target.set({
                fontFamily: option.family,
                fontWeight: option.weight,
                fontStyle: option.style,
            });
        }

        // Text caches its metrics, so a changed string or font needs a
        // re-measure or the old dimensions stick.
        if (typeof target.initDimensions === "function") {
            target.dirty = true;
            target.initDimensions();
        }
        target.setCoords();
        this._refitPanel(target);
        canvas.renderAll();
        return this;
    },

    /**
     * Remove an element. The organisation logo and the background image are
     * protected, exactly as the wizard's delete button protects them.
     */
    async remove(which) {
        const target = this._resolveTarget(which !== undefined ? which : this.lastAdded());
        if (target === this._logoObject()) {
            throw new Error("The organisation logo cannot be removed; use setLogoEnabled(false)");
        }
        if (target === contentImage) {
            throw new Error("The background image cannot be removed; set a different one");
        }
        if (target === contentRect) {
            throw new Error("The canvas surface cannot be removed");
        }
        canvas.remove(target);
        if (this._lastAdded === target) this._lastAdded = null;
        canvas.renderAll();
        return this;
    },

    /**
     * Move an element to the front of the stack.
     *
     * The UI's own handler guards contentImage and contentRect
     * (event-handlers.js) — bringing the canvas surface to the front would
     * cover the entire image in flat green.
     */
    async bringToFront(which) {
        const target = this._resolveTarget(which !== undefined ? which : this.lastAdded());
        this._assertEditable(target, "bringToFront");
        canvas.bringToFront(target);
        // The organisation logo is meant to stay on top.
        CanvasUtils.bringLogoToFront();
        canvas.renderAll();
        return this;
    },

    /**
     * Refuse to move, scale, rotate or restyle the things objects() reports as
     * editable:false — the plain canvas rectangle, the background photo and
     * the organisation logo.
     *
     * The UI protects these through its own handlers; the facade advertised
     * them as off-limits in objects() but let every other method touch them.
     * Dragging the logo out of its position or scaling the background breaks
     * the brand, and the caller would have no way to put it back.
     */
    _assertEditable(target, what) {
        if (target === this._logoObject()) {
            throw new Error(
                `${what}() will not touch the organisation logo — ` +
                `use setLogoEnabled(false) or setLogo() instead`
            );
        }
        if (target === contentImage) {
            throw new Error(
                `${what}() will not touch the background image — ` +
                `use setBackground() to replace it`
            );
        }
        if (target === contentRect) {
            throw new Error(`${what}() will not touch the canvas surface`);
        }
    },

    _resolveTarget(which) {
        if (which && typeof which === "object") return which;
        if (typeof which === "number") {
            const target = canvas.getObjects()[which];
            if (!target) {
                throw new Error(
                    `No element at index ${which}. See Bildgenerator.objects().`
                );
            }
            return target;
        }
        throw new Error("Expected an index from objects(), or an element that was added first");
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
        // The download button reads the DPI from the template
        // (event-handlers.js); a hardcoded 200 silently produced a different
        // resolution than the same template yields for a person.
        const template = TemplateConstants.getCurrentTemplate();
        const defaultDpi = (template && template.dpi) || 200;
        const result = await CanvasUtils.exportCanvas(
            opts.format || "png",
            typeof opts.quality === "number" ? opts.quality : 1,
            typeof opts.dpi === "number" ? opts.dpi : defaultDpi
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
     * @param {boolean}  [spec.logoKnockout] transparent region name; turns
     *                                       itself off when a background is set
     * @param {string}   [spec.text]        a single headline
     * @param {Array}    [spec.texts]       several texts, each
     *                                      { text, color, fontStyle, align,
     *                                        lineHeight, shadow, size, rotate,
     *                                        position }
     * @param {string}   [spec.textColor]   from options().textColors
     * @param {string}   [spec.fontStyle]   from options().fontStyles
     * @param {string}   [spec.align]       left | center | right — alignment
     *                                      WITHIN the text block, not on the canvas
     * @param {string}   [spec.lineHeight]  from options().lineHeights
     * @param {number}   [spec.shadow]      shadow depth
     * @param {number}   [spec.textSize]    scale, 1 = as added
     * @param {number}   [spec.textRotate]  degrees clockwise
     * @param {string}   [spec.textPosition] from options().positions
     * @param {Array}    [spec.shapes]      names from options().shapes, or
     *                                      { kind, position, size, rotate } objects
     * @param {Array}    [spec.images]      URLs, or { url, position } objects
     * @param {Object}   [spec.qr]          { text, color, position }
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
        // After the logo, so it survives addLogo() being called again.
        if (spec.logoKnockout !== undefined) await this.setLogoKnockout(spec.logoKnockout);

        // Everything lands centred, so each element is placed right after it is
        // added — otherwise the next one would cover it.
        for (const image of spec.images || []) {
            const url = typeof image === "string" ? image : image.url;
            await this.addImage(url);
            if (image.position) await this.place(image.position);
        }
        for (const shape of spec.shapes || []) {
            const kind = typeof shape === "string" ? shape : shape.kind;
            await this.addShape(kind);
            if (typeof shape.rotate === "number") await this.rotate(shape.rotate);
            if (typeof shape.size === "number") await this.resize(shape.size);
            if (shape.position) await this.place(shape.position);
        }
        if (spec.qr) {
            await this.addQRCode(spec.qr);
            if (spec.qr.position) await this.place(spec.qr.position);
        }
        // One headline via `text`, or several via `texts`. Each entry carries
        // its own colour, size and position — a second text would otherwise
        // land centred on top of the first.
        const texts = spec.texts
            ? spec.texts.slice()
            : (spec.text
                ? [{
                    text: spec.text,
                    color: spec.textColor,
                    fontStyle: spec.fontStyle,
                    align: spec.align,
                    lineHeight: spec.lineHeight,
                    shadow: spec.shadow,
                    position: spec.textPosition,
                    size: spec.textSize,
                    rotate: spec.textRotate,
                }]
                : []);

        for (const entry of texts) {
            const item = typeof entry === "string" ? { text: entry } : entry;
            await this.addText(item.text, item);
            if (typeof item.size === "number") await this.resize(item.size);
            if (typeof item.rotate === "number") await this.rotate(item.rotate);
            if (item.position) await this.place(item.position);
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
        const data = opts.data || this.qrPayload(opts);
        if (!data) {
            throw new Error(
                "renderQRCode() needs { data }, or a { type } of " +
                "text | url | email | vcard with its fields"
            );
        }

        const element = await generateQRCode(
            data,
            opts.color || "#000000",
            opts.background || "#FFFFFF"
        );
        return {
            dataURL: element.toDataURL("image/png"),
            width: element.width,
            height: element.height,
        };
    },

    /**
     * Build the payload string for one of the four content types the QR wizard
     * offers. Without this a caller has to hand-assemble mailto: query strings
     * and vCard records — error-prone, and the formatting rules already live
     * in the app.
     *
     * @param {Object} spec { type: 'text'|'url'|'email'|'vcard', ...fields }
     * @returns {string|null}
     */
    qrPayload(spec) {
        const opts = spec || {};
        switch (opts.type) {
            case "text":
                return opts.text || null;
            case "url":
                return opts.url ? QRFormatHelpers.formatURL(opts.url) : null;
            case "email":
                return opts.email
                    ? QRFormatHelpers.formatEmail(opts.email, opts.subject || "", opts.body || "")
                    : null;
            case "vcard":
                return QRFormatHelpers.formatVCard(opts);
            default:
                return null;
        }
    },

    // ----------------------------------------------------------- housekeeping

    /**
     * Back to a blank design. Calls resetWizard() directly — the #start-over
     * button guards itself with a confirm() dialog that nothing can answer in
     * a headless run.
     */
    async reset() {
        this._lastAdded = null;
        resetWizard();
        await this._waitUntilQuiet();
        return this;
    },

    // --------------------------------------------------------------- internals

    /**
     * Run an action that adds one object and remember which one it was.
     *
     * "The last object" is NOT the one just added: addLogo() and the QR
     * handler both call bringLogoToFront(), which moves the organisation logo
     * to the end of the list. Taking the last entry would hand back the logo —
     * and place() or clipToCircle() would then move or crop the logo instead
     * of the new element.
     */
    async _addTracking(action, description) {
        const before = new Set(canvas.getObjects());
        await action();
        await this._waitFor(
            () => canvas.getObjects().some((o) => !before.has(o)),
            description
        );
        await this._waitUntilQuiet();
        this._lastAdded = canvas.getObjects().find((o) => !before.has(o)) || null;
        if (this._lastAdded) {
            // The size the app gave it. resize() is relative to THIS, not to
            // fabric's raw scale: a text is inserted at roughly 0.1, so an
            // absolute resize(0.35) would make it three times wider than the
            // canvas instead of a third of its size.
            this._lastAdded._gatBaseScale = this._lastAdded.scaleX || 1;
        }
        return this._lastAdded;
    },

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
    /**
     * A cheap fingerprint of everything the canvas currently shows.
     *
     * Counting objects is not enough. A late image load can replace an object
     * or move one without changing the count — addLogo() removes the old logo
     * and adds the flattened one, and replaceCanvas() re-adds a logo whose
     * geometry only settles once both image decodes finish. The count is
     * identical before and after; the picture is not.
     */
    _canvasSignature() {
        if (!canvas) return "";
        return canvas.getObjects().map(function (o) {
            return [
                o.type,
                Math.round(o.left),
                Math.round(o.top),
                Math.round(o.getScaledWidth()),
                Math.round(o.getScaledHeight()),
                Math.round(o.angle || 0),
                o.type === "text" ? o.text : "",
            ].join(",");
        }).join("|");
    },

    /**
     * Wait until the canvas stops changing. The app offers no completion
     * signal — addLogo() alone is two async image decodes deep — so stability
     * of the rendered state is the only honest one available.
     */
    async _waitUntilQuiet(settleMs = 500, timeout = 15000) {
        const started = Date.now();
        let last = null;
        let stableSince = 0;
        while (Date.now() - started < timeout) {
            const signature = this._canvasSignature();
            if (signature !== last) {
                last = signature;
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
