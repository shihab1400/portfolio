# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal portfolio built with Astro 7, TypeScript (strict) and hand-written CSS (no framework). Design reference images live in `FigmaDesigns/` (e.g. `FigmaDesigns/Home.png`). README.md is the detailed user-facing guide; this file is the short version.

## Commands

```bash
npm run dev        # dev server at http://localhost:4321 (includes /api/contact)
npm run build      # production build into .vercel/output
npm run check      # astro check: type-checks .astro and .ts files
npm test           # Playwright, all 5 projects (chromium, firefox, webkit, mobile-chrome, mobile-safari)

npx playwright test --project=chromium                 # one browser
npx playwright test tests/projects.spec.ts             # one spec file
npx playwright test -g "filter" --project=chromium     # tests matching a title
npx playwright install chromium firefox webkit         # first-time browser install
```

- `npm run preview` does **not** work with the Vercel adapter; use `npm run dev`.
- Playwright starts its own `astro dev` on port **4329** with blank `SMTP_USER`/`SMTP_PASS` (so the contact endpoint returns 503 and never sends real email). Astro allows one dev server per project, so stop any running `npm run dev` before testing.
- Node >= 22.23.4 is required.

## Architecture

- **Rendering model:** `output: 'static'` + `@astrojs/vercel`. Every route is prerendered except `src/pages/api/contact.ts` (`prerender = false`), which becomes a Node serverless function. Keep new pages static unless they genuinely need a server.
- **Content vs. data:**
  - Projects are a content collection in `src/content/projects/` — one `<slug>.md` plus its images side by side; the filename is the URL slug. The Zod schema in `src/content.config.ts` validates frontmatter at build time (bad image paths/URLs fail the build).
  - All other editable site content (name, hero, about text, skills, social links, nav) is plain TS in `src/data/*.ts`. Components read from there rather than hardcoding copy.
- **Project queries:** always go through `src/lib/projects.ts` (`getPublishedProjects`, `getFeaturedProjects`, `getRelatedProjects`). It filters out `published: false` and sorts newest-first; drafts therefore get no page, no listing and no sitemap entry. The homepage shows 3 featured projects, topped up with recent non-featured ones.
- **Layouts/SEO:** pages render inside `src/layouts/BaseLayout.astro` (head, inline theme-init script, nav, footer) and pass `title`/`description`; `src/components/SEO.astro` emits meta/OG/canonical tags and `src/lib/structured-data.ts` builds JSON-LD. `StatusLayout` is used for 404 and `/contact/sent|error` pages, which are `noindex` and excluded from the sitemap via the filter in `astro.config.mjs`.
- **Theming:** color tokens are CSS custom properties per theme in `src/styles/themes.css`. The theme choice is stored in `localStorage['theme']` and applied by an inline script in BaseLayout before first paint (tests assert there is no flash). Default/system-preference behavior is configured in `site.theme` in `src/data/site.ts`.
- **Icons:** SVG icon set in `src/lib/icons.ts`, rendered by `Icon.astro`; add new social/icon names there.
- **Contact flow:** `ContactForm.astro` validates client-side and POSTs JSON (falls back to a native form post redirecting to `/contact/sent/` or `/contact/error/` without JS). The endpoint re-validates with the same rules from `src/lib/contact.ts`, enforces a 16 KB body limit, honeypot, and in-memory per-IP rate limit (`src/lib/rate-limit.ts`, 5 per 10 min), then sends through Gmail SMTP via Nodemailer (`src/lib/mailer.ts`, email body built in `src/lib/email.ts`). Status codes: 400/405/413/415/422/429/502/503 (a tripped honeypot gets a fake 200). Logs must only include the SMTP error code, never credentials or message contents.
- **Env vars:** declared via `astro:env` in `astro.config.mjs` as server-only secrets (`SMTP_USER`, `SMTP_PASS`, `CONTACT_TO`); import them from `astro:env/server`. `SITE_URL` (read via `process.env` in the config) sets the canonical origin, defaulting to `http://localhost:4321`.

## Tests

Playwright specs in `tests/` (shared helpers in `tests/helpers.ts`) cover navigation, the projects list/filter/pages, theme persistence, responsive overflow from 320–1920px, and the contact form (browser tests mock the endpoint; server tests hit it directly). Tests assert exactly three featured projects on the homepage, so adding/removing projects or changing `featured` can affect them.
