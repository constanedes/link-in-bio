import { profile, links, socials, background } from "./links.js";
import { icon } from "./icons.js";
import { drawBackground } from "./bg.js";

/**
 * Creates an anchor. External http(s) links open in a new tab safely.
 * @param {{ url: string, label: string }} item
 * @param {string} className
 * @returns {HTMLAnchorElement}
 */
function anchor({ url, label }, className) {
  const a = document.createElement("a");
  a.href = url;
  a.className = className;
  a.textContent = label;
  if (/^https?:/.test(url)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
  return a;
}

// ----- Background (URL parameters ?bg= and ?grid= override links.js, handy for previews) -----
const params = new URLSearchParams(location.search);
drawBackground({
  style: params.get("bg") ?? background.style,
  grid: params.get("grid") ?? background.grid,
  accent: background.accent,
  accent2: background.accent2,
});

// ----- Profile -----
// Avatar: show the photo if the file exists, otherwise keep the initials (no broken image)
const avatar = /** @type {HTMLElement} */ (document.getElementById("avatar"));
avatar.textContent = profile.initials;
if (profile.avatar) {
  const img = new Image();
  img.alt = "";
  img.width = img.height = 128;
  img.decoding = "async";
  img.onload = () => avatar.replaceChildren(img);
  img.src = profile.avatar;
}
/** @type {HTMLElement} */ (document.getElementById("name")).textContent = profile.name;
/** @type {HTMLElement} */ (document.getElementById("role")).textContent = profile.role;
/** @type {HTMLElement} */ (document.getElementById("bio")).textContent = profile.bio;

// ----- Main link buttons (the whole button is the link) -----
/** @type {HTMLElement} */ (document.getElementById("links")).append(
  ...links
    .filter((l) => !l.hidden)
    .map((l) => {
      const a = anchor(l, "link");
      if (l.color) a.style.setProperty("--brand", l.color);
      if (l.text) a.style.setProperty("--text", l.text);
      a.append(iconTile(l.icon));
      return a;
    })
);

// ----- Social icon row -----
/** @type {HTMLElement} */ (document.getElementById("socials")).append(
  ...socials
    .filter((s) => !s.hidden)
    .map((s) => {
      const a = anchor(s, "tile");
      a.setAttribute("aria-label", s.label);
      a.innerHTML = icon(s.icon, 22);
      return a;
    })
);

/**
 * Icon square inside a link button, aria-hidden because the label already describes it.
 * @param {string} name
 * @returns {HTMLSpanElement}
 */
function iconTile(name) {
  const span = document.createElement("span");
  span.className = "tile";
  span.innerHTML = icon(name);
  span.setAttribute("aria-hidden", "true");
  return span;
}

// ----- Theme toggle: a small web component -----
// Default follows the system setting; clicking saves a manual choice.
class ThemeToggle extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<button type="button" class="tile"></button>`;
    this.button = /** @type {HTMLButtonElement} */ (this.querySelector("button"));
    this.button.addEventListener("click", () => this.toggle());
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this.render());
    this.render();
  }
  get isDark() {
    const saved = document.documentElement.dataset.theme;
    return saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }
  toggle() {
    const next = this.isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    this.render();
  }
  render() {
    if (!this.button) return;
    this.button.innerHTML = icon(this.isDark ? "sun" : "moon");
    this.button.setAttribute("aria-label", this.isDark ? "Switch to light theme" : "Switch to dark theme");
  }
}
customElements.define("theme-toggle", ThemeToggle);
