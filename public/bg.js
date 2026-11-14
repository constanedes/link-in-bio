// Page background. Everything is CSS or one inline SVG: no images, no extra requests.
// Colors come from the CSS tokens, so every style follows the light/dark theme.

/** @typedef {"grid" | "dots" | "glow" | "none"} BackgroundStyle */
/** @typedef {"floor" | "both"} GridMode */

/** @typedef {{ style?: string | null, grid?: string | null, accent?: string, accent2?: string }} BackgroundOptions */

const STYLES = ["grid", "dots", "glow", "none"];

/**
 * @param {BackgroundOptions & { style?: string | null, grid?: string | null }} options
 * @returns {void}
 */
export function drawBackground({ style, grid, accent, accent2 }) {
  const bg = document.getElementById("bg");
  if (!bg) return;
  bg.innerHTML = "";
  bg.removeAttribute("data-grid");
  bg.dataset.style = /** @type {BackgroundStyle} */ (STYLES.includes(style ?? "") ? style : "grid");
  // Brand colors are page-wide tokens (also used by the avatar ring and text selection)
  const root = document.documentElement;
  if (accent) root.style.setProperty("--accent", accent);
  if (accent2) root.style.setProperty("--accent-2", accent2);
  // "dots", "glow" and "none" are pure CSS (see style.css); only "grid" needs drawing
  if (bg.dataset.style === "grid") drawGrid(bg, grid);
}

/**
 * Retrowave-style perspective grid, drawn as a single SVG path.
 * @param {HTMLElement} bg
 * @param {string | null | undefined} mode
 * @returns {void}
 */
function drawGrid(bg, mode) {
  const gridMode = mode === "floor" || mode === "both" ? mode : "floor";
  bg.dataset.grid = gridMode;

  const both = gridMode === "both";
  const h = both ? 0.42 : 0.28; // horizon height: 0 = top of screen, 1 = bottom
  const vx = 0.72; // vanishing point, horizontal position (0.5 = centered)
  bg.style.setProperty("--h", `${h * 100}%`);

  /** @param {number} v fraction -> viewBox unit (0-100) */
  const n = (v) => +(v * 100).toFixed(2);
  let d = "";

  // Lines that run toward the horizon, all meeting at the vanishing point
  for (let k = -14; k <= 14; k++) {
    const xBottom = vx + k * 0.09;
    d += `M${n(vx)} ${n(h)}L${n(xBottom)} 100`;
    if (both) {
      // Same line mirrored onto the ceiling
      const xTop = vx + (xBottom - vx) * (h / (1 - h));
      d += `M${n(vx)} ${n(h)}L${n(xTop)} 0`;
    }
  }

  // Lines across: spacing shrinks geometrically toward the horizon
  for (let j = 0; j < 12; j++) {
    const y = h + (1 - h) * 0.7 ** (j + 0.3);
    d += `M0 ${n(y)}H100`;
    if (both && 2 * h - y > 0) d += `M0 ${n(2 * h - y)}H100`;
  }

  // preserveAspectRatio="none" stretches the grid to any screen without changing the horizon height
  bg.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}"/></svg>`;
}
