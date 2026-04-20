import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";

const ARROW_CHARS = {
  up: "\u2191", down: "\u2193", left: "\u2190", right: "\u2192",
  "up-left": "\u2196", "up-right": "\u2197",
  "down-left": "\u2199", "down-right": "\u2198", none: "",
};

const SIGN_RATIOS = {
  "27:5": { label: "27 × 5 (Wide Banner)", w: 27, h: 5 },
  "5:3": { label: "5 × 3 (Compact)", w: 5, h: 3 },
};

// ── Sign type guidelines ──
// Each sign type defines its complete default styling.
// `layoutOverrides` lets you set standards per layout configuration.
// The key format is "CxR" where C is columns and R is rows-per-column joined by hyphens.
// `rowSizing` within a layout override sets per-row-count sizing: panels in a
// column with N rows get the sizing from rowSizing[N].
const SIGN_DEFAULTS = {
  "27:5": {
    // Layout
    columns: 3,
    columnRows: [1, 1, 1],
    gap: 4,
    iconScale: 0.54,
    panelLayout: "auto",

    // Typography
    fontFamily: "SuisseIntl__400__normal",
    fontWeight: 400,
    fontStyle: "normal",
    allCaps: true,
    fontSize: 16,
    arrowSize: 36,
    arrowWeight: 100,

    // Border & Spacing
    outerBorder: true,
    borderWidth: 2,
    borderColor: "#333333",
    padding: 0,
    panelPadding: 6,

    // Panel defaults (applied to every new panel)
    panelDefaults: {
      bgColor: "#ffffff",
      textColor: "#000000",
      fontSize: 16,
      arrowDir: "up",
      arrowPosition: "right",
      iconPosition: "left",
      showBorder: true,
    },

    // Layout-specific overrides — sizing that changes based on panel count/arrangement
    // rowSizing: per-row-count overrides (panels in a column with N rows get sizing from rowSizing[N])
    layoutOverrides: {
      "1x1": { fontSize: 28, arrowSize: 48, iconScale: 0.8, panelDefaults: { fontSize: 28 } },
      "2x1": { fontSize: 20, arrowSize: 40, iconScale: 0.7, panelDefaults: { fontSize: 20 } },
      "3x1": { fontSize: 16, arrowSize: 36, iconScale: 0.54, panelDefaults: { fontSize: 16 } },
      "4x1": { fontSize: 13, arrowSize: 28, iconScale: 0.55, panelDefaults: { fontSize: 13 } },
      // Mixed layouts — different font sizes for different panel sizes
      "3x1-1-3": {
        fontSize: 16, arrowSize: 36, iconScale: 0.65,
        rowSizing: {
          1: { fontSize: 20, arrowSize: 36 },
          3: { fontSize: 12, arrowSize: 24 },
        },
      },
      "3x1-1-2": {
        fontSize: 16, arrowSize: 36, iconScale: 0.65,
        rowSizing: {
          1: { fontSize: 18, arrowSize: 36 },
          2: { fontSize: 14, arrowSize: 28 },
        },
      },
      "2x1-2": {
        fontSize: 18, arrowSize: 36, iconScale: 0.7,
        rowSizing: {
          1: { fontSize: 22, arrowSize: 40 },
          2: { fontSize: 14, arrowSize: 28 },
        },
      },
      "2x2-1": {
        fontSize: 16, arrowSize: 36, iconScale: 0.54,
        rowSizing: {
          2: { fontSize: 16, arrowSize: 36 },
          1: { fontSize: 16, arrowSize: 36 },
        },
      },
      "2x1-3": {
        fontSize: 18, arrowSize: 36, iconScale: 0.7,
        rowSizing: {
          1: { fontSize: 24, arrowSize: 42 },
          3: { fontSize: 12, arrowSize: 22 },
        },
      },
      "3x2-3-1": {
        fontSize: 16, arrowSize: 36, iconScale: 0.65,
        rowSizing: {
          2: { fontSize: 16, arrowSize: 36 },
          3: { fontSize: 16, arrowSize: 36 },
          1: { fontSize: 16, arrowSize: 36 },
        },
      },
      "3x3-1-1": {
        fontSize: 11, arrowSize: 36, iconScale: 0.54,
        rowSizing: {
          3: { fontSize: 11, arrowSize: 36 },
          1: { fontSize: 16, arrowSize: 36 },
        },
      },
      "3x4-1-1": {
        fontSize: 11, arrowSize: 36, iconScale: 0.54,
        rowSizing: {
          4: { fontSize: 11, arrowSize: 36 },
          1: { fontSize: 16, arrowSize: 36 },
        },
      },
      "3x1-4-1": {
        fontSize: 16, arrowSize: 36, iconScale: 0.54, panelPadding: 6,
        rowSizing: {
          1: { fontSize: 16, arrowSize: 36, iconScale: 0.54, panelPadding: 6 },
          4: { fontSize: 11, arrowSize: 23, iconScale: 0.54, panelPadding: 0 },
        },
      },
    },
  },
  "5:3": {
    // Layout
    columns: 1,
    columnRows: [2],
    gap: 4,
    iconScale: 0.74,
    panelLayout: "auto",

    // Typography
    fontFamily: "SuisseIntl__400__normal",
    fontWeight: 700,
    fontStyle: "normal",
    allCaps: true,
    fontSize: 12,
    arrowSize: 16,
    arrowWeight: 400,

    // Border & Spacing
    outerBorder: true,
    borderWidth: 2,
    borderColor: "#333333",
    padding: 0,
    panelPadding: 0,

    // Panel defaults
    panelDefaults: {
      bgColor: "#ffffff",
      textColor: "#000000",
      fontSize: 12,
      arrowDir: "up",
      arrowPosition: "right",
      iconPosition: "left",
      showBorder: true,
    },

    layoutOverrides: {
      "1x1": { fontSize: 22, arrowSize: 32, iconScale: 0.7, panelDefaults: { fontSize: 22 } },
      "1x2": { fontSize: 12, arrowSize: 16, iconScale: 0.74, panelDefaults: { fontSize: 12 } },
      "2x1": { fontSize: 16, arrowSize: 24, iconScale: 0.55, panelDefaults: { fontSize: 16 } },
      "2x2": { fontSize: 8, arrowSize: 16, iconScale: 0.5, panelLayout: "vertical", panelDefaults: { fontSize: 8 } },
      "2x1-2": {
        fontSize: 14, arrowSize: 20, iconScale: 0.55,
        rowSizing: {
          1: { fontSize: 18, arrowSize: 24 },
          2: { fontSize: 12, arrowSize: 16 },
        },
      },
      "2x2-1": {
        fontSize: 10, arrowSize: 16, iconScale: 0.74,
        rowSizing: {
          2: { fontSize: 10, arrowSize: 16, panelLayout: "vertical" },
          1: { fontSize: 12, arrowSize: 16 },
        },
      },
      "2x3-1": {
        fontSize: 8, arrowSize: 16, iconScale: 0.74,
        rowSizing: {
          3: { fontSize: 8, arrowSize: 16, panelLayout: "horizontal" },
          1: { fontSize: 12, arrowSize: 16 },
        },
      },
    },
  },
};

const COLOR_PALETTE = [
  { color: "#f0dca0", label: "Gold" },
  { color: "#ffffff", label: "White" },
  { color: "#d0e8dc", label: "Sage" },
  { color: "#c4dae8", label: "Sky" },
];

const ICON_TEXT_MAP = {
  "Agency Buildings": "BUILDINGS 1 & 2",
  "Capitol": "THE CAPITOL",
  "Corning": "CORNING TOWER",
  "Egg": "THE EGG",
  "Museum": "NY STATE MUSEUM",
  "ObservationDeck": "OBSERVATION DECK",
};

// Icons that always get a specific background color (overrides random & manual)
const ICON_BG_RULES = {
  "Restroom": "#c4dae8",
};

// Convert CSS px font size to real-world inches based on sign ratio
function pxToInches(px, ratio) {
  const r = SIGN_RATIOS[ratio] || SIGN_RATIOS["27:5"];
  const previewW = Math.min(800, r.w * 40);
  return (px * r.w * 12) / previewW;
}
function formatInches(inches) {
  return inches >= 1 ? inches.toFixed(1) + '"' : (inches * 10).toFixed(1) + 'mm';
}

// Build a layout key like "3x1" or "2x1-2" from columnRows
function getLayoutKey(columnRows) {
  const cols = columnRows.length;
  const allSame = columnRows.every(r => r === columnRows[0]);
  if (allSame) return `${cols}x${columnRows[0]}`;
  return `${cols}x${columnRows.join("-")}`;
}

function getDefaults(ratio, columnRows) {
  const base = SIGN_DEFAULTS[ratio] || SIGN_DEFAULTS["27:5"];
  if (!columnRows) return base;
  const key = getLayoutKey(columnRows);
  const override = base.layoutOverrides?.[key];
  if (!override) return base;
  return {
    ...base,
    ...override,
    panelDefaults: { ...base.panelDefaults, ...override.panelDefaults },
  };
}

// Get the font size for a panel based on how many rows its column has
function getPanelFontSize(ratio, columnRows, colIdx, fallback) {
  const base = SIGN_DEFAULTS[ratio] || SIGN_DEFAULTS["27:5"];
  const key = getLayoutKey(columnRows);
  const override = base.layoutOverrides?.[key];
  if (!override?.rowSizing) return fallback;
  const rowCount = columnRows[colIdx];
  const rs = override.rowSizing[rowCount];
  return rs?.fontSize ?? fallback;
}

// Build panels with per-column font sizes from rowSizing
function buildPanelsForLayout(ratio, columnRows, existingPanels, existingColumnRows = null, existingRatio = ratio) {
  const ld = getDefaults(ratio, columnRows);
  const base = SIGN_DEFAULTS[ratio] || SIGN_DEFAULTS["27:5"];
  const layoutKey = getLayoutKey(columnRows);
  const override = base.layoutOverrides?.[layoutKey];
  const rowSizing = override?.rowSizing;
  const pd = ld.panelDefaults || {};
  const target = columnRows.reduce((a, b) => a + b, 0);
  const cols = columnRows.length;

  // Build a map of aspect-key -> standards from existing panels.
  // Aspect-key is based on sign ratio + columns + rows-in-column.
  const prevColumnRows = existingColumnRows || columnRows;
  const existingSizeByAspect = {};
  if (existingPanels) {
    let fi = 0;
    const prevCols = prevColumnRows.length;
    for (let col = 0; col < prevColumnRows.length; col++) {
      const rows = prevColumnRows[col];
      for (let r = 0; r < rows; r++) {
        if (fi < existingPanels.length) {
          const ep = existingPanels[fi];
          const aspectKey = `${existingRatio}|c${prevCols}|r${rows}`;
          if (!existingSizeByAspect[aspectKey]) {
            existingSizeByAspect[aspectKey] = {
              fontSize: ep.fontSize,
              arrowSize: ep.arrowSize,
              iconScale: ep.iconScale,
              panelPadding: ep.panelPadding,
            };
          }
        }
        fi++;
      }
    }
  }

  const panels = [];
  let flatIdx = 0;
  for (let col = 0; col < columnRows.length; col++) {
    const rows = columnRows[col];
    const rs = rowSizing?.[rows];
    // Fallback sizing: prefer what existing same-aspect panels already use, then layout defaults
    const aspectKey = `${ratio}|c${cols}|r${rows}`;
    const existingSize = existingSizeByAspect[aspectKey];
    const defaultFontSize = existingSize?.fontSize ?? rs?.fontSize ?? pd.fontSize ?? ld.fontSize ?? 16;
    const defaultArrowSize = existingSize?.arrowSize ?? rs?.arrowSize ?? ld.arrowSize ?? 36;
    const defaultIconScale = existingSize?.iconScale ?? rs?.iconScale ?? ld.iconScale ?? 0.65;
    const defaultPanelPadding = existingSize?.panelPadding ?? rs?.panelPadding ?? ld.panelPadding ?? 0;
    const rsPanelLayout = rs?.panelLayout || undefined;
    for (let r = 0; r < rows; r++) {
      if (existingPanels && flatIdx < existingPanels.length) {
        const ep = existingPanels[flatIdx];
        panels.push({
          ...ep,
          fontSize: defaultFontSize,
          arrowSize: defaultArrowSize,
          iconScale: defaultIconScale,
          panelPadding: defaultPanelPadding,
          ...(rsPanelLayout ? { panelLayout: rsPanelLayout } : {}),
        });
      } else {
        panels.push({
          ...createDefaultPanel(),
          fontSize: defaultFontSize,
          arrowSize: defaultArrowSize,
          iconScale: defaultIconScale,
          panelPadding: defaultPanelPadding,
          ...(rsPanelLayout ? { panelLayout: rsPanelLayout } : {}),
          bgColor: pd.bgColor || "#ffffff",
          textColor: pd.textColor || "#000000",
          arrowDir: pd.arrowDir || "up",
          arrowPosition: pd.arrowPosition || "right",
          iconPosition: pd.iconPosition || "left",
        });
      }
      flatIdx++;
    }
  }
  return panels.slice(0, target);
}

