import { drawBackground } from "./bg.js";
import { icon } from "./icons.js";

/** @typedef {{ label: string, url: string, icon: string, color?: string, text?: string, download?: boolean, visible?: boolean, copy?: boolean }} Link */

/** @typedef {{ label: string, url: string, icon: string, visible?: boolean }} Social */

/** @typedef {{ initials: string, avatar: string, avatarAlt: string, name: string, role: string, bio: string, phone?: string, org?: string, url?: string, available?: boolean }} Profile */

/**
 * UI copy with JSON overridables ("strings" block in site.json).
 * @type {{ copied: string, sendEmail: string, copyEmail: string, share: string, presence: string }}
 */
const DEFAULT_STRINGS = {
  copied: "Copied!",
  sendEmail: "Send contact email",
  copyEmail: "Copy email address",
  share: "Share site",
  presence: "Open to new opportunities and projects",
};
let STRINGS = DEFAULT_STRINGS;

/**
 * Page background configuration.
 * - `style`: "glow" (two soft lights), "grid" (retrowave perspective lines), "dots" or "none" (plain gradient).
 * - `grid`: only for style "grid": "floor" (ground only) or "both" (floor + ceiling).
 * - `accent` / `accent2`: the two brand colors (glow lights, avatar ring, text selection). Keep them calm.
 * Tip: preview without editing by opening the page with ?bg=dots or ?bg=grid&grid=both
 * @typedef {{ style: "glow" | "grid" | "dots" | "none", grid: "floor" | "both", accent: string, accent2: string }} Background
 */

/** @typedef {{ profile: Profile, links: Link[], socials: Social[], background: Background, theme?: string, strings?: Partial<typeof DEFAULT_STRINGS>, highlight?: { text: string, url: string, visible?: boolean } }} SiteData */

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
  const chevron = iconTile("chevron");
  chevron.classList.add("chev");
  toggle.append(label, chevron);

  const actions = document.createElement("div");
  actions.className = "link-actions";
  actions.id = "email-actions";

  const open = document.createElement("a");
  open.href = link.url;
  open.className = "sub-action";
  open.innerHTML = `${icon("mail", 18)}<span>${STRINGS.sendEmail}</span>`;
  open.setAttribute("aria-label", `${STRINGS.sendEmail} to ${address}`);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "sub-action";
  copyBtn.innerHTML = `${icon("copy", 18)}<span>${STRINGS.copyEmail}</span>`;
  copyBtn.setAttribute("aria-label", `Copy ${address} to clipboard`);
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(address);
      copyBtn.innerHTML = `${icon("check", 18)}<span>${STRINGS.copied}</span>`;
      copyBtn.classList.add("done");
      setTimeout(() => {
        copyBtn.innerHTML = `${icon("copy", 18)}<span>${STRINGS.copyEmail}</span>`;
        copyBtn.classList.remove("done");
      }, 2000);
    } catch {
      /* clipboard blocked (e.g. without HTTPS): keep the button as is */
    }
  });

  actions.append(open, copyBtn);
  toggle.addEventListener("click", () => {
    const openNow = !wrap.classList.contains("expanded");
    wrap.classList.toggle("expanded", openNow);
    toggle.setAttribute("aria-expanded", String(openNow));
  });
  document.addEventListener("click", (e) => {
    if (wrap.classList.contains("expanded") && e.target instanceof Node && !wrap.contains(e.target)) {
      wrap.classList.remove("expanded");
      toggle.setAttribute("aria-expanded", "false");
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
  dot.setAttribute("aria-label", STRINGS.presence);
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
  STRINGS = { ...DEFAULT_STRINGS, ...site.strings };

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
        if (l.download) {
          // Native behavior: mobiles (coarse pointer) open the vCard in
          // Contacts; on desktop force a file download instead of a page view.
          if (!matchMedia("(pointer: coarse)").matches) a.setAttribute("download", "");
        } else if (/^https?:/.test(l.url)) {
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

  // ----- Share: native share sheet on mobile, copy to clipboard on desktop -----
  const shareBtn = /** @type {HTMLButtonElement} */ (byId("share"));
  const shareIcon = /** @type {HTMLElement} */ (shareBtn.querySelector(".share-icon"));
  const shareLabel = /** @type {HTMLElement} */ (shareBtn.querySelector(".share-label"));
  shareIcon.innerHTML = icon("share", 16);
  shareLabel.textContent = STRINGS.share;
  shareBtn.hidden = false;
  shareBtn.addEventListener("click", async () => {
    const url = location.origin + location.pathname;
    /** Confirms the copy: "Copied!" with a green check, then back to normal. */
    const confirm = () => {
      shareBtn.classList.add("done");
      shareIcon.innerHTML = icon("check", 16);
      shareLabel.textContent = STRINGS.copied;
      setTimeout(() => {
        shareBtn.classList.remove("done");
        shareIcon.innerHTML = icon("share", 16);
        shareLabel.textContent = STRINGS.share;
      }, 2000);
    };
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        confirm();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return; // user closed the sheet
      try {
        await navigator.clipboard.writeText(url);
        confirm();
      } catch {
        /* share unavailable and clipboard blocked: stay quiet */
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
    // The JSON can set the initial theme; a visitor's manual choice always wins
    if (site.theme && !document.documentElement.dataset.theme) {
      document.documentElement.dataset.theme = site.theme;
    }
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
