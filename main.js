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
 * Email button that expands into two sub-buttons: open the mail client or
 * copy the address. `expanded` is a CSS class; clicking outside collapses it.
 * @param {Link} link
 * @returns {HTMLDivElement}
 */
function expandableEmail(link) {
  const wrap = document.createElement("div");
  wrap.className = "link expandable";
  if (link.color) wrap.style.setProperty("--brand", link.color);
  if (link.text) wrap.style.setProperty("--text", link.text);

  const address = link.url.replace(/^mailto:/, "");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "link-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "email-actions");

  const label = document.createElement("span");
  label.textContent = link.label;
  toggle.append(iconTile(link.icon), label);

  const actions = document.createElement("div");
  actions.className = "link-actions";
  actions.id = "email-actions";
  actions.hidden = true;

  const open = document.createElement("a");
  open.href = link.url;
  open.className = "sub-action";
  open.innerHTML = `${icon("mail", 18)}<span>Open email client</span>`;
  open.setAttribute("aria-label", `Open email client for ${address}`);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "sub-action";
  copyBtn.innerHTML = `${icon("copy", 18)}<span>Copy email address</span>`;
  copyBtn.setAttribute("aria-label", `Copy ${address} to clipboard`);
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(address);
      copyBtn.innerHTML = `${icon("check", 18)}<span>Copied!</span>`;
      copyBtn.classList.add("done");
      toast("Email copied to clipboard");
      setTimeout(() => {
        copyBtn.innerHTML = `${icon("copy", 18)}<span>Copy email address</span>`;
        copyBtn.classList.remove("done");
      }, 2000);
    } catch {
      toast("Couldn't copy — clipboard blocked", "error");
    }
  });

  actions.append(open, copyBtn);

  toggle.addEventListener("click", () => {
    const openNow = actions.hidden;
    actions.hidden = !openNow;
    toggle.setAttribute("aria-expanded", String(openNow));
    wrap.classList.toggle("expanded", openNow);
  });
  document.addEventListener("click", (e) => {
    if (!actions.hidden && e.target instanceof Node && !wrap.contains(e.target)) {
      actions.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      wrap.classList.remove("expanded");
    }
  });

  wrap.append(toggle, actions);
  return wrap;
}

/**
 * "Open to work" presence: the avatar gets a pulsing green ring (like a
 * social network "online" state) and a corner dot whose tooltip — shown on
 * hover, tap or keyboard focus — explains the status.
 * @param {Profile} profile
 * @returns {void}
 */
function renderPresence(profile) {
  if (!profile.available) return;
  byId("avatar-wrap").classList.add("open");
  const dot = byId("presence");
  dot.hidden = false;
  dot.setAttribute("role", "note");
  dot.setAttribute("aria-label", "Open to new opportunities and projects");
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

  // ----- "Open to work": green ring + corner dot on the avatar -----
  renderPresence(profile);

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
        if (l.copy) return expandableEmail(l);
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

  // ----- Share button: native share sheet on mobile, copy to clipboard on desktop -----
  const shareBtn = byId("share");
  shareBtn.innerHTML = icon("share", 16);
  shareBtn.hidden = false;
  shareBtn.addEventListener("click", async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return; // user closed the sheet
      try {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard");
      } catch {
        toast("Couldn't share or copy", "error");
      }
    }
  });
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