function createDefaultPanel() {
  return {
    id: Date.now() + Math.random(),
    text: "LABEL",
    icon: null,
    customIcon: null,
    arrowDir: "up",
    bgColor: "#ffffff",
    textColor: "#000000",
    fontSize: 16,
    arrowSize: 36,
    iconScale: 0.65,
    panelPadding: 0,
    showBorder: true,
    arrowPosition: "right",
    iconPosition: "left",
  };
}

const DEFAULT_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Known weight keywords (order matters — longer matches first)
const WEIGHT_KEYWORDS = [
  { pattern: 'ultralight', weight: 200, label: 'Ultra Light' },
  { pattern: 'extralight', weight: 200, label: 'Extra Light' },
  { pattern: 'hairline', weight: 100, label: 'Hairline' },
  { pattern: 'thin', weight: 100, label: 'Thin' },
  { pattern: 'light', weight: 300, label: 'Light' },
  { pattern: 'regular', weight: 400, label: 'Regular' },
  { pattern: 'normal', weight: 400, label: 'Regular' },
  { pattern: 'book', weight: 400, label: 'Book' },
  { pattern: 'antique', weight: 400, label: 'Antique' },
  { pattern: 'medium', weight: 500, label: 'Medium' },
  { pattern: 'semibold', weight: 600, label: 'Semi Bold' },
  { pattern: 'demibold', weight: 600, label: 'Demi Bold' },
  { pattern: 'extrabold', weight: 800, label: 'Extra Bold' },
  { pattern: 'ultrabold', weight: 800, label: 'Ultra Bold' },
  { pattern: 'bold', weight: 700, label: 'Bold' },
  { pattern: 'xblack', weight: 950, label: 'X Black' },
  { pattern: 'black', weight: 900, label: 'Black' },
  { pattern: 'ultra', weight: 950, label: 'Ultra' },
  { pattern: 'heavy', weight: 900, label: 'Heavy' },
];

// Suffixes to ignore when parsing variant
const IGNORE_SUFFIXES = ['trial', 'pro', 'web', 'desktop', 'otf', 'ttf', 'woff', 'woff2'];

function parseFontName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, '');
  // Split on hyphen or underscore
  const parts = base.split(/[-_]/);

  // Strip ignored suffixes from the end
  while (parts.length > 1 && IGNORE_SUFFIXES.includes(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }

  if (parts.length === 1) {
    return { family: parts[0], variant: 'Regular', weight: 400, style: 'normal' };
  }

  // Try to find the weight/style keyword starting from the end.
  // Everything before it is the family name.
  let familyParts = [...parts];
  let variantPart = '';

  // Check from the last part backwards for a weight keyword
  for (let i = parts.length - 1; i >= 1; i--) {
    const seg = parts[i].toLowerCase().replace(/italic|oblique/g, '');
    const match = WEIGHT_KEYWORDS.find(k => seg === k.pattern);
    if (match || parts[i].toLowerCase().includes('italic') || parts[i].toLowerCase().includes('oblique')) {
      // Also check if the part before this is a weight keyword (e.g. "Bold" + "Italic" as separate parts)
      let start = i;
      if (start > 1) {
        const prevSeg = parts[start - 1].toLowerCase();
        if (WEIGHT_KEYWORDS.find(k => k.pattern === prevSeg)) {
          start = start - 1;
        }
      }
      familyParts = parts.slice(0, start);
      variantPart = parts.slice(start).join('');
      break;
    }
  }

  // If no variant found, last part might be the variant
  if (!variantPart && parts.length > 1) {
    familyParts = parts.slice(0, -1);
    variantPart = parts[parts.length - 1];
  }

  const family = familyParts.join(' ');
  const lower = variantPart.toLowerCase();
  const isItalic = lower.includes('italic') || lower.includes('oblique') || lower.endsWith('it');
  const cleanWeight = lower.replace(/italic|oblique/g, '').replace(/it$/, '').trim();

  const matched = WEIGHT_KEYWORDS.find(k => k.pattern === cleanWeight);
  const weight = matched ? matched.weight : 400;
  const style = isItalic ? 'italic' : 'normal';

  // Build label
  let label = matched ? matched.label : (cleanWeight ? variantPart.replace(/([A-Z])/g, ' $1').trim() : 'Regular');
  if (isItalic && !label.toLowerCase().includes('italic')) label += ' Italic';

  return { family, variant: label, weight, style };
}

function createDefaultSign(ratio = "27:5") {
  const baseDefaults = getDefaults(ratio);
  const colRows = baseDefaults.columnRows || [1, 1, 1];
  const defaults = getDefaults(ratio, colRows);
  const panels = buildPanelsForLayout(ratio, colRows, null);
  const totalPanels = (defaults.columnRows || [1, 1, 1]).reduce((a, b) => a + b, 0);
  return {
    id: Date.now(),
    name: "Sign Assembly",
    ratio,
    fontFamily: defaults.fontFamily || DEFAULT_FONT,
    fontWeight: defaults.fontWeight ?? 700,
    fontStyle: defaults.fontStyle || "normal",
    allCaps: defaults.allCaps ?? true,
    arrowSize: defaults.arrowSize,
    arrowWeight: defaults.arrowWeight || 400,
    columns: defaults.columns,
    columnRows: [...(defaults.columnRows || [1, 1, 1])],
    panels,
    gap: defaults.gap,
    iconScale: defaults.iconScale,
    panelLayout: defaults.panelLayout || "auto",
    padding: defaults.padding ?? 0,
    panelPadding: defaults.panelPadding ?? 0,
    borderWidth: defaults.borderWidth ?? 2,
    borderColor: defaults.borderColor || "#333333",
    outerBorder: defaults.outerBorder ?? true,
  };
}

/* ── Helper: get column index for a flat panel index ── */
function getColumnForIndex(columnRows, flatIdx) {
  let remaining = flatIdx;
  for (let c = 0; c < columnRows.length; c++) {
    if (remaining < columnRows[c]) return c;
    remaining -= columnRows[c];
  }
  return columnRows.length - 1;
}

function getPanelAspectKey(signLike, panelIdx) {
  const rows = signLike.columnRows?.[getColumnForIndex(signLike.columnRows || [], panelIdx)] || 1;
  const cols = signLike.columnRows?.length || signLike.columns || 1;
  return `${signLike.ratio}|c${cols}|r${rows}`;
}

function getPanelAspectLabel(signLike, panelIdx) {
  const rows = signLike.columnRows?.[getColumnForIndex(signLike.columnRows || [], panelIdx)] || 1;
  const cols = signLike.columnRows?.length || signLike.columns || 1;
  return `${signLike.ratio} • ${cols} columns • ${rows}-row column panels`;
}

/* ── Helper: get starting flat index for a column ── */
function getColumnStartIndex(columnRows, col) {
  let start = 0;
  for (let c = 0; c < col; c++) start += columnRows[c];
  return start;
}

function getColumnForPanel(columnRows, panelIdx) {
  let count = 0;
  for (let c = 0; c < columnRows.length; c++) {
    count += columnRows[c];
    if (panelIdx < count) return c;
  }
  return columnRows.length - 1;
}

/* ── Arrow (uses font's arrow glyphs) ── */
function ArrowChar({ dir, size = 24, color = "#000", fontFamily }) {
  if (dir === "none" || !ARROW_CHARS[dir]) return null;
  return (
    <span style={{
      fontSize: size, lineHeight: 1, color,
      fontFamily,
      flexShrink: 0, display: "inline-block",
    }}>
      {ARROW_CHARS[dir]}
    </span>
  );
}

