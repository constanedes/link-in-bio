/**
 * ALL editable content lives here. Edit text, URLs and colors, or set `hidden: true` to hide an item.
 * Replace the reference data below with your real data.
 */

/** @typedef {{ label: string, url: string, icon: string, color?: string, text?: string, download?: boolean, hidden?: boolean }} Link */

/** @typedef {{ label: string, url: string, icon: string, hidden?: boolean }} Social */

/**
 * Page background configuration.
 * - `style`: "glow" (two soft lights), "grid" (retrowave perspective lines), "dots" or "none" (plain gradient).
 * - `grid`: only for style "grid": "floor" (ground only) or "both" (floor + ceiling).
 * - `accent` / `accent2`: the two brand colors (glow lights, avatar ring, text selection). Keep them calm.
 * Tip: preview without editing by opening the page with ?bg=dots or ?bg=grid&grid=both
 * @typedef {{ style: "glow" | "grid" | "dots" | "none", grid: "floor" | "both", accent: string, accent2: string }} Background
 */

/** @typedef {{ initials: string, avatar: string, name: string, role: string, bio: string }} Profile */

/** @type {Profile} */
export const profile = {
  initials: "CE",
  avatar: "assets/avatar.jpg", // your photo (square, ~256px). Leave "" to show the initials.
  name: "Constantino Edes",
  role: "Software Developer",
  bio: "Backend developer focused on .NET, DevOps and data. Find my work, CV and contact below.",
};

// color/text are optional: without them the button uses the neutral theme colors.
// Soft tints keep buttons readable in both themes (dark text on pastel chips).
/** @type {Link[]} */
export const links = [
  { label: "Portfolio", url: "https://constantinoedes.dev",            icon: "globe",  color: "#dbeafe", text: "#1e40af" },
  { label: "CV",        url: "assets/cv.pdf",                           icon: "file",   color: "#ffedd5", text: "#9a3412" },
  { label: "GitHub",    url: "https://github.com/constanedes",          icon: "github",   color: "#e4e4e7", text: "#27272a" },
  { label: "LinkedIn",  url: "https://www.linkedin.com/in/constanedes", icon: "linkedin", color: "#e0f2fe", text: "#075985" },
  { label: "Email",     url: "mailto:hola@constantinoedes.dev",         icon: "mail",     color: "#fee2e2", text: "#991b1b" },
  { label: "Save contact", url: "assets/constantino-edes.vcf",          icon: "user",  download: true, color: "#dcfce7", text: "#166534" },
];

// Small icon-only row at the bottom.
/** @type {Social[]} */
export const socials = [
  { label: "X",       url: "https://x.com/constanedes",        icon: "x" },
  { label: "DEV",     url: "https://dev.to/constanedes",       icon: "devto" },
  { label: "Discord", url: "https://discord.gg/constantino",   icon: "discord" },
];

/** @type {Background} */
export const background = { style: "glow", grid: "floor", accent: "#4f8ef7", accent2: "#ff9d63" };
