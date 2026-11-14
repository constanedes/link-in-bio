# link-in-bio

Plain **HTML + CSS + JavaScript** — no framework, no build step.

A link-in-bio page: profile card, link buttons, social icons, dark/light theme and a configurable animated background.

## Run locally (with live reload)

```sh
python3 tools/dev.py          # http://localhost:8080
# optional type-checking: npm install && npm run check
```

## Edit content (GitHub web UI)

All editable content lives in `public/data/site.json` (profile, links, socials, background).

- Open `public/data/site.json` on GitHub, hit the ✏️ **Edit** button and commit — every push redeploys automatically (Cloudflare Pages).
- Each link/social has an explicit `visible: true/false`; the avatar has its own `alt` text (`profile.avatarAlt`).
- Made a mistake? Revert the commit from GitHub's file history — no CMS, no OAuth setup needed.

## Quality checks

```sh
npm run lint      # Biome lints JS, CSS and JSON
npm run format    # Biome formats everything
npm run check     # tsc type-checks the JSDoc annotations
```

## Deploy

Any static hosting works (GitHub Pages, Netlify, Vercel, nginx…). Serve the `public/` directory — `index.html` is the entry point, and `404.html` is already wired for the not-found page.

## Structure

| File                        | Purpose                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `public/index.html`         | Markup; the JS fills name, bio and lists                                                       |
| `public/404.html`           | Not-found page                                                                                 |
| `public/style.css`          | All styles; design tokens at the top control the whole look                                    |
| `public/data/site.json`     | **Your content**: profile, links, socials, background — editable from GitHub's web UI           |
| `public/main.js`            | Renders profile/links/socials + the `<theme-toggle>` web component                             |
| `public/bg.js`              | Background styles: `glow`, `grid`, `dots`, `none`                                              |
| `public/icons.js`           | Inline SVG icon set (no extra requests)                                                        |
| `tools/dev.py`              | Stdlib-only dev server with live reload (serves `public/`)                                     |
| `tools/vcf.mjs`             | Generates the vCard from `public/data/site.json` (build artifact)                              |

## Customize

Edit `public/data/site.json` — everything else reacts to it. Brand colors (`accent`/`accent2`), background style (`?bg=` / `?grid=` URL params for quick previews) and per-link colors are all defined there. Replace the placeholder assets in `public/assets/` (avatar, CV, OG image) with your own.

## Deploy (Cloudflare Workers)

- **Build command**: `npm run build` (generates the vCard into `public/assets/`)
- **Deploy command**: `npx wrangler deploy` — serves `public/` straight up (`assets.directory` in `wrangler.jsonc`)
- `public/` contains only what should be public: pages, JS/CSS, `data/`, `assets/` and `fonts`. Dev tooling, configs and README stay in the repo root and are never uploaded.
- `404.html` is served automatically for missing URLs (`not_found_handling: 404-page`).
- **Custom domain**: `hi.constantinoedes.dev`.

## Theme

Follows the visitor's system preference; the toggle stores a manual override in `localStorage`. Colors use `light-dark()` so a single token works in both themes.
