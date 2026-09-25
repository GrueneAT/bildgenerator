/**
 * QualityCheck — measurable rules for "is this image any good".
 *
 * Taste is not testable, but several of the things that make a sujet look
 * wrong are: elements that collide, type that breaks the protective margin,
 * text so small it will not survive the export, a composition that leans to
 * one side, accents that compete with each other.
 *
 * Every rule below is computed from the canvas object model alone — no second
 * rendering pass, no pixel sampling. That was a deliberate constraint: a
 * checker that needs its own render would be a second source of truth, and
 * this whole interface exists to avoid exactly that.
 *
 * Thresholds come from the three independent external reviews (Claude Opus 5,
 * GPT-5.6, Antigravity); where they disagreed the most permissive value is
 * used, so a warning means something.
 */
const QualityCheck = {
    /**
     * Rules that are brand requirements rather than judgement calls, and are
     * therefore reported as errors.
     */
    SEVERITY: { ERROR: "error", WARNING: "warning" },

    /**
     * Inspect the current canvas.
     *
     * @returns {{ok: boolean, errors: Array, warnings: Array, findings: Array}}
     */
    run() {
        const findings = [];
        const objects = this._subjects();

        this._checkMargin(objects, findings);
        this._checkOverlap(objects, findings);
        this._checkTextGaps(objects, findings);
        this._checkTextWidth(objects, findings);
        this._checkLegibility(objects, findings);
        this._checkAccents(objects, findings);
        this._checkBalance(objects, findings);
        this._checkTypeOnGreen(objects, findings);

        const errors = findings.filter((f) => f.severity === this.SEVERITY.ERROR);
        const warnings = findings.filter((f) => f.severity === this.SEVERITY.WARNING);
        return { ok: errors.length === 0, errors: errors, warnings: warnings, findings: findings };
    },

    /**
     * Everything a caller put on the canvas. The surface, the background photo
     * and the organisation logo are placed by the app at fixed positions, so
     * judging them would only produce findings nobody can act on.
     */
    _subjects() {
        const logo = this._logo();
        return canvas.getObjects().filter(function (o) {
            return o !== contentRect && o !== contentImage && o !== logo;
        });
    },

    _logo() {
        const images = canvas.getObjects().filter(function (o) {
            return o.type === "image" && o.selectable === false;
        });
        return images.length ? images[images.length - 1] : null;
    },

    _margin() {
        return 0.06 * Math.min(canvas.width, canvas.height);
    },

    /** Rotation-aware bounds — a rotated cross occupies more than its width. */
    _box(o) {
        return o.getBoundingRect(true, true);
    },

    _add(findings, severity, rule, message, detail) {
        findings.push({
            severity: severity,
            rule: rule,
            message: message,
            detail: detail || {},
        });
    },

    // ---------------------------------------------------------------- rules

    /**
     * The protective margin is a brand rule (M = 0.06 x short edge), not a
     * preference, so any breach is an error. Measured on all four edges and
     * after rotation.
     */
    _checkMargin(objects, findings) {
        const m = this._margin();
        const self = this;
        objects.forEach(function (o) {
            const b = self._box(o);
            const over = {
                left: m - b.left,
                top: m - b.top,
                right: b.left + b.width - (canvas.width - m),
                bottom: b.top + b.height - (canvas.height - m),
            };
            const worst = Math.max(over.left, over.top, over.right, over.bottom);
            if (worst > 0.5) {
                self._add(findings, self.SEVERITY.ERROR, "margin",
                    `Ein ${self._name(o)} ragt ${Math.round(worst)} px in die Schutzzone`,
                    { type: o.type, overshoot: Math.round(worst) });
            }
        });
    },

    /**
     * Elements that cover each other. A text sitting on its own green panel is
     * the intended case and is excluded, as is a Störer with its own text.
     */
    _checkOverlap(objects, findings) {
        const self = this;
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const a = objects[i];
                const b = objects[j];
                if (a._gatPanel === b || b._gatPanel === a) continue;

                const ratio = self._overlapRatio(self._box(a), self._box(b));
                if (ratio <= 0.01) continue;

                const bothText = a.type === "text" && b.type === "text";
                if (bothText || ratio > 0.35) {
                    self._add(findings, self.SEVERITY.ERROR, "overlap",
                        `${self._name(a)} und ${self._name(b)} überdecken sich zu ${Math.round(ratio * 100)} %`,
                        { ratio: ratio });
                } else if (ratio > 0.10) {
                    self._add(findings, self.SEVERITY.WARNING, "overlap",
                        `${self._name(a)} und ${self._name(b)} überdecken sich zu ${Math.round(ratio * 100)} %`,
                        { ratio: ratio });
                }
            }
        }
    },

    _overlapRatio(a, b) {
        const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
        if (w <= 0 || h <= 0) return 0;
        const smaller = Math.min(a.width * a.height, b.width * b.height);
        return smaller > 0 ? (w * h) / smaller : 0;
    },

    /**
     * Vertical distance between stacked text blocks, measured in multiples of
     * the LOWER block's line height. Absolute pixels say nothing: 40 px is
     * generous under a caption and invisible under a headline.
     */
    _checkTextGaps(objects, findings) {
        const texts = objects.filter(function (o) { return o.type === "text"; });
        const self = this;
        for (let i = 0; i < texts.length; i++) {
            for (let j = i + 1; j < texts.length; j++) {
                const a = self._box(texts[i]);
                const b = self._box(texts[j]);
                // Only blocks that sit above one another.
                const horizontalOverlap =
                    Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
                if (horizontalOverlap <= 0) continue;

                const upper = a.top <= b.top ? a : b;
                const lowerObject = a.top <= b.top ? texts[j] : texts[i];
                const lower = a.top <= b.top ? b : a;
                const gap = lower.top - (upper.top + upper.height);
                if (gap < 0) continue; // overlap is reported by _checkOverlap

                const lineHeight = (lowerObject.fontSize || 1) *
                    (lowerObject.scaleY || 1) * (lowerObject.lineHeight || 1);
                const ratio = lineHeight > 0 ? gap / lineHeight : 0;
                if (ratio < 0.25) {
                    self._add(findings, self.SEVERITY.ERROR, "textGap",
                        `Zwei Textblöcke stehen zu eng (${ratio.toFixed(2)} Zeilenhöhen)`,
                        { ratio: ratio });
                } else if (ratio < 0.4) {
                    self._add(findings, self.SEVERITY.WARNING, "textGap",
                        `Zwei Textblöcke stehen eng (${ratio.toFixed(2)} Zeilenhöhen)`,
                        { ratio: ratio });
                }
            }
        }
    },

    /** Text that fills almost the whole width, or a lonely short last line. */
    _checkTextWidth(objects, findings) {
        const usable = canvas.width - 2 * this._margin();
        const self = this;
        objects.filter(function (o) { return o.type === "text"; }).forEach(function (o) {
            const share = self._box(o).width / usable;
            if (share > 1) {
                self._add(findings, self.SEVERITY.ERROR, "textWidth",
                    `Ein Textblock ist breiter als die nutzbare Fläche (${Math.round(share * 100)} %)`,
                    { share: share });
            }

            const lines = String(o.text || "").split("\n").filter(function (l) { return l.trim(); });
            if (lines.length > 3) {
                self._add(findings, self.SEVERITY.WARNING, "textLines",
                    `Ein Textblock hat ${lines.length} Zeilen — drei sind das Maximum`,
                    { lines: lines.length });
            }
            if (lines.length > 1) {
                const last = lines[lines.length - 1].trim();
                const longest = lines.reduce(function (a, b) { return a.length > b.length ? a : b; });
                if (last.split(/\s+/).length === 1 && last.length < longest.length * 0.35) {
                    self._add(findings, self.SEVERITY.WARNING, "orphan",
                        `Letzte Zeile „${last}" steht allein`, { last: last });
                }
            }
        });
    },

    /**
     * Type size in the EXPORTED file, not on the editing canvas. A headline
     * that reads fine at screen scale can be unreadable in an A6 flyer.
     */
    _checkLegibility(objects, findings) {
        const template = TemplateConstants.getCurrentTemplate();
        const dpi = (template && template.dpi) || 200;
        const factor = dpi / 72;
        const self = this;
        objects.filter(function (o) { return o.type === "text"; }).forEach(function (o) {
            const rendered = (o.fontSize || 0) * (o.scaleY || 1) * factor;
            if (rendered > 0 && rendered < 24 * factor) {
                self._add(findings, self.SEVERITY.WARNING, "legibility",
                    `Ein Text ist mit ${Math.round(rendered)} px im Export sehr klein`,
                    { renderedPx: Math.round(rendered) });
            }
        });
    },

    /**
     * The brand guide allows one Störer per sujet — "mehrere heben sich
     * gegenseitig auf". Accents beyond that compete instead of accentuating.
     */
    _checkAccents(objects, findings) {
        const magenta = String(AppConstants.COLORS.PINK_CIRCLE).toLowerCase();
        let stoerer = 0;
        let accents = 0;
        objects.forEach(function (o) {
            const fill = String(o.fill || "").toLowerCase();
            const isMagenta = fill === magenta || fill === "rgb(225,0,120)";
            if (isMagenta) stoerer++;
            if (isMagenta || o.type === "circle" || (o.type === "text" && o.fontStyle === "italic")) {
                accents++;
            }
        });
        if (stoerer > 1) {
            this._add(findings, this.SEVERITY.ERROR, "accents",
                `${stoerer} Störer auf einem Sujet — laut CD ist einer erlaubt`,
                { stoerer: stoerer });
        }
        if (accents > 2) {
            this._add(findings, this.SEVERITY.WARNING, "accents",
                `${accents} konkurrierende Akzente`, { accents: accents });
        }
    },

    /**
     * Where the visual weight sits. Vertical asymmetry is normal — the logo is
     * at the bottom — so only the horizontal axis is judged, and only loosely.
     */
    _checkBalance(objects, findings) {
        if (objects.length < 2) return;
        let mass = 0;
        let sum = 0;
        const self = this;
        objects.forEach(function (o) {
            const b = self._box(o);
            const weight = b.width * b.height * (o.type === "text" ? 1.5 : 1);
            mass += weight;
            sum += weight * (b.left + b.width / 2);
        });
        if (mass <= 0) return;
        const offset = (sum / mass - canvas.width / 2) / canvas.width;
        if (Math.abs(offset) > 0.18) {
            this._add(findings, this.SEVERITY.WARNING, "balance",
                `Die Komposition hängt ${offset > 0 ? "nach rechts" : "nach links"} ` +
                `(${Math.round(Math.abs(offset) * 100)} % aus der Mitte)`,
                { offset: offset });
        }
    },

    /**
     * The central brand rule: type sits on green. Without a background photo
     * the whole surface is green and nothing can go wrong. With one, every
     * text needs a panel behind it.
     */
    _checkTypeOnGreen(objects, findings) {
        if (!contentImage) return;
        const self = this;
        const panels = objects.filter(function (o) {
            return o.type === "rect" &&
                String(o.fill || "").toLowerCase() ===
                String(AppConstants.COLORS.BACKGROUND_SECONDARY).toLowerCase();
        });

        objects.filter(function (o) { return o.type === "text"; }).forEach(function (text) {
            const box = self._box(text);
            const covered = panels.some(function (panel) {
                const p = self._box(panel);
                return p.left <= box.left + 1 && p.top <= box.top + 1 &&
                    p.left + p.width >= box.left + box.width - 1 &&
                    p.top + p.height >= box.top + box.height - 1;
            });
            if (!covered) {
                self._add(findings, self.SEVERITY.ERROR, "typeOnGreen",
                    "Text liegt auf dem Foto ohne grüne Fläche darunter — " +
                    "das CD verlangt Typografie auf Grün",
                    { text: String(text.text || "").slice(0, 40) });
            }
        });
    },

    _name(o) {
        if (o.type === "text") return `Text „${String(o.text || "").slice(0, 20)}"`;
        if (o.type === "circle") return "Störer";
        if (o.type === "rect") return "Fläche";
        return "Bild";
    },
};

if (typeof window !== "undefined") {
    window.QualityCheck = QualityCheck;
}
