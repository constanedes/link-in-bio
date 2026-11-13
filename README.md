# link-in-bio

Plain **HTML + CSS + JavaScript** — no framework, no build step.

A link-in-bio page: profile card, link buttons, social icons, dark/light theme and a configurable animated background.

## Run locally (with live reload)

```sh
python3 tools/dev.py          # http://localhost:8080
# optional type-checking: npm install && npm run check
```

## Deploy

Any static hosting works (GitHub Pages, Netlify, Vercel, nginx…). Serve the repo root — `index.html` is the entry point, and `404.html` is already wired for the not-found page.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` / `404.html` | Markup; the JS fills name, bio and lists |
| `style.css` | All styles; design tokens at the top control the whole look |
| `links.js` | **Your content**: profile, links, socials, background (fully JSDoc-typed) |
| `main.js` | Renders profile/links/socials + the `<theme-toggle>` web component |
| `bg.js` | Background styles: `glow`, `grid`, `dots`, `none` |
| `icons.js` | Inline SVG icon set (no extra requests) |
| `tools/dev.py` | Stdlib-only dev server with live reload |

## Customize

Edit `links.js` — everything else reacts to it. Brand colors (`accent`/`accent2`), background style (`?bg=` / `?grid=` URL params for quick previews) and per-link colors are all defined there. Replace the placeholder assets in `assets/` (avatar, CV, OG image) with your own.

## Theme

Follows the visitor's system preference; the toggle stores a manual override in `localStorage`. Colors use `light-dark()` so a single token works in both themes.