/* ── Panel Icon (built-in or custom) ── */
function PanelIcon({ panel, iconScale = 0.65, maxHeight = "85%" }) {
  const wrapStyle = {
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  // The inner div scales to fit
  const innerStyle = {
    width: "auto", height: "100%",
    maxWidth: `${Math.round(iconScale * 100)}%`, maxHeight,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  // Force any nested <svg> to scale to fit its container
  const svgCss = `
    .panel-icon-wrap svg {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      display: block;
    }
  `;

  if (!panel.customIcon) {
    return (
      <div style={wrapStyle}>
        <div style={{ ...innerStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 11 }}>No icon</div>
      </div>
    );
  }
  return (
    <div style={wrapStyle}>
      <style>{svgCss}</style>
      <div className="panel-icon-wrap" style={innerStyle}
        dangerouslySetInnerHTML={{ __html: panel.customIcon }} />
    </div>
  );
}

/* ── Single Panel Render ── */
function SignPanel({ panel, isPreview = false, fontFamily, fontWeight = 700, fontStyle = "normal", allCaps = true, arrowSize = 20, arrowFontFamily, horizontal = false, iconScale = 0.65, panelPadding = 0, debugSpacing = false }) {
  const lines = panel.text.split("\n");
  // Wrap custom face names in quotes for CSS; default fonts already have proper format
  const resolvedFont = fontFamily
    ? (fontFamily.includes("__") ? `'${fontFamily}'` : fontFamily)
    : DEFAULT_FONT;
  const resolvedArrowFont = arrowFontFamily
    ? (arrowFontFamily.includes("__") ? `'${arrowFontFamily}'` : arrowFontFamily)
    : resolvedFont;

  const panelWithFont = { ...panel, _fontWeight: fontWeight, _fontStyle: fontStyle };

  const resolvedArrowSize = panel.arrowSize ?? arrowSize;
  const resolvedIconScale = panel.iconScale ?? iconScale;
  const resolvedPanelPadding = panel.panelPadding ?? panelPadding;
  const arrowEl = <ArrowChar dir={panel.arrowDir} size={isPreview ? resolvedArrowSize : resolvedArrowSize * 0.8} color={panel.textColor} fontFamily={resolvedArrowFont} />;
  const arrowOnLeft = panel.arrowPosition === "left";
  const pp = isPreview ? resolvedPanelPadding : resolvedPanelPadding * 0.6;

  if (horizontal) {
    // Horizontal layout: icon left 1/3, text right 2/3, arrow top corner
    return (
      <div data-export={isPreview ? "panel" : undefined} style={{
        display: "flex", flexDirection: "row", alignItems: "stretch",
        backgroundColor: panel.bgColor,
        flex: 1, width: "100%", height: "100%",
        position: "relative",
        border: panel.showBorder ? `2px solid #333` : "none",
        boxSizing: "border-box",
        padding: pp,
        boxShadow: debugSpacing && resolvedPanelPadding > 0 ? `inset 0 0 0 ${pp}px rgba(255,0,0,0.2)` : undefined,
      }}>
        {/* Arrow overlay */}
        {panel.arrowDir !== "none" && (
          <div data-export={isPreview ? "arrow" : undefined} style={{
            position: "absolute",
            top: isPreview ? 2 : 1,
            [arrowOnLeft ? "left" : "right"]: isPreview ? 2 : 1,
            zIndex: 1,
          }}>
            {arrowEl}
          </div>
        )}
        {/* Icon — left 1/3 */}
        <div data-export={isPreview ? "icon-area" : undefined} style={{
          flex: "0 0 33.3%", display: "flex", alignItems: "center", justifyContent: "center",
          minWidth: 0, minHeight: 0,
          padding: isPreview ? "4px" : "2px",
          boxSizing: "border-box",
        }}>
          <PanelIcon panel={panel} iconScale={resolvedIconScale} maxHeight="100%" />
        </div>
        {/* Text — right 2/3 */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start",
          justifyContent: "center", minWidth: 0,
          padding: isPreview ? "8px 12px 8px 0" : "4px 8px 4px 0",
          fontFamily: resolvedFont,
          fontWeight: panelWithFont._fontWeight || 700,
          fontStyle: panelWithFont._fontStyle || "normal",
          fontSize: isPreview ? panel.fontSize : panel.fontSize * 0.7,
          color: panel.textColor, textAlign: "left", lineHeight: 1.15,
          letterSpacing: "0.05em", textTransform: allCaps ? "uppercase" : "none",
        }}>
          {lines.map((l, i) => <div key={i} data-export={isPreview ? "text-line" : undefined}>{l}</div>)}
        </div>
      </div>
    );
  }

  // Vertical layout: icon on top, text below, bottom-aligned
  return (
    <div data-export={isPreview ? "panel" : undefined} style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      backgroundColor: panel.bgColor,
      flex: 1, width: "100%", height: "100%",
      position: "relative",
      border: panel.showBorder ? `2px solid #333` : "none",
      boxSizing: "border-box",
      padding: pp,
      boxShadow: debugSpacing && resolvedPanelPadding > 0 ? `inset 0 0 0 ${pp}px rgba(255,0,0,0.2)` : undefined,
    }}>
      {/* Arrow overlay */}
      {panel.arrowDir !== "none" && (
        <div data-export={isPreview ? "arrow" : undefined} style={{
          position: "absolute",
          top: isPreview ? 2 : 1,
          [arrowOnLeft ? "left" : "right"]: isPreview ? 2 : 1,
          zIndex: 1,
        }}>
          {arrowEl}
        </div>
      )}
      {/* Icon area — centered */}
      <div data-export={isPreview ? "icon-area" : undefined} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", minHeight: 0,
        boxSizing: "border-box",
      }}>
        <PanelIcon panel={panel} iconScale={resolvedIconScale} />
      </div>
      {/* Text area */}
      <div style={{
        flex: "0 0 auto",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "flex-end", width: "100%",
          padding: isPreview ? "4px 8px 0" : "2px 6px 0",
          fontFamily: resolvedFont,
          fontWeight: panelWithFont._fontWeight || 700,
          fontStyle: panelWithFont._fontStyle || "normal",
          fontSize: isPreview ? panel.fontSize : panel.fontSize * 0.7,
          color: panel.textColor, textAlign: "center", lineHeight: 1.15,
          letterSpacing: "0.05em", textTransform: allCaps ? "uppercase" : "none",
          boxSizing: "border-box",
        }}>
          {lines.map((l, i) => <div key={i} data-export={isPreview ? "text-line" : undefined}>{l}</div>)}
        </div>
    </div>
  );
}

