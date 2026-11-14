import { drawBackground } from "./bg.js";
import { icon } from "./icons.js";

/** @typedef {{ label: string, url: string, icon: string, color?: string, text?: string, download?: boolean, visible?: boolean, copy?: boolean }} Link */

/** @typedef {{ label: string, url: string, icon: string, visible?: boolean }} Social */

/** @typedef {{ initials: string, avatar: string, avatarAlt: string, name: string, role: string, bio: string, available?: boolean, availableLabel?: string }} Profile */

/**
 * Page background configuration.
 * - `style`: "glow" (two soft lights), "grid" (retrowave perspective lines), "dots" or "none" (plain gradient).
 * - `grid`: only for style "grid": "floor" (ground only) or "both" (floor + ceiling).
 * - `accent` / `accent2`: the two brand colors (glow lights, avatar ring, text selection). Keep them calm.
 * Tip: preview without editing by opening the page with ?bg=dots or ?bg=grid&grid=both
 * @typedef {{ style: "glow" | "grid" | "dots" | "none", grid: "floor" | "both", accent: string, accent2: string }} Background
 */

/** @typedef {{ profile: Profile, links: Link[], socials: Social[], background: Background, highlight?: { text: string, url: string, visible?: boolean } }} SiteData */

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
  if (/^https?:/.test(url)) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return a;
}

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

/**
 * Email button split in two: the label opens the mail client, the trailing
 * button copies the address to the clipboard. Copy feedback swaps the icon
 * for a check and announces itself to screen readers.
 * @param {Link} link
 * @returns {HTMLDivElement}
 */
function splitEmail(link) {
  const wrap = document.createElement("div");
  wrap.className = "link split";
  if (link.color) wrap.style.setProperty("--brand", link.color);
  if (link.text) wrap.style.setProperty("--text", link.text);

  const open = anchor(link, "split-main");
  open.append(iconTile(link.icon));

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "tile copy-btn";
  copyBtn.setAttribute("aria-label", `Copy ${link.label} address`);
  copyBtn.innerHTML = icon("copy");
  const address = link.url.replace(/^mailto:/, "");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(address);
      copyBtn.innerHTML = icon("check");
      copyBtn.classList.add("copied");
      copyBtn.setAttribute("aria-label", "Copied");
      toast("Email copied to clipboard");
      setTimeout(() => {
        copyBtn.innerHTML = icon("copy");
        copyBtn.classList.remove("copied");
        copyBtn.setAttribute("aria-label", `Copy ${link.label} address`);
      }, 2000);
    } catch {
      toast("Couldn't copy — clipboard blocked", "error");
    }
  });

  wrap.append(open, copyBtn);
  return wrap;
}

/**
 * "Open to work" badge: pulsing green dot, label, and a "?" that reveals
 * the same explanation on hover, focus (keyboard) and tap.
 * @param {Profile} profile
 * @returns {HTMLElement | null}
 */
function availableBadge(profile) {
  if (!profile.available) return null;
  const badge = document.createElement("p");
  badge.className = "available";
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "available-label";
  label.tabIndex = 0;
  label.textContent = profile.availableLabel || "Open to work";
  label.setAttribute("role", "note");
  label.setAttribute("aria-label", `${label.textContent}: open to new opportunities and projects`);
  badge.append(dot, label);
  return badge;
}

let toastTimer = 0;
/**
 * Single-slot toast: every message replaces the previous one and resets its
 * timeout, so rapid clicks never stack or race. Screen-reader friendly via
 * the aria-live container in the markup.
 * @param {string} message
 * @param {"ok" | "error"} [kind]
 * @returns {void}
 */
function toast(message, kind = "ok") {
  const el = byId("toast");
  clearTimeout(toastTimer);
  el.className = kind;
  el.textContent = message;
  el.hidden = false;
  toastTimer = /** @type {number} */ (
    setTimeout(() => {
      el.hidden = true;
    }, 2200)
  );
}

/**
 * Element by id; the markup guarantees it exists.
 * @param {string} id
 * @returns {HTMLElement}
 */
function byId(id) {
  return /** @type {HTMLElement} */ (document.getElementById(id));
}

/** Fetches the editable site content. @returns {Promise<SiteData>} */
async function loadSite() {
  const res = await fetch("data/site.json");
  if (!res.ok) throw new Error(`data/site.json: ${res.status}`);
  return /** @type {SiteData} */ (await res.json());
}

/**
 * Renders profile, background, links and socials from the site data.
 * @param {SiteData} site
 * @returns {void}
 */
function render(site) {
  const { profile, links, socials, background } = site;

  // ----- Background (URL parameters ?bg= and ?grid= override the JSON, handy for previews) -----
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
    img.alt = profile.avatarAlt || ""; // empty alt = decorative image (still accessible)
    img.width = img.height = 128;
    img.decoding = "async";
    img.onload = () => avatar.replaceChildren(img);
    img.src = profile.avatar;
  }
  byId("name").textContent = profile.name;
  byId("role").textContent = profile.role;
  byId("bio").textContent = profile.bio;

  // ----- "Open to work" badge (hidden in the markup until the JSON enables it) -----
  const badge = availableBadge(profile);
  if (badge) {
    const slot = byId("available-slot");
    slot.hidden = false;
    slot.replaceChildren(badge);
  }

  // ----- Highlight: a plain, clickable "latest news" line under the bio -----
  const highlightSlot = byId("highlight-slot");
  const hl = site.highlight;
  if (hl && hl.visible !== false && hl.text && hl.url) {
    const a = anchor({ url: hl.url, label: hl.text }, "highlight");
    a.textContent = hl.text;
    a.innerHTML = `<span class="star" aria-hidden="true">✦</span> ${a.textContent}`;
    highlightSlot.hidden = false;
    highlightSlot.replaceChildren(a);
  }

  // ----- Main link buttons (the whole button is the link; email can be split) -----
  byId("links").append(
    ...links
      .filter((l) => l.visible !== false)
      .map((l) => {
        if (l.copy) return splitEmail(l);
        const a = anchor(l, "link");
        if (l.download) a.setAttribute("download", "");
        else if (/^https?:/.test(l.url)) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        if (l.color) a.style.setProperty("--brand", l.color);
        if (l.text) a.style.setProperty("--text", l.text);
        a.append(iconTile(l.icon));
        return a;
      }),
  );

  // ----- Social icon row -----
  byId("socials").append(
    ...socials
      .filter((s) => s.visible !== false)
      .map((s) => {
        const a = anchor(s, "tile");
        a.setAttribute("aria-label", s.label);
        a.innerHTML = icon(s.icon, 22);
        return a;
      }),
  );
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
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: keep theme in memory only */
    }
    this.render();
  }
  render() {
    if (!this.button) return;
    this.button.innerHTML = icon(this.isDark ? "sun" : "moon");
    this.button.setAttribute("aria-label", this.isDark ? "Switch to light theme" : "Switch to dark theme");
  }
}
customElements.define("theme-toggle", ThemeToggle);

// ----- Entry point: render when the content arrives, then reveal the card -----
loadSite()
  .then((site) => {
    render(site);
    // Hydration done: reveal the card in its final position (see style.css)
    document.querySelector("main")?.classList.add("ready");
  })
  .catch((err) => {
    console.error("[links] failed to load content:", err);
    // Reveal the empty card anyway so the page is never stuck invisible
    /** @type {HTMLElement} */
    document.querySelector("main")?.classList.add("ready");
  });
