# The Tairāwhiti Notebook

A personal advisory site built as a public intelligence system rather than a
consultancy website. Every piece of content is a node — thoughts connect to
themes, frameworks, and advisory offers — and visitors navigate ideas rather
than pages.

**Live experience**

- **Homepage** — hero + a two-column layout: latest thoughts stream beside an
  interactive knowledge graph (collapses to a single column on mobile).
- **Notebook / thoughts** — short reads, each linked to its themes, frameworks,
  and offers.
- **Themes** — the recurring threads, with counts and cross-links.
- **Frameworks** — thinking turned into reusable tools (problem, overview,
  visual framework, related thoughts and offers).
- **Work Together** — organised around problems, not a service catalogue.
- **About** — how the work is approached.
- **Search** — full-text across thoughts, themes, frameworks, and offers
  (`⌘K` / `Ctrl+K`, or `/`).

## Architecture

This is a **zero-build static site** — plain `index.html` + ES modules,
deployable directly to GitHub Pages (matching the existing repo setup, with no
bundler or CI build step). React, React Flow, lucide icons, and `htm` are loaded
at runtime from [esm.sh](https://esm.sh); `htm` gives JSX-like syntax that runs
natively in the browser.

| File | Purpose |
| --- | --- |
| `index.html` | Document shell + font/CDN preconnects |
| `src/main.js` | Mounts the React app |
| `src/h.js` | Binds `htm` to `React.createElement`; re-exports hooks |
| `src/data.js` | The content graph (thoughts, themes, frameworks, offers) and graph derivation — single source of truth |
| `src/graph.js` | The React Flow knowledge graph |
| `src/App.js` | Router, pages, and search |
| `src/styles.css` | Editorial, minimal styling |

`src/InvestmentApp.js` is the previous Codex investment tool, preserved but no
longer wired into the entry point.

## Relationship to the product spec

The MVP spec calls for Next.js 15 + TypeScript + Tailwind + shadcn/ui + Sanity +
Pagefind. This implementation delivers the full **experience and success
criteria** of that spec on the repo's existing static GitHub Pages pipeline:

- **Content model** mirrors the planned Sanity schema (Thought, Theme,
  Framework, Offer) in `src/data.js`. Swapping in the Sanity client later is a
  data-source change, not a rewrite — the component layer reads the same shapes.
- **Knowledge graph** uses React Flow exactly as specified.
- **Search** is implemented as a client-side index (the Pagefind role) so it
  works without a build step.

To migrate to the full stack, port `src/data.js` to Sanity queries and the page
components to Next.js routes; the relationships and UX are already designed
around that model.

## Editing content

All content lives in `src/data.js`. Add a thought by appending to `THOUGHTS`
with its `themes`, `frameworks`, and `offers` ids — the knowledge graph,
cross-links, theme counts, and search all update automatically.