/* ── Panel Editor ── */
function PanelEditor({ panel, onChange, onRemove, onDuplicate, onLayoutChange, customIcons, iconTitleMap, fontFamily, fontWeight, fontStyle, allCaps, arrowSize, arrowFontFamily, rows, iconScale, panelLayout, ratio }) {
  const fileRef = useRef();

  const set = (key, val) => onChange({ ...panel, [key]: val });

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const svgText = ev.target.result;
      set("customIcon", svgText);
    };
    reader.readAsText(file);
  };

  const inputStyle = {
    width: "100%", padding: "6px 8px", border: "1px solid #d1d5db",
    borderRadius: 6, fontSize: 13, background: "#fff",
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 2, display: "block" };
  const rowStyle = { display: "flex", gap: 8, marginBottom: 8 };

  return (
    <div style={{
      background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10,
      padding: 14, marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>
          {panel.text.split("\n")[0] || "Panel"}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onDuplicate} style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>Duplicate</button>
          <button onClick={onRemove} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", color: "#dc2626" }}>Remove</button>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Label Text (use Enter for line breaks)</label>
        <textarea value={panel.text} onChange={(e) => set("text", e.target.value)}
          rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
      </div>

      <div style={rowStyle}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Icon</label>
          <select value={(() => {
              if (!panel.customIcon) return "";
              const idx = customIcons.findIndex(ci => ci.svg === panel.customIcon);
              return idx >= 0 ? `__ci_${idx}` : "__custom__";
            })()}
            onChange={(e) => {
              if (e.target.value === "__upload__") { fileRef.current?.click(); return; }
              if (e.target.value.startsWith("__ci_")) {
                const icon = customIcons[parseInt(e.target.value.replace("__ci_", ""))];
                const baseName = icon.name.replace(/\.[^.]+$/, "");
                const autoText = (iconTitleMap || ICON_TEXT_MAP)[baseName] || baseName.replace(/[-_]/g, " ").toUpperCase();
                const forcedBg = ICON_BG_RULES[baseName];
                onChange({ ...panel, customIcon: icon.svg, text: autoText, ...(forcedBg ? { bgColor: forcedBg } : {}) });
                return;
              }
              if (e.target.value === "") { onChange({ ...panel, icon: null, customIcon: null }); }
            }}
            style={inputStyle}>
            <option value="">None</option>
            {customIcons.length > 0 && customIcons.map((ci, i) => (
              <option key={i} value={`__ci_${i}`}>{ci.name}</option>
            ))}
            <option value="__upload__">+ Upload SVG...</option>
          </select>
          <input ref={fileRef} type="file" accept=".svg" style={{ display: "none" }} onChange={handleIconUpload} />
        </div>

        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Arrow Direction</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {Object.entries(ARROW_CHARS).map(([dir, sym]) => (
              <button key={dir} onClick={() => set("arrowDir", dir)}
                style={{
                  width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                  border: panel.arrowDir === dir ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  borderRadius: 6, background: panel.arrowDir === dir ? "#eff6ff" : "#fff",
                  fontSize: 16, cursor: "pointer", fontWeight: 600,
                }}>
                {dir === "none" ? "\u00d7" : sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={rowStyle}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Arrow Position</label>
          <div style={{ display: "flex", gap: 4 }}>
            {["left", "right"].map((pos) => (
              <button key={pos} onClick={() => set("arrowPosition", pos)}
                style={{
                  flex: 1, padding: "4px 8px", fontSize: 12, cursor: "pointer",
                  border: panel.arrowPosition === pos ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  borderRadius: 6, background: panel.arrowPosition === pos ? "#eff6ff" : "#fff",
                  fontWeight: 600, textTransform: "capitalize",
                }}>{pos}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Layout</label>
          <div style={{ display: "flex", gap: 3 }}>
            {["auto", "vertical", "horizontal"].map((mode) => (
              <button key={mode} onClick={() => onLayoutChange(mode)}
                style={{
                  flex: 1, padding: "4px 0", fontSize: 10, cursor: "pointer", fontWeight: 600,
                  border: (panel.panelLayout || "auto") === mode ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  borderRadius: 4, background: (panel.panelLayout || "auto") === mode ? "#eff6ff" : "#fff",
                  color: (panel.panelLayout || "auto") === mode ? "#3b82f6" : "#374151",
                }}>{mode === "auto" ? "Auto" : mode === "vertical" ? "Stack" : "Side"}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={rowStyle}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Background</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {COLOR_PALETTE.map(({ color, label }) => (
              <button key={color} title={label} onClick={() => set("bgColor", color)}
                style={{
                  width: 28, height: 28, borderRadius: 6, cursor: "pointer",
                  background: color,
                  border: panel.bgColor.toLowerCase() === color.toLowerCase() ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  boxShadow: panel.bgColor.toLowerCase() === color.toLowerCase() ? "0 0 0 2px #bfdbfe" : "none",
                }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="color" value={panel.bgColor} onChange={(e) => set("bgColor", e.target.value)}
              style={{ width: 28, height: 28, border: "1px solid #d1d5db", borderRadius: 6, padding: 2, cursor: "pointer" }} />
            <input value={panel.bgColor} onChange={(e) => set("bgColor", e.target.value)}
              style={{ ...inputStyle, width: 80 }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Text Color</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="color" value={panel.textColor} onChange={(e) => set("textColor", e.target.value)}
              style={{ width: 32, height: 32, border: "1px solid #d1d5db", borderRadius: 6, padding: 2, cursor: "pointer" }} />
            <input value={panel.textColor} onChange={(e) => set("textColor", e.target.value)}
              style={{ ...inputStyle, width: 80 }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Font Size</label>
          <input type="range" min={10} max={32} value={panel.fontSize}
            onChange={(e) => set("fontSize", parseInt(e.target.value))}
            style={{ width: "100%" }} />
          <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{formatInches(pxToInches(panel.fontSize, ratio))}</div>
        </div>
      </div>

      {/* Mini preview */}
      <div style={{ marginTop: 6, border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
        <SignPanel panel={panel} fontFamily={fontFamily} fontWeight={fontWeight} fontStyle={fontStyle} allCaps={allCaps} arrowSize={arrowSize} arrowFontFamily={arrowFontFamily} horizontal={(() => { const pl = panel.panelLayout && panel.panelLayout !== "auto" ? panel.panelLayout : panelLayout; return pl === "horizontal" || (pl !== "vertical" && rows > 1); })()} iconScale={iconScale} />
      </div>
    </div>
  );
}

/* ── Compute sign dimensions from ratio ── */
function getSignDimensions(sign) {
  const r = SIGN_RATIOS[sign.ratio] || SIGN_RATIOS["27:5"];
  const cols = sign.columns;
  const columnRows = sign.columnRows || Array(cols).fill(1);
  const gap = sign.gap;
  const border = sign.outerBorder ? sign.borderWidth * 2 : 0;

  // Base the total width on a reasonable pixel size, then derive cell sizes
  const baseWidth = 1800;
  const totalW = baseWidth;
  const totalH = baseWidth * (r.h / r.w);

  const innerW = totalW - border - (cols - 1) * gap;
  const innerH = totalH - border;
  const cellW = innerW / cols;
  const ox = sign.outerBorder ? sign.borderWidth : 0;
  const oy = sign.outerBorder ? sign.borderWidth : 0;

  return { totalW, totalH, cellW, innerH, cols, columnRows, gap, ox, oy };
}

/* ── SVG Export (DOM measurement — pixel-perfect native SVG for Figma/Illustrator) ── */
async function exportSignToSVG(sign, customFonts, arrowFontFamily, containerEl) {
  if (!containerEl) return '';

  const containerRect = containerEl.getBoundingClientRect();
  const scale = 1800 / containerRect.width;
  const svgW = Math.round(containerRect.width * scale);
  const svgH = Math.round(containerRect.height * scale);

  // Resolve font names for SVG
  const fontFamily = sign.fontFamily || DEFAULT_FONT;
  const resolvedFont = fontFamily.includes("__") ? fontFamily : fontFamily;
  const resolvedArrowFont = arrowFontFamily
    ? (arrowFontFamily.includes("__") ? arrowFontFamily : arrowFontFamily)
    : resolvedFont;

  // Embed fonts as base64 @font-face
  let fontFaceRules = '';
  if (customFonts && customFonts.length > 0) {
    const usedFaceNames = new Set([fontFamily]);
    if (arrowFontFamily) usedFaceNames.add(arrowFontFamily);
    const usedFamilies = new Set();
    for (const fn of usedFaceNames) {
      const f = customFonts.find(cf => cf.faceName === fn);
      if (f) usedFamilies.add(f.family);
    }
    const fontsToEmbed = customFonts.filter(f => usedFamilies.has(f.family));
    for (const f of fontsToEmbed) {
      try {
        const resp = await fetch(f.url);
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);
        const ext = (f.url || '').split('.').pop().toLowerCase();
        const format = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'otf' ? 'opentype' : 'truetype';
        fontFaceRules += `@font-face { font-family: '${f.faceName}'; src: url(data:font/${ext};base64,${b64}) format('${format}'); }\n`;
      } catch {}
    }
  }

  function esc(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Extract viewBox and inner content from an SVG string
  function parseIconSVG(svgStr) {
    if (!svgStr) return null;
    const cleaned = svgStr.replace(/<\?xml[^?]*\?>/g, '').replace(/<!DOCTYPE[^>]*>/g, '').trim();
    const svgMatch = cleaned.match(/<svg([^>]*)>([\s\S]*)<\/svg>/i);
    if (!svgMatch) return null;
    const attrs = svgMatch[1];
    const inner = svgMatch[2];
    let viewBox = '';
    const vbMatch = attrs.match(/viewBox=["']([^"']+)["']/);
    if (vbMatch) {
      viewBox = vbMatch[1];
    } else {
      const wM = attrs.match(/\bwidth=["']([^"']+)["']/);
      const hM = attrs.match(/\bheight=["']([^"']+)["']/);
      if (wM && hM) viewBox = `0 0 ${parseFloat(wM[1])} ${parseFloat(hM[1])}`;
    }
    return { inner, viewBox };
  }

  // Convert rgb/rgba to hex for SVG compatibility
  function colorToHex(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return 'none';
    if (color.startsWith('#')) return color;
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const [, r, g, b] = m;
      return '#' + [r, g, b].map(c => parseInt(c).toString(16).padStart(2, '0')).join('');
    }
    return color;
  }

  let els = '';

  // Outer border
  const cStyle = getComputedStyle(containerEl);
  const outerBW = parseFloat(cStyle.borderTopWidth) || 0;
  if (outerBW > 0) {
    const bw = outerBW * scale;
    const br = (parseFloat(cStyle.borderTopLeftRadius) || 0) * scale;
    const color = colorToHex(cStyle.borderTopColor);
    els += `<rect x="${(bw / 2).toFixed(1)}" y="${(bw / 2).toFixed(1)}" width="${(svgW - bw).toFixed(1)}" height="${(svgH - bw).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${bw.toFixed(1)}" rx="${br.toFixed(1)}" ry="${br.toFixed(1)}"/>`;
  }

  // Find all panels via data-export attribute
  const panelEls = containerEl.querySelectorAll('[data-export="panel"]');
  let panelDataIdx = 0;

  panelEls.forEach((panelEl) => {
    const panel = sign.panels[panelDataIdx];
    if (!panel) return;
    panelDataIdx++;

    const pRect = panelEl.getBoundingClientRect();
    const px = (pRect.left - containerRect.left) * scale;
    const py = (pRect.top - containerRect.top) * scale;
    const pw = pRect.width * scale;
    const ph = pRect.height * scale;

    // Panel background
    const pStyle = getComputedStyle(panelEl);
    const bgColor = colorToHex(pStyle.backgroundColor);
    if (bgColor !== 'none') {
      els += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" fill="${bgColor}"/>`;
    }

    // Panel border
    const pBW = parseFloat(pStyle.borderTopWidth) || 0;
    if (pBW > 0) {
      const bw = pBW * scale;
      const bColor = colorToHex(pStyle.borderTopColor);
      els += `<rect x="${(px + bw / 2).toFixed(1)}" y="${(py + bw / 2).toFixed(1)}" width="${(pw - bw).toFixed(1)}" height="${(ph - bw).toFixed(1)}" fill="none" stroke="${bColor}" stroke-width="${bw.toFixed(1)}"/>`;
    }

    // Icon — find the SVG inside the icon area
    const iconArea = panelEl.querySelector('[data-export="icon-area"]');
    if (iconArea && panel.customIcon) {
      const svgEl = iconArea.querySelector('svg');
      if (svgEl) {
        const iRect = svgEl.getBoundingClientRect();
        if (iRect.width > 0 && iRect.height > 0) {
          const ix = (iRect.left - containerRect.left) * scale;
          const iy = (iRect.top - containerRect.top) * scale;
          const iw = iRect.width * scale;
          const ih = iRect.height * scale;
          const icon = parseIconSVG(panel.customIcon);
          if (icon) {
            els += `<svg x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}"${icon.viewBox ? ` viewBox="${icon.viewBox}"` : ''} preserveAspectRatio="xMidYMid meet">${icon.inner}</svg>`;
          }
        }
      }
    }

    // Text lines — measure each line's exact position using Range API for precise baseline
    const textLines = panelEl.querySelectorAll('[data-export="text-line"]');
    textLines.forEach((lineEl) => {
      const lRect = lineEl.getBoundingClientRect();
      if (lRect.width === 0 && lRect.height === 0) return;

      const parentStyle = getComputedStyle(lineEl.parentElement);
      const fontSize = parseFloat(parentStyle.fontSize);
      let text = lineEl.textContent || '';
      // textTransform is inherited from parent
      const tt = parentStyle.textTransform;
      if (tt === 'uppercase') text = text.toUpperCase();
      else if (tt === 'lowercase') text = text.toLowerCase();
      if (!text.trim()) return;

      // Use Range API to get exact text bounding box (accounts for baseline)
      const textNode = lineEl.firstChild;
      let textTop = lRect.top;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.selectNodeContents(lineEl);
        const rangeRect = range.getBoundingClientRect();
        textTop = rangeRect.top;
      }

      // For SVG <text>, y is the baseline. With line-height:1.15 and a DOM rect,
      // the baseline sits at top + ascent. Ascent ≈ fontSize * 0.82 for most fonts.
      // We use the actual rendered rect from Range which is tighter than the div rect.
      const ascent = fontSize * 0.82;
      const lx = (lRect.left - containerRect.left) * scale;
      const ly = ((textTop - containerRect.top) + ascent) * scale;
      const lfs = fontSize * scale;
      const lls = (parseFloat(parentStyle.letterSpacing) || 0) * scale;

      // Determine text alignment
      const textAlign = parentStyle.textAlign;
      let anchor = 'start';
      let tx = lx;
      if (textAlign === 'center') {
        anchor = 'middle';
        tx = (lRect.left - containerRect.left + lRect.width / 2) * scale;
      } else if (textAlign === 'right' || textAlign === 'end') {
        anchor = 'end';
        tx = (lRect.left - containerRect.left + lRect.width) * scale;
      }

      const svgFontFam = resolvedFont;
      els += `<text x="${tx.toFixed(1)}" y="${ly.toFixed(1)}" font-family="'${svgFontFam}'" font-size="${lfs.toFixed(1)}" fill="${colorToHex(parentStyle.color)}" letter-spacing="${lls.toFixed(1)}" text-anchor="${anchor}">${esc(text)}</text>`;
    });

    // Arrow — measure exact position
    const arrowWrapper = panelEl.querySelector('[data-export="arrow"]');
    if (arrowWrapper) {
      const arrowSpan = arrowWrapper.querySelector('span');
      if (arrowSpan) {
        const aRect = arrowSpan.getBoundingClientRect();
        const aStyle = getComputedStyle(arrowSpan);
        const aSize = parseFloat(aStyle.fontSize);
        const text = arrowSpan.textContent || '';
        if (text.trim()) {
          // Arrow glyphs: ascent is roughly 0.82 of fontSize
          const ascent = aSize * 0.82;
          const ax = (aRect.left - containerRect.left) * scale;
          const ay = ((aRect.top - containerRect.top) + ascent) * scale;
          const afs = aSize * scale;
          els += `<text x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" font-family="'${resolvedArrowFont}'" font-size="${afs.toFixed(1)}" fill="${colorToHex(aStyle.color)}">${esc(text)}</text>`;
        }
      }
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
${fontFaceRules ? `<defs><style>\n${fontFaceRules}</style></defs>\n` : ''}${els}
</svg>`;
}

/* ── Main App ── */
export default function SignBuilder() {
  const [signs, setSigns] = useState([createDefaultSign()]);
  const [activeSignIdx, setActiveSignIdx] = useState(0);
  const [customIcons, setCustomIcons] = useState([]);
  const [customFonts, setCustomFonts] = useState([]);
  const [iconTitleMap, setIconTitleMap] = useState({...ICON_TEXT_MAP});
  const [iconTitlesSaved, setIconTitlesSaved] = useState(true);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragColIdx, setDragColIdx] = useState(null);
  const [showDebugSpacing, setShowDebugSpacing] = useState(false);
  const [iconDeleteMode, setIconDeleteMode] = useState(false);
  const [showHumanFigure, setShowHumanFigure] = useState(false);
  const [selectedAspectLabel, setSelectedAspectLabel] = useState("");
  const iconUploadRef = useRef();
  const fontUploadRef = useRef();
  const signPreviewRef = useRef();

  // Load saved icon titles on mount
  useEffect(() => {
    fetch('/icon-titles.json')
      .then(r => r.json())
      .then((data) => setIconTitleMap({ ...ICON_TEXT_MAP, ...data }))
      .catch(() => {});
  }, []);

  // Auto-save icon titles to server when they change
  useEffect(() => {
    setIconTitlesSaved(false);
    const timer = setTimeout(() => {
      fetch('/api/icon-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(iconTitleMap),
      }).then(() => setIconTitlesSaved(true)).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [iconTitleMap]);

  // Load saved icons from public/icons/ on mount
  useEffect(() => {
    fetch('/icons-manifest.json')
      .then(r => r.json())
      .then(async (icons) => {
        const loaded = await Promise.all(icons.map(async (ic) => {
          const resp = await fetch(ic.url);
          const svg = await resp.text();
          return { name: ic.name, svg };
        }));
        setCustomIcons(loaded);
      })
      .catch(() => {});
  }, []);

  // Load saved fonts from public/fonts/ on mount
  useEffect(() => {
    fetch('/fonts-manifest.json')
      .then(r => r.json())
      .then((fonts) => {
        const parsed = fonts.map((f) => {
          const p = parseFontName(f.name);
          // Each variant gets a unique face name so browser never does font matching
          const faceName = `${p.family}__${p.weight}__${p.style}`;
          return { ...f, family: p.family, variant: p.variant, weight: p.weight, fontStyle: p.style, faceName };
        });

        // Deduplicate: keep one file per family+weight+style, prefer woff2 > woff > otf > ttf
        const formatPriority = { woff2: 3, woff: 2, otf: 1, ttf: 0, opentype: 1, truetype: 0 };
        const deduped = {};
        parsed.forEach((f) => {
          const key = `${f.family}|${f.weight}|${f.fontStyle}`;
          const ext = (f.url || '').split('.').pop().toLowerCase();
          const priority = formatPriority[ext] ?? formatPriority[f.format] ?? 0;
          if (!deduped[key] || priority > (deduped[key]._priority || 0)) {
            deduped[key] = { ...f, _priority: priority };
          }
        });
        const uniqueFonts = Object.values(deduped).map(({ _priority, ...rest }) => rest);

        uniqueFonts.forEach((f) => {
          const face = new FontFace(f.faceName, `url(${f.url})`);
          face.load().then((loaded) => {
            document.fonts.add(loaded);
          }).catch(() => {});
        });
        setCustomFonts(uniqueFonts);
      })
      .catch(() => {});
  }, []);

  const sign = signs[activeSignIdx];

  // Resolve the arrow font: find the faceName in the same family matching arrowWeight
  const arrowFontFamily = (() => {
    if (!sign.fontFamily || !sign.fontFamily.includes('__')) return sign.fontFamily;
    const currentFont = customFonts.find(f => f.faceName === sign.fontFamily);
    if (!currentFont) return sign.fontFamily;
    const targetWeight = sign.arrowWeight || 400;
    // Find same family, same style, matching weight
    const match = customFonts.find(f =>
      f.family === currentFont.family &&
      f.fontStyle === currentFont.fontStyle &&
      f.weight === targetWeight
    );
    return match ? match.faceName : sign.fontFamily;
  })();

  const updateSign = useCallback((updates) => {
    setSigns((prev) => prev.map((s, i) => i === activeSignIdx ? { ...s, ...updates } : s));
  }, [activeSignIdx]);

  const updatePanel = useCallback((panelId, updates) => {
    setSigns((prev) => prev.map((s, i) => {
      if (i !== activeSignIdx) return s;
      const targetIdx = s.panels.findIndex((p) => p.id === panelId);
      if (targetIdx < 0) return s;

      // Standards tied to panel aspect (ratio + columns + rows)
      const shouldSyncByAspect = updates.fontSize !== undefined || updates.arrowSize !== undefined || updates.iconScale !== undefined || updates.panelPadding !== undefined;
      if (!shouldSyncByAspect) {
        return { ...s, panels: s.panels.map((p) => p.id === panelId ? { ...p, ...updates } : p) };
      }

      const targetAspect = getPanelAspectKey(s, targetIdx);
      const syncedPanels = s.panels.map((p, idx) => {
        if (getPanelAspectKey(s, idx) !== targetAspect) {
          return p.id === panelId ? { ...p, ...updates } : p;
        }
        return {
          ...p,
          ...(updates.fontSize !== undefined ? { fontSize: updates.fontSize } : {}),
          ...(updates.arrowSize !== undefined ? { arrowSize: updates.arrowSize } : {}),
          ...(updates.iconScale !== undefined ? { iconScale: updates.iconScale } : {}),
          ...(updates.panelPadding !== undefined ? { panelPadding: updates.panelPadding } : {}),
          ...(p.id === panelId ? updates : {}),
        };
      });
      return { ...s, panels: syncedPanels };
    }));
  }, [activeSignIdx]);

  const addPanel = () => {
    updateSign({ panels: [...sign.panels, createDefaultPanel()] });
  };

  const removePanel = (id) => {
    updateSign({ panels: sign.panels.filter((p) => p.id !== id) });
  };

  const duplicatePanel = (id) => {
    const idx = sign.panels.findIndex((p) => p.id === id);
    const dup = { ...sign.panels[idx], id: Date.now() + Math.random() };
    const newPanels = [...sign.panels];
    newPanels.splice(idx + 1, 0, dup);
    updateSign({ panels: newPanels });
  };

  const handleGlobalIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const svgText = ev.target.result;
      const name = file.name.replace(".svg", "");
      try {
        const resp = await fetch('/api/icons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, svg: svgText }),
        });
        const saved = await resp.json();
        setCustomIcons((prev) => [...prev, { name: saved.name, svg: svgText }]);
      } catch {
        setCustomIcons((prev) => [...prev, { name, svg: svgText }]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFontUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1];
        const parsed = parseFontName(file.name);
        try {
          const resp = await fetch('/api/fonts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, data: base64 }),
          });
          const saved = await resp.json();
          const faceName = `${parsed.family}__${parsed.weight}__${parsed.style}`;
          const face = new FontFace(faceName, `url(${saved.url})`);
          const loaded = await face.load();
          document.fonts.add(loaded);
          setCustomFonts((prev) => [...prev, {
            ...saved, family: parsed.family, variant: parsed.variant,
            weight: parsed.weight, fontStyle: parsed.style, faceName,
          }]);
        } catch {
          const name = file.name.replace(/\.[^.]+$/, '');
          const faceName = `${parsed.family}__${parsed.weight}__${parsed.style}`;
          const face = new FontFace(faceName, `url(${ev.target.result})`);
          try {
            const loaded = await face.load();
            document.fonts.add(loaded);
            setCustomFonts((prev) => [...prev, {
              name, family: parsed.family, variant: parsed.variant,
              weight: parsed.weight, fontStyle: parsed.style, faceName,
            }]);
          } catch {}
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleExportSVG = async () => {
    const svg = await exportSignToSVG(sign, customFonts, arrowFontFamily, signPreviewRef.current);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sign.name.replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    if (!signPreviewRef.current) return;
    try {
      // Build @font-face CSS with embedded base64 fonts so html-to-image can use them
      let fontCSS = '';
      if (customFonts.length > 0) {
        const fontFamily = sign.fontFamily || DEFAULT_FONT;
        const usedFaceNames = new Set([fontFamily]);
        if (arrowFontFamily) usedFaceNames.add(arrowFontFamily);
        const usedFamilies = new Set();
        for (const fn of usedFaceNames) {
          const f = customFonts.find(cf => cf.faceName === fn);
          if (f) usedFamilies.add(f.family);
        }
        const fontsToEmbed = customFonts.filter(f => usedFamilies.has(f.family));
        for (const f of fontsToEmbed) {
          try {
            const resp = await fetch(f.url);
            const buf = await resp.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const b64 = btoa(binary);
            const ext = (f.url || '').split('.').pop().toLowerCase();
            const format = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'otf' ? 'opentype' : 'truetype';
            fontCSS += `@font-face { font-family: '${f.faceName}'; src: url(data:font/${ext};base64,${b64}) format('${format}'); font-display: block; }\n`;
          } catch {}
        }
      }

      // Inject a <style> with embedded fonts into the container temporarily
      let styleEl = null;
      if (fontCSS) {
        styleEl = document.createElement('style');
        styleEl.textContent = fontCSS;
        signPreviewRef.current.prepend(styleEl);
      }

      const dataUrl = await toPng(signPreviewRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        includeQueryParams: true,
      });

      // Clean up injected style
      if (styleEl) styleEl.remove();

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${sign.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    }
  };

  // Panel drag reorder (within same column only)
  const handleDragStart = (e, idx) => { e.stopPropagation(); setDragIdx(idx); };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIdx === null || dragIdx === idx) return;
    // Only allow swaps within the same column
    const colOfDrag = getColumnForPanel(columnRows, dragIdx);
    const colOfTarget = getColumnForPanel(columnRows, idx);
    if (colOfDrag !== colOfTarget) return;
    const newPanels = [...sign.panels];
    const [moved] = newPanels.splice(dragIdx, 1);
    newPanels.splice(idx, 0, moved);
    updateSign({ panels: newPanels });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  // Column drag reorder
  const handleColDragStart = (colIdx) => { setDragColIdx(colIdx); };
  const handleColDragOver = (e, colIdx) => {
    e.preventDefault();
    if (dragColIdx === null || dragColIdx === colIdx) return;
    const newColRows = [...columnRows];
    const newPanels = [...sign.panels];
    // Get panels for each column
    const fromStart = getColumnStartIndex(newColRows, dragColIdx);
    const fromCount = newColRows[dragColIdx];
    const toStart = getColumnStartIndex(newColRows, colIdx);
    const toCount = newColRows[colIdx];
    // Extract both column panel groups
    const fromPanels = newPanels.slice(fromStart, fromStart + fromCount);
    const toPanels = newPanels.slice(toStart, toStart + toCount);
    // Swap columnRows
    [newColRows[dragColIdx], newColRows[colIdx]] = [newColRows[colIdx], newColRows[dragColIdx]];
    // Rebuild panel array with swapped columns
    const rebuilt = [];
    for (let c = 0; c < newColRows.length; c++) {
      const start = getColumnStartIndex(columnRows, c);
      if (c === dragColIdx) rebuilt.push(...toPanels);
      else if (c === colIdx) rebuilt.push(...fromPanels);
      else rebuilt.push(...newPanels.slice(start, start + columnRows[c]));
    }
    updateSign({ columnRows: newColRows, panels: rebuilt });
    setDragColIdx(colIdx);
  };
  const handleColDragEnd = () => setDragColIdx(null);

  const swapColumns = (colA, colB) => {
    const newColRows = [...columnRows];
    const newPanels = [...sign.panels];
    const aStart = getColumnStartIndex(newColRows, colA);
    const aCount = newColRows[colA];
    const bStart = getColumnStartIndex(newColRows, colB);
    const bCount = newColRows[colB];
    const aPanels = newPanels.slice(aStart, aStart + aCount);
    const bPanels = newPanels.slice(bStart, bStart + bCount);
    [newColRows[colA], newColRows[colB]] = [newColRows[colB], newColRows[colA]];
    const rebuilt = [];
    for (let c = 0; c < newColRows.length; c++) {
      const start = getColumnStartIndex(columnRows, c);
      if (c === colA) rebuilt.push(...bPanels);
      else if (c === colB) rebuilt.push(...aPanels);
      else rebuilt.push(...newPanels.slice(start, start + columnRows[c]));
    }
    updateSign({ columnRows: newColRows, panels: rebuilt });
  };

  const cols = sign.columns;
  const columnRows = sign.columnRows || Array(cols).fill(1);
  const totalPanels = columnRows.reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f3f4f6" }}>
      {/* ── Left: Editor Panel ── */}
      <div style={{
        width: 380, borderRight: "1px solid #e5e7eb", background: "#fff",
        overflowY: "auto", padding: 16, flexShrink: 0,
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "#111827" }}>
Empire State Plaza Sign Builder        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
          WXY
        </div>

        {/* Sign-level controls */}
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#374151" }}>Sign Settings</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 2 }}>Sign Name</label>
            <input value={sign.name} onChange={(e) => updateSign({ name: e.target.value })}
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Sign Ratio</label>
            <div style={{ display: "flex", gap: 4 }}>
              {Object.entries(SIGN_RATIOS).map(([key, { label, w, h }]) => (
                <button key={key} onClick={() => {
                  const defaults = getDefaults(key);
                  const newColRows = defaults.columnRows || sign.columnRows;
                  const panels = buildPanelsForLayout(key, newColRows, sign.panels, sign.columnRows, sign.ratio);
                  const layoutDefaults = getDefaults(key, newColRows);
                  updateSign({
                    ratio: key,
                    columns: defaults.columns ?? sign.columns,
                    columnRows: newColRows,
                    arrowSize: layoutDefaults.arrowSize ?? sign.arrowSize,
                    arrowWeight: layoutDefaults.arrowWeight ?? sign.arrowWeight,
                    gap: layoutDefaults.gap ?? sign.gap,
                    iconScale: layoutDefaults.iconScale ?? sign.iconScale,
                    fontFamily: layoutDefaults.fontFamily || sign.fontFamily,
                    fontWeight: layoutDefaults.fontWeight ?? sign.fontWeight,
                    fontStyle: layoutDefaults.fontStyle || sign.fontStyle,
                    allCaps: layoutDefaults.allCaps ?? sign.allCaps,
                    padding: layoutDefaults.padding ?? sign.padding,
                    panelPadding: layoutDefaults.panelPadding ?? sign.panelPadding,
                    panelLayout: layoutDefaults.panelLayout || sign.panelLayout || "auto",
                    borderWidth: layoutDefaults.borderWidth ?? sign.borderWidth,
                    borderColor: layoutDefaults.borderColor || sign.borderColor,
                    outerBorder: layoutDefaults.outerBorder ?? sign.outerBorder,
                    panels,
                  });
                }}
                  style={{
                    flex: 1, padding: "8px 6px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    border: sign.ratio === key ? "2px solid #3b82f6" : "1px solid #d1d5db",
                    borderRadius: 6, background: sign.ratio === key ? "#eff6ff" : "#fff",
                    color: sign.ratio === key ? "#3b82f6" : "#374151",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}>
                  {(() => {
                    const maxW = 60, maxH = 36;
                    const scale = Math.min(maxW / w, maxH / h);
                    const iconW = w * scale;
                    const iconH = h * scale;
                    return <div style={{
                      width: iconW, height: iconH,
                      border: `2px solid ${sign.ratio === key ? "#3b82f6" : "#9ca3af"}`,
                      borderRadius: 2, background: sign.ratio === key ? "#dbeafe" : "#f3f4f6",
                    }} />;
                  })()}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 2 }}>Columns</label>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => {
                    const newColRows = [...columnRows];
                    while (newColRows.length > n) newColRows.pop();
                    while (newColRows.length < n) newColRows.push(1);
                    const ld = getDefaults(sign.ratio, newColRows);
                    const panels = buildPanelsForLayout(sign.ratio, newColRows, sign.panels, sign.columnRows);
                    updateSign({
                      columns: n, columnRows: newColRows, panels,
                      arrowSize: ld.arrowSize, iconScale: ld.iconScale,
                      panelLayout: ld.panelLayout || sign.panelLayout || "auto",
                    });
                  }}
                    style={{
                      flex: 1, padding: "6px 0", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      border: sign.columns === n ? "2px solid #3b82f6" : "1px solid #d1d5db",
                      borderRadius: 6, background: sign.columns === n ? "#eff6ff" : "#fff",
                      color: sign.columns === n ? "#3b82f6" : "#374151",
                    }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 2 }}>Gap (px)</label>
              <input type="range" min={0} max={16} value={sign.gap}
                onChange={(e) => updateSign({ gap: parseInt(e.target.value) })} style={{ width: "100%" }} />
              <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{sign.gap}px</div>
            </div>
          </div>
          {/* Per-column row controls */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Rows per Column</label>
            <div style={{ display: "flex", gap: 6 }}>
              {columnRows.map((rowCount, colIdx) => (
                <div key={colIdx} style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, marginBottom: 2 }}>
                    {colIdx > 0 && (
                      <button onClick={() => swapColumns(colIdx - 1, colIdx)} title="Move column left"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#9ca3af", padding: 0, lineHeight: 1 }}>◀</button>
                    )}
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>Col {colIdx + 1}</span>
                    {colIdx < columnRows.length - 1 && (
                      <button onClick={() => swapColumns(colIdx, colIdx + 1)} title="Move column right"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#9ca3af", padding: 0, lineHeight: 1 }}>▶</button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => {
                        const newColRows = [...columnRows];
                        newColRows[colIdx] = n;
                        const ld = getDefaults(sign.ratio, newColRows);
                        const panels = buildPanelsForLayout(sign.ratio, newColRows, sign.panels, sign.columnRows);
                        updateSign({
                          columnRows: newColRows, panels,
                          arrowSize: ld.arrowSize, iconScale: ld.iconScale,
                          panelLayout: ld.panelLayout || sign.panelLayout || "auto",
                        });
                      }}
                        style={{
                          flex: 1, padding: "3px 0", fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: rowCount === n ? "2px solid #3b82f6" : "1px solid #d1d5db",
                          borderRadius: 4, background: rowCount === n ? "#eff6ff" : "#fff",
                          color: rowCount === n ? "#3b82f6" : "#374151",
                        }}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Panel Padding control */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 2 }}>Panel Padding</label>
            {(() => {
              const rowCounts = [...new Set(columnRows)];
              const hasMixed = rowCounts.length > 1;
              if (!hasMixed) {
                return (
                  <>
                    <input type="range" min={0} max={24} value={sign.panels[0]?.panelPadding ?? sign.panelPadding}
                      onChange={(e) => {
                        const pp = parseInt(e.target.value);
                        updateSign({ panelPadding: pp, panels: sign.panels.map(p => ({ ...p, panelPadding: pp })) });
                      }} style={{ width: "100%" }} />
                    <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{sign.panels[0]?.panelPadding ?? sign.panelPadding}px</div>
                  </>
                );
              }
              return rowCounts.map((rc) => {
                const label = rc === 1 ? "Full panels" : `${rc}-row panels`;
                let sampleIdx = 0;
                for (let c = 0; c < columnRows.length; c++) {
                  if (columnRows[c] === rc) break;
                  sampleIdx += columnRows[c];
                }
                const currentPp = sign.panels[sampleIdx]?.panelPadding ?? sign.panelPadding;
                return (
                  <div key={rc} style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1 }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="range" min={0} max={24} value={currentPp}
                        onChange={(e) => {
                          const pp = parseInt(e.target.value);
                          let idx = 0;
                          const newPanels = [...sign.panels];
                          for (let c = 0; c < columnRows.length; c++) {
                            for (let r = 0; r < columnRows[c]; r++) {
                              if (columnRows[c] === rc && idx < newPanels.length) {
                                newPanels[idx] = { ...newPanels[idx], panelPadding: pp };
                              }
                              idx++;
                            }
                          }
                          updateSign({ panels: newPanels });
                        }} style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 28 }}>{currentPp}px</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          {/* Panel Layout orientation */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Panel Layout</label>
            <div style={{ display: "flex", gap: 4 }}>
              {["auto", "vertical", "horizontal"].map((mode) => (
                <button key={mode} onClick={() => updateSign({ panelLayout: mode, panels: sign.panels.map(p => ({ ...p, panelLayout: "auto" })) })}
                  style={{
                    flex: 1, padding: "4px 0", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: (sign.panelLayout || "auto") === mode ? "2px solid #3b82f6" : "1px solid #d1d5db",
                    borderRadius: 4, background: (sign.panelLayout || "auto") === mode ? "#eff6ff" : "#fff",
                    color: (sign.panelLayout || "auto") === mode ? "#3b82f6" : "#374151",
                    textTransform: "capitalize",
                  }}>{mode === "auto" ? "Auto" : mode === "vertical" ? "Stacked" : "Side-by-side"}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 2 }}>
              {(sign.panelLayout || "auto") === "auto" ? "Multi-row → side-by-side, single → stacked" : (sign.panelLayout || "auto") === "vertical" ? "Icon on top, text below" : "Icon left, text right"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={sign.outerBorder}
                  onChange={(e) => updateSign({ outerBorder: e.target.checked })} />
                Outer border
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer", color: showDebugSpacing ? "#dc2626" : "#9ca3af" }}>
                <input type="checkbox" checked={showDebugSpacing}
                  onChange={(e) => setShowDebugSpacing(e.target.checked)} />
                Debug
              </label>
            </div>
            <button onClick={() => {
              const fontVal = sign.fontFamily === DEFAULT_FONT ? null : `"${sign.fontFamily}"`;
              const layoutKey = getLayoutKey(sign.columnRows);
              // Build rowSizing from current panel standards
              const rowCounts = [...new Set(sign.columnRows)];
              let rowSizingCode = "";
              if (rowCounts.length > 1) {
                const entries = rowCounts.map(rc => {
                  let sampleIdx = 0;
                  for (let c = 0; c < sign.columnRows.length; c++) {
                    if (sign.columnRows[c] === rc) break;
                    sampleIdx += sign.columnRows[c];
                  }
                  const fs = sign.panels[sampleIdx]?.fontSize || 16;
                  const as = sign.panels[sampleIdx]?.arrowSize ?? sign.arrowSize;
                  const isc = sign.panels[sampleIdx]?.iconScale ?? sign.iconScale ?? 0.65;
                  const ppd = sign.panels[sampleIdx]?.panelPadding ?? sign.panelPadding ?? 0;
                  const ppl = sign.panels[sampleIdx]?.panelLayout;
                  const plPart = ppl && ppl !== "auto" ? `, panelLayout: "${ppl}"` : "";
                  return `          ${rc}: { fontSize: ${fs}, arrowSize: ${as}, iconScale: ${isc}, panelPadding: ${ppd}${plPart} },`;
                });
                rowSizingCode = `\n        rowSizing: {\n${entries.join("\n")}\n        },`;
              }
              // Check if any panel has a non-auto layout override
              const samplePl = sign.panels[0]?.panelLayout;
              const allPanelsSameLayout = sign.panels.every(p => (p.panelLayout || "auto") === (samplePl || "auto"));
              const panelPlCode = allPanelsSameLayout && samplePl && samplePl !== "auto" ? ` panelLayout: "${samplePl}",` : "";
              const plCode = (sign.panelLayout && sign.panelLayout !== "auto") ? ` panelLayout: "${sign.panelLayout}",` : panelPlCode;
              const code = `      "${layoutKey}": { fontSize: ${sign.panels[0]?.fontSize || 16}, arrowSize: ${sign.panels[0]?.arrowSize ?? sign.arrowSize}, iconScale: ${sign.panels[0]?.iconScale ?? sign.iconScale}, panelPadding: ${sign.panels[0]?.panelPadding ?? sign.panelPadding},${plCode}${rowSizingCode} },`;
              const fullCode = `  "${sign.ratio}": {
    // Layout: ${layoutKey}
    columns: ${sign.columns},
    columnRows: [${sign.columnRows.join(", ")}],
    gap: ${sign.gap},
    iconScale: ${sign.iconScale},

    // Typography
    fontFamily: ${fontVal},
    fontWeight: ${sign.fontWeight},
    fontStyle: "${sign.fontStyle}",
    allCaps: ${sign.allCaps},
    fontSize: ${sign.panels[0]?.fontSize || 16},
    arrowSize: ${sign.arrowSize},
    arrowWeight: ${sign.arrowWeight || 400},

    // Border & Spacing
    outerBorder: ${sign.outerBorder},
    borderWidth: ${sign.borderWidth},
    borderColor: "${sign.borderColor}",
    padding: ${sign.padding},
    panelPadding: ${sign.panelPadding},
    panelLayout: "${sign.panelLayout || "auto"}",

    // Layout override for ${layoutKey}:
${code}
  },`;
              navigator.clipboard.writeText(fullCode).then(() => {
                alert(`Guidelines copied!\n\nSign: ${sign.ratio}\nLayout: ${layoutKey}${rowCounts.length > 1 ? "\nPer-row sizing included!" : ""}\n\nPaste to update SIGN_DEFAULTS.`);
              }).catch(() => {
                console.log("── SIGN_DEFAULTS for " + sign.ratio + " (layout: " + layoutKey + ") ──\n" + fullCode);
                alert("Copied to console.");
              });
            }}
              style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
              📋 Copy Guidelines
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Font Family</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {(() => {
                // Group custom fonts by family
                const families = {};
                customFonts.forEach((f) => {
                  const fam = f.family || f.name;
                  if (!families[fam]) families[fam] = [];
                  families[fam].push(f);
                });
                // Sort each family's variants: weight asc, then normal before italic
                Object.values(families).forEach((variants) => {
                  variants.sort((a, b) => {
                    if (a.weight !== b.weight) return a.weight - b.weight;
                    return (a.fontStyle === 'italic' ? 1 : 0) - (b.fontStyle === 'italic' ? 1 : 0);
                  });
                });
                const familyNames = Object.keys(families);

                // Determine if current selection is a custom family
                const currentFaceName = sign.fontFamily;
                const currentFont = customFonts.find(f => f.faceName === currentFaceName);
                const currentFamily = currentFont ? currentFont.family : null;
                const isCustomFamily = !!currentFamily;
                const variants = currentFamily ? (families[currentFamily] || []) : [];

                return (
                  <>
                    <select value={currentFamily || sign.fontFamily} onChange={(e) => {
                      const val = e.target.value;
                      const fv = families[val];
                      if (fv && fv.length > 0) {
                        const regular = fv.find(v => v.fontStyle !== 'italic') || fv[0];
                        updateSign({ fontFamily: regular.faceName, fontWeight: regular.weight, fontStyle: regular.fontStyle || 'normal' });
                      } else {
                        updateSign({ fontFamily: val, fontWeight: 700, fontStyle: "normal" });
                      }
                    }}
                      style={{ flex: 1, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}>
                      <option value={DEFAULT_FONT}>Helvetica Neue (Default)</option>
                      <option value="Georgia, 'Times New Roman', serif">Georgia</option>
                      <option value="'Courier New', Courier, monospace">Courier New</option>
                      {familyNames.map((fam) => (
                        <option key={fam} value={fam}>{fam}</option>
                      ))}
                    </select>
                    <button onClick={() => fontUploadRef.current?.click()}
                      style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                      + Font
                    </button>
                    <input ref={fontUploadRef} type="file" accept=".woff2,.woff,.ttf,.otf" multiple style={{ display: "none" }} onChange={handleFontUpload} />
                  </>
                );
              })()}
            </div>
            {(() => {
              const families = {};
              customFonts.forEach((f) => {
                const fam = f.family || f.name;
                if (!families[fam]) families[fam] = [];
                families[fam].push(f);
              });
              Object.values(families).forEach((variants) => {
                variants.sort((a, b) => {
                  if (a.weight !== b.weight) return a.weight - b.weight;
                  return (a.fontStyle === 'italic' ? 1 : 0) - (b.fontStyle === 'italic' ? 1 : 0);
                });
              });
              const currentFont = customFonts.find(f => f.faceName === sign.fontFamily);
              const currentFamily = currentFont ? currentFont.family : null;
              const variants = currentFamily ? (families[currentFamily] || []) : [];

              if (variants.length > 1) {
                return (
                  <div style={{ marginTop: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>Style</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {variants.map((v) => {
                        const isActive = sign.fontFamily === v.faceName;
                        return (
                          <button key={v.variant} onClick={() => updateSign({ fontFamily: v.faceName, fontWeight: v.weight, fontStyle: v.fontStyle || 'normal' })}
                            style={{
                              padding: "4px 10px", fontSize: 11, cursor: "pointer",
                              border: isActive ? "2px solid #3b82f6" : "1px solid #d1d5db",
                              borderRadius: 6, background: isActive ? "#eff6ff" : "#fff",
                              fontFamily: `'${v.faceName}'`,
                              color: isActive ? "#3b82f6" : "#374151",
                            }}>{v.variant}</button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            {sign.fontFamily !== DEFAULT_FONT && (
              <div style={{ marginTop: 6, padding: "6px 10px", background: "#f3f4f6", borderRadius: 6, fontFamily: sign.fontFamily.includes("__") ? `'${sign.fontFamily}'` : sign.fontFamily, fontSize: 14, textTransform: sign.allCaps ? "uppercase" : "none", letterSpacing: "0.05em" }}>
                PREVIEW TEXT
              </div>
            )}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={sign.allCaps} onChange={(e) => updateSign({ allCaps: e.target.checked })} />
                All Caps
              </label>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>Font Size</label>
                {(() => {
                  // Group panels by their column's row count for per-group sliders
                  const rowCounts = [...new Set(columnRows)];
                  const hasMixed = rowCounts.length > 1;
                  if (!hasMixed) {
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="range" min={8} max={48} value={sign.panels[0]?.fontSize || 16} onChange={(e) => {
                          const fs = parseInt(e.target.value);
                          updateSign({ panels: sign.panels.map(p => ({ ...p, fontSize: fs })) });
                        }} style={{ flex: 1 }} />
                        <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 36 }}>{formatInches(pxToInches(sign.panels[0]?.fontSize || 16, sign.ratio))}</span>
                      </div>
                    );
                  }
                  // Show one slider per row-count group
                  return rowCounts.map(rc => {
                    const label = rc === 1 ? "Full panels" : `${rc}-row panels`;
                    // Find the first panel in a column with this row count
                    let sampleIdx = 0;
                    for (let c = 0; c < columnRows.length; c++) {
                      if (columnRows[c] === rc) break;
                      sampleIdx += columnRows[c];
                    }
                    const currentFs = sign.panels[sampleIdx]?.fontSize || 16;
                    return (
                      <div key={rc} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1 }}>{label}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="range" min={8} max={48} value={currentFs} onChange={(e) => {
                            const fs = parseInt(e.target.value);
                            // Update only panels in columns with this row count
                            let idx = 0;
                            const newPanels = [...sign.panels];
                            for (let c = 0; c < columnRows.length; c++) {
                              for (let r = 0; r < columnRows[c]; r++) {
                                if (columnRows[c] === rc && idx < newPanels.length) {
                                  newPanels[idx] = { ...newPanels[idx], fontSize: fs };
                                }
                                idx++;
                              }
                            }
                            updateSign({ panels: newPanels });
                          }} style={{ flex: 1 }} />
                          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 36 }}>{formatInches(pxToInches(currentFs, sign.ratio))}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>Icon Scale</label>
                {(() => {
                  const rowCounts = [...new Set(columnRows)];
                  const hasMixed = rowCounts.length > 1;
                  if (!hasMixed) {
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="range" min={20} max={100} value={Math.round((sign.panels[0]?.iconScale ?? sign.iconScale ?? 0.65) * 100)} onChange={(e) => {
                          const scale = parseInt(e.target.value) / 100;
                          updateSign({ iconScale: scale, panels: sign.panels.map(p => ({ ...p, iconScale: scale })) });
                        }} style={{ flex: 1 }} />
                        <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 28 }}>{Math.round((sign.panels[0]?.iconScale ?? sign.iconScale ?? 0.65) * 100)}%</span>
                      </div>
                    );
                  }
                  return rowCounts.map(rc => {
                    const label = rc === 1 ? "Full panels" : `${rc}-row panels`;
                    let sampleIdx = 0;
                    for (let c = 0; c < columnRows.length; c++) {
                      if (columnRows[c] === rc) break;
                      sampleIdx += columnRows[c];
                    }
                    const currentScale = sign.panels[sampleIdx]?.iconScale ?? sign.iconScale ?? 0.65;
                    return (
                      <div key={rc} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1 }}>{label}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="range" min={20} max={100} value={Math.round(currentScale * 100)} onChange={(e) => {
                            const scale = parseInt(e.target.value) / 100;
                            let idx = 0;
                            const newPanels = [...sign.panels];
                            for (let c = 0; c < columnRows.length; c++) {
                              for (let r = 0; r < columnRows[c]; r++) {
                                if (columnRows[c] === rc && idx < newPanels.length) {
                                  newPanels[idx] = { ...newPanels[idx], iconScale: scale };
                                }
                                idx++;
                              }
                            }
                            updateSign({ panels: newPanels });
                          }} style={{ flex: 1 }} />
                          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 28 }}>{Math.round(currentScale * 100)}%</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>Arrow Size</label>
                {(() => {
                  const rowCounts = [...new Set(columnRows)];
                  const hasMixed = rowCounts.length > 1;
                  if (!hasMixed) {
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="range" min={8} max={72} value={sign.panels[0]?.arrowSize ?? sign.arrowSize} onChange={(e) => {
                          const as = parseInt(e.target.value);
                          updateSign({ arrowSize: as, panels: sign.panels.map(p => ({ ...p, arrowSize: as })) });
                        }} style={{ flex: 1 }} />
                        <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 36 }}>{formatInches(pxToInches(sign.panels[0]?.arrowSize ?? sign.arrowSize, sign.ratio))}</span>
                      </div>
                    );
                  }
                  return rowCounts.map(rc => {
                    const label = rc === 1 ? "Full panels" : `${rc}-row panels`;
                    let sampleIdx = 0;
                    for (let c = 0; c < columnRows.length; c++) {
                      if (columnRows[c] === rc) break;
                      sampleIdx += columnRows[c];
                    }
                    const currentAs = sign.panels[sampleIdx]?.arrowSize ?? sign.arrowSize;
                    return (
                      <div key={rc} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1 }}>{label}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="range" min={8} max={72} value={currentAs} onChange={(e) => {
                            const as = parseInt(e.target.value);
                            let idx = 0;
                            const newPanels = [...sign.panels];
                            for (let c = 0; c < columnRows.length; c++) {
                              for (let r = 0; r < columnRows[c]; r++) {
                                if (columnRows[c] === rc && idx < newPanels.length) {
                                  newPanels[idx] = { ...newPanels[idx], arrowSize: as };
                                }
                                idx++;
                              }
                            }
                            updateSign({ panels: newPanels });
                          }} style={{ flex: 1 }} />
                          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 36 }}>{formatInches(pxToInches(currentAs, sign.ratio))}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>Arrow Weight</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="range" min={100} max={900} step={100} value={sign.arrowWeight || 400} onChange={(e) => updateSign({ arrowWeight: parseInt(e.target.value) })} style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 28 }}>{sign.arrowWeight || 400}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Icon library */}
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>Icon Library</div>
            {customIcons.length > 0 && (
              <span style={{ fontSize: 10, color: iconTitlesSaved ? "#10b981" : "#9ca3af", marginLeft: 4 }}>
                {iconTitlesSaved ? "✓ Saved" : "Saving…"}
              </span>
            )}
            <div style={{ display: "flex", gap: 4 }}>
              {customIcons.length > 0 && (
                <button onClick={() => setIconDeleteMode(!iconDeleteMode)}
                  style={{ background: iconDeleteMode ? "#ef4444" : "#f3f4f6", color: iconDeleteMode ? "#fff" : "#374151", border: "1px solid " + (iconDeleteMode ? "#ef4444" : "#d1d5db"), borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                  {iconDeleteMode ? "Done" : "Delete"}
                </button>
              )}
              <button onClick={() => iconUploadRef.current?.click()}
                style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                + Upload SVG
              </button>
            </div>
            <input ref={iconUploadRef} type="file" accept=".svg" style={{ display: "none" }} onChange={handleGlobalIconUpload} />
          </div>
          <style>{`.icon-lib-thumb svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; display: block; }`}</style>
          {customIcons.length === 0 && (
            <div style={{ color: "#9ca3af", fontSize: 12, padding: "8px 0" }}>No icons uploaded yet</div>
          )}
          {customIcons.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {customIcons.map((ci, i) => {
                const baseName = ci.name.replace(/\.[^.]+$/, "");
                const currentTitle = iconTitleMap[baseName] ?? baseName.replace(/[-_]/g, " ").toUpperCase();
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Thumbnail */}
                    <div
                      onClick={iconDeleteMode ? async () => {
                        await fetch(`/api/icons/${encodeURIComponent(ci.name)}`, { method: "DELETE" });
                        setCustomIcons((prev) => prev.filter((_, j) => j !== i));
                      } : undefined}
                      title={iconDeleteMode ? `Delete ${ci.name}` : ci.name}
                      style={{ width: 36, height: 36, flexShrink: 0, border: "1px solid " + (iconDeleteMode ? "#ef4444" : "#d1d5db"), borderRadius: 6, background: iconDeleteMode ? "#fef2f2" : "#eff6ff", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: iconDeleteMode ? "pointer" : "default", opacity: iconDeleteMode ? 0.8 : 1 }}>
                      <div className="icon-lib-thumb" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: ci.svg }} />
                    </div>
                    {/* Name + Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{baseName}</div>
                      <input
                        value={currentTitle}
                        onChange={(e) => setIconTitleMap((prev) => ({ ...prev, [baseName]: e.target.value }))}
                        placeholder="Title…"
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #d1d5db", borderRadius: 5, fontSize: 12, boxSizing: "border-box", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panels */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Panels ({sign.panels.length})</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => {
              if (customIcons.length === 0) return;
              const arrowDirs = ["left", "right", "up-left", "up-right"];
              const colors = COLOR_PALETTE.map(c => c.color).filter(c => !Object.values(ICON_BG_RULES).includes(c));
              // Shuffle icons so no icon repeats; cycle through if more panels than icons
              const shuffled = [...customIcons].sort(() => Math.random() - 0.5);
              const updatedPanels = sign.panels.map((p, i) => {
                const icon = shuffled[i % shuffled.length];
                const baseName = icon.name.replace(/\.\w+$/, "");
                const text = iconTitleMap[baseName] || baseName.replace(/[-_]/g, " ").toUpperCase();
                const dir = arrowDirs[Math.floor(Math.random() * arrowDirs.length)];
                const bgColor = ICON_BG_RULES[baseName] ?? colors[Math.floor(Math.random() * colors.length)];
                return { ...p, customIcon: icon.svg, text, arrowDir: dir, bgColor };
              });
              updateSign({ panels: updatedPanels });
            }}
              style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
              🎲 Random
            </button>
            <button onClick={addPanel}
              style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
              + Add Panel
            </button>
          </div>
        </div>

        {sign.panels.map((panel, idx) => (
          <PanelEditor
            key={panel.id}
            panel={panel}
            onChange={(updated) => updatePanel(panel.id, updated)}
            onRemove={() => removePanel(panel.id)}
            onDuplicate={() => duplicatePanel(panel.id)}
            onLayoutChange={(mode) => {
              const panelRows = columnRows[getColumnForIndex(columnRows, idx)] || 1;
              const updatedPanels = sign.panels.map((p, pi) => {
                const pRows = columnRows[getColumnForIndex(columnRows, pi)] || 1;
                if (pRows === panelRows) return { ...p, panelLayout: mode };
                return p;
              });
              updateSign({ panels: updatedPanels });
            }}
            customIcons={customIcons}
            iconTitleMap={iconTitleMap}
            fontFamily={sign.fontFamily}
            fontWeight={sign.fontWeight}
            fontStyle={sign.fontStyle}
            allCaps={sign.allCaps}
            arrowSize={sign.arrowSize}
            arrowFontFamily={arrowFontFamily}
            rows={columnRows[getColumnForIndex(columnRows, idx)] || 1}
            iconScale={sign.iconScale}
            panelLayout={sign.panelLayout || "auto"}
            ratio={sign.ratio}
          />
        ))}
      </div>

      {/* ── Right: Preview ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px", borderBottom: "1px solid #e5e7eb", background: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>Preview</span>
            <span style={{ fontSize: 12, color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>
              {(SIGN_RATIOS[sign.ratio] || SIGN_RATIOS["27:5"]).label}
            </span>
            {selectedAspectLabel && (
              <span style={{ fontSize: 12, color: "#1d4ed8", background: "#dbeafe", padding: "2px 8px", borderRadius: 4 }}>
                Clicked: {selectedAspectLabel}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={showHumanFigure} onChange={(e) => setShowHumanFigure(e.target.checked)} />
              Human Scale
            </label>
            <button onClick={handleExportPNG}
              style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
              Export PNG
            </button>
            <button onClick={handleExportSVG}
              style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
              Export SVG
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div onClick={() => setDragIdx(null)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 40, overflow: "auto",
          background: showHumanFigure ? "#fff" : "repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 0 0 / 20px 20px",
        }}>
          {(() => {
            const r = SIGN_RATIOS[sign.ratio] || SIGN_RATIOS["27:5"];
            const previewW = Math.min(800, r.w * 40);
            const previewH = previewW * (r.h / r.w);

            if (!showHumanFigure) {
              // Normal centered preview
              return (
                <div ref={signPreviewRef} style={{
                  width: previewW,
                  height: previewH,
                  border: sign.outerBorder ? `${sign.borderWidth}px solid ${sign.borderColor}` : "none",
                  borderRadius: sign.outerBorder ? 4 : 0,
                  padding: 0,
                  background: "transparent",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  flexShrink: 0,
                  overflow: "hidden",
                  position: "relative",
                }}>
                  <div style={{ display: "flex", flexDirection: "row", gap: sign.gap, width: "100%", height: "100%" }}>
                    {(() => {
                      let panelIdx = 0;
                      return columnRows.map((rowCount, colIdx) => {
                        const colPanels = [];
                        for (let ri = 0; ri < rowCount; ri++) {
                          if (panelIdx < sign.panels.length) {
                            colPanels.push({ panel: sign.panels[panelIdx], flatIdx: panelIdx });
                            panelIdx++;
                          }
                        }
                        return (
                          <div key={colIdx} draggable onDragStart={(e) => { e.stopPropagation(); handleColDragStart(colIdx); }} onDragOver={(e) => { e.stopPropagation(); handleColDragOver(e, colIdx); }} onDragEnd={handleColDragEnd}
                            style={{ flex: 1, display: "flex", flexDirection: "column", gap: sign.gap, minWidth: 0, cursor: "grab", opacity: dragColIdx === colIdx ? 0.5 : 1, transition: "opacity 0.15s", outline: dragColIdx === colIdx ? "2px dashed #3b82f6" : "none", outlineOffset: -2 }}>
                            {colPanels.map(({ panel, flatIdx }) => (
                              <div key={panel.id} draggable onDragStart={(e) => handleDragStart(e, flatIdx)} onDragOver={(e) => handleDragOver(e, flatIdx)} onDragEnd={handleDragEnd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDragIdx(dragIdx === flatIdx ? null : flatIdx);
                                  setSelectedAspectLabel(getPanelAspectLabel(sign, flatIdx));
                                }}
                                style={{ cursor: rowCount > 1 ? "grab" : "default", opacity: dragIdx === flatIdx ? 0.5 : 1, transition: "opacity 0.15s", minWidth: 0, minHeight: 0, overflow: "hidden", display: "flex", flex: 1 }}>
                                <SignPanel panel={panel} isPreview fontFamily={sign.fontFamily} fontWeight={sign.fontWeight} fontStyle={sign.fontStyle} allCaps={sign.allCaps} arrowSize={panel.arrowSize ?? sign.arrowSize} arrowFontFamily={arrowFontFamily} horizontal={(() => { const pl = panel.panelLayout && panel.panelLayout !== "auto" ? panel.panelLayout : (sign.panelLayout || "auto"); return pl === "horizontal" || (pl !== "vertical" && rowCount > 1); })()} iconScale={sign.iconScale} panelPadding={sign.panelPadding} debugSpacing={showDebugSpacing} />
                              </div>
                            ))}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            }

            // Human scale mode — positioned from ground up
            const pxPerFt = previewW / r.w;
            const humanH = 6 * pxPerFt;
            const roofFt = 12;
            const signTopFromGround = roofFt * pxPerFt;
            const totalH = roofFt * pxPerFt;
            const humanW = humanH * 0.28;

            return (
              <div style={{ position: "relative", width: previewW + humanW + 40, height: totalH + 30, flexShrink: 0 }}>
                <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, borderBottom: "1px dashed #9ca3af" }} />
                <div style={{ position: "absolute", bottom: 4, left: humanW + 24, fontSize: 10, color: "#9ca3af" }}>ground</div>
                <div style={{ position: "absolute", bottom: 20 + signTopFromGround, left: humanW + 10, right: 0, borderBottom: "1px dashed #d1d5db" }} />
                <div style={{ position: "absolute", bottom: 20 + signTopFromGround + 4, right: 0, fontSize: 10, color: "#d1d5db" }}>12&apos; roof</div>
                <div style={{ position: "absolute", bottom: 20, left: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <svg width={humanW} height={humanH} viewBox="0 0 70 250" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.45 }}>
                    <circle cx="35" cy="22" r="18" fill="#6b7280"/>
                    <rect x="30" y="40" width="10" height="8" fill="#6b7280"/>
                    <path d="M15 48 L55 48 L52 140 L18 140 Z" fill="#6b7280"/>
                    <path d="M15 48 L2 110 L10 112 L20 55" fill="#6b7280"/>
                    <path d="M55 48 L68 110 L60 112 L50 55" fill="#6b7280"/>
                    <path d="M18 140 L12 245 L24 245 L30 140" fill="#6b7280"/>
                    <path d="M40 140 L46 245 L58 245 L52 140" fill="#6b7280"/>
                  </svg>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>6&apos;0&quot;</div>
                </div>
                <div style={{ position: "absolute", bottom: 20 + signTopFromGround - previewH, left: humanW + 20 }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginBottom: 4 }}>
                    {r.w}&apos; × {r.h}&apos;
                  </div>
                  <div ref={signPreviewRef} style={{
                    width: previewW,
                    height: previewH,
                    border: sign.outerBorder ? `${sign.borderWidth}px solid ${sign.borderColor}` : "none",
                    borderRadius: sign.outerBorder ? 4 : 0,
                    padding: 0,
                    background: "transparent",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    flexShrink: 0,
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    <div style={{ display: "flex", flexDirection: "row", gap: sign.gap, width: "100%", height: "100%" }}>
                      {(() => {
                        let panelIdx = 0;
                        return columnRows.map((rowCount, colIdx) => {
                          const colPanels = [];
                          for (let ri = 0; ri < rowCount; ri++) {
                            if (panelIdx < sign.panels.length) {
                              colPanels.push({ panel: sign.panels[panelIdx], flatIdx: panelIdx });
                              panelIdx++;
                            }
                          }
                          return (
                            <div key={colIdx} draggable onDragStart={(e) => { e.stopPropagation(); handleColDragStart(colIdx); }} onDragOver={(e) => { e.stopPropagation(); handleColDragOver(e, colIdx); }} onDragEnd={handleColDragEnd}
                              style={{ flex: 1, display: "flex", flexDirection: "column", gap: sign.gap, minWidth: 0, cursor: "grab", opacity: dragColIdx === colIdx ? 0.5 : 1, transition: "opacity 0.15s", outline: dragColIdx === colIdx ? "2px dashed #3b82f6" : "none", outlineOffset: -2 }}>
                              {colPanels.map(({ panel, flatIdx }) => (
                                <div key={panel.id} draggable onDragStart={(e) => handleDragStart(e, flatIdx)} onDragOver={(e) => handleDragOver(e, flatIdx)} onDragEnd={handleDragEnd}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDragIdx(dragIdx === flatIdx ? null : flatIdx);
                                    setSelectedAspectLabel(getPanelAspectLabel(sign, flatIdx));
                                  }}
                                  style={{ cursor: rowCount > 1 ? "grab" : "default", opacity: dragIdx === flatIdx ? 0.5 : 1, transition: "opacity 0.15s", minWidth: 0, minHeight: 0, overflow: "hidden", display: "flex", flex: 1 }}>
                                  <SignPanel panel={panel} isPreview fontFamily={sign.fontFamily} fontWeight={sign.fontWeight} fontStyle={sign.fontStyle} allCaps={sign.allCaps} arrowSize={panel.arrowSize ?? sign.arrowSize} arrowFontFamily={arrowFontFamily} horizontal={(() => { const pl = panel.panelLayout && panel.panelLayout !== "auto" ? panel.panelLayout : (sign.panelLayout || "auto"); return pl === "horizontal" || (pl !== "vertical" && rowCount > 1); })()} iconScale={sign.iconScale} panelPadding={sign.panelPadding} debugSpacing={showDebugSpacing} />
                                </div>
                              ))}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Drag hint */}
        <div style={{ textAlign: "center", padding: "8px 0", fontSize: 11, color: "#9ca3af", background: "#fff", borderTop: "1px solid #e5e7eb" }}>
          Drag columns to reorder  •  Upload custom SVG icons in the editor  •  Export to SVG for production
        </div>
      </div>
    </div>
  );
}
