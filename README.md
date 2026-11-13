# link-in-bio

Plain **HTML + CSS + JavaScript** — no framework, no build step.

A link-in-bio page: profile card, link buttons, social icons, dark/light theme and a configurable animated background.

## Run locally (with live reload)

```sh
python3 tools/dev.py          # http://localhost:8080
# optional type-checking: npm install && npm run check
```

## Edit content (GitHub web UI)

All editable content lives in `data/site.json` (profile, links, socials, background).

- Open `data/site.json` on GitHub, hit the ✏️ **Edit** button and commit — every push redeploys automatically (Cloudflare Pages).
- Each link/social has an explicit `visible: true/false`; the avatar has its own `alt` text (`profile.avatarAlt`).
- Made a mistake? Revert the commit from GitHub's file history — no CMS, no OAuth setup needed.

## Quality checks

```sh
npm run lint      # Biome lints JS, CSS and JSON
npm run format    # Biome formats everything
npm run check     # tsc type-checks the JSDoc annotations
```

## Deploy

Any static hosting works (GitHub Pages, Netlify, Vercel, nginx…). Serve the repo root — `index.html` is the entry point, and `404.html` is already wired for the not-found page.

## Structure

| File                      | Purpose                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `index.html` / `404.html` | Markup; the JS fills name, bio and lists                                              |
| `style.css`               | All styles; design tokens at the top control the whole look                           |
| `data/site.json`          | **Your content**: profile, links, socials, background — editable from GitHub's web UI |
| `main.js`                 | Renders profile/links/socials + the `<theme-toggle>` web component                    |
| `bg.js`                   | Background styles: `glow`, `grid`, `dots`, `none`                                     |
| `icons.js`                | Inline SVG icon set (no extra requests)                                               |
| `tools/dev.py`            | Stdlib-only dev server with live reload                                               |

## Customize

Edit `data/site.json` — everything else reacts to it. Brand colors (`accent`/`accent2`), background style (`?bg=` / `?grid=` URL params for quick previews) and per-link colors are all defined there. Replace the placeholder assets in `assets/` (avatar, CV, OG image) with your own.

## Deploy (Cloudflare Pages)

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- `dist/` contains only what should be public: pages, JS/CSS, `data/`, `assets/` and `fonts/`. Dev tooling, configs and README stay out.
- `404.html` is served automatically for missing URLs.
- **Custom domain**: `hi.constantinoedes.dev` — since the zone lives in the same Cloudflare account, add it in Pages → _Custom domains_ and Cloudflare creates the records/SSL automatically.

## Theme

Follows the visitor's system preference; the toggle stores a manual override in `localStorage`. Colors use `light-dark()` so a single token works in both themes.
