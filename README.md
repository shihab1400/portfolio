# Portfolio

A personal developer portfolio built with [Astro](https://astro.build), TypeScript and hand-written CSS. It follows the dark, minimalist design in `FigmaDesigns/Home.png`.

- **Pages:** Home (`/`), About (`/about/`), Projects (`/projects/`), and one generated page per project (`/projects/<slug>/`).
- Static HTML for every page. The only server code is the contact endpoint (`/api/contact`), which emails inquiries through Gmail SMTP using [Nodemailer](https://nodemailer.com).
- Dark/light theme saved in `localStorage`, applied before first paint.
- Sticky navbar, a mobile hamburger menu, and a social sidebar that only appears on desktop.
- SEO: per-page titles and descriptions, canonical URLs, Open Graph/Twitter cards, JSON-LD, `sitemap-index.xml` and `robots.txt`.
- Playwright tests for navigation, projects, themes, responsiveness and the contact form in Chromium, Firefox, WebKit and two mobile emulations.

> **Placeholder content.** The name, About text, portraits, project entries (ChertNodes, ProtectX and Kahoot Answers Viewer are sample projects adapted from the design reference) and social profile URLs are placeholders. See [Replacing placeholder content](#replacing-placeholder-content).

---

## Prerequisites

- Node.js **22.23.4+** (required by Astro 7; Vercel currently runs functions on Node 24; Node 24 LTS is recommended locally).
- npm 10+.
- For the contact form: a Gmail account with 2-Step Verification and an App Password (see [Setting up Gmail SMTP](#setting-up-gmail-smtp)).

## Getting started

```bash
npm install
cp .env.example .env        # then fill in values (see "Contact form" below)
npm run dev                 # http://localhost:4321
```

| Script            | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `npm run dev`     | Dev server with hot reload, including the contact endpoint      |
| `npm run build`   | Production build into `.vercel/output` (static files + function) |
| `npm run check`   | Type-checks `.astro` and `.ts` files (`astro check`)             |
| `npm test`        | Runs the Playwright suite (starts its own dev server on :4329)   |
| `npm run preview` | **Not supported by the Vercel adapter.** Use `npm run dev` locally, or a Vercel preview deployment |

The first time you run tests, install the browsers: `npx playwright install chromium firefox webkit`.

---

## Project structure

```text
src/
├── assets/                 Portrait images (optimised to WebP by astro:assets)
├── components/             Navbar, ThemeToggle, SocialSidebar, Hero, Quote, ProjectCard,
│                           ProjectsGrid, Skills, SkillGroups, AboutPreview, ContactSection,
│                           ContactForm, Footer, SEO, SectionHeading, Icon, Logo
├── content/projects/       One Markdown file + thumbnail per project
├── content.config.ts       Project schema (Zod)
├── data/                   Editable site data: site.ts, about.ts, skills.ts,
│                           social-links.ts, navigation.ts
├── layouts/                BaseLayout (head, theme init, nav, footer), StatusLayout
├── lib/                    contact validation, email template, rate limiter,
│                           project queries, structured data, icon set
├── pages/                  Routes, including api/contact.ts, robots.txt.ts and 404.astro
└── styles/                 global.css, themes.css (colour tokens), utilities.css
tests/                      Playwright specs
```

---

## Editing content

### Site details, hero, quote and status

Edit **`src/data/site.ts`**: name, role, default title and description, hero headline (words in `[brackets]` are highlighted purple), the "Currently working on" status (set to `undefined` to hide it), the quote, and the contact intro.

### About Me

Edit **`src/data/about.ts`**. `preview` paragraphs appear on the homepage, and `sections` make up the full `/about/` page. Replace the portraits in `src/assets/portrait-hero.png` and `src/assets/portrait-about.png` with your own photos, using the same filenames or updating the imports. Any JPG/PNG works, and a grayscale filter is applied in CSS to match the design. Update `portraitAlt` text to describe your photo.

### Skills

Edit **`src/data/skills.ts`**. Add, remove or rename groups freely. The layout adapts to any number of groups.

### Social links

Edit **`src/data/social-links.ts`**. Replace `YOUR_USERNAME` in each URL, or remove platforms you don't use. Icons available out of the box: `github`, `dribbble`, `figma` (see `src/lib/icons.ts` to add more). URLs that still contain `YOUR_USERNAME` are left out of JSON-LD `sameAs`, so search engines never treat them as real profiles.

### Projects

Each project is a Markdown file in **`src/content/projects/`**. The filename is the URL slug (`protectx.md` becomes `/projects/protectx/`). Put the thumbnail next to it:

```markdown
---
title: My Project
description: One or two sentences for cards and the meta description (max 180 chars).
thumbnail: ./my-project.png
thumbnailAlt: What the screenshot shows
heroImage: ./my-project-wide.png      # optional, defaults to the thumbnail
heroImageAlt: ...                      # optional
technologies: [Astro, TypeScript]
category: Website                      # used by the filter on /projects/
featured: true                         # featured projects appear on the homepage (max 3)
published: true                        # false = no page, not listed, not in the sitemap
publishDate: 2026-10-01
liveUrl: https://example.com           # optional: button is hidden when missing
repositoryUrl: https://github.com/...  # optional: button is hidden when missing
purpose: Why the project exists.       # optional
features:                              # optional
  - Feature one
challenge: ...                         # optional
solution: ...                          # optional
results: ...                           # optional
---

Full description and implementation notes in Markdown.
```

The schema in `src/content.config.ts` validates every field at build time, so a missing image or malformed URL fails the build instead of shipping. The homepage shows the three newest `featured` projects. If fewer than three are featured, it fills the remaining slots with the newest other projects.

### Social sharing image and icons

`public/og-default.png` (1200×630) is the default Open Graph image. Project pages automatically use their thumbnail. Replace `public/favicon.svg` and `public/apple-touch-icon.png` to change the icons.

---

## Theme (dark/light)

- Colours are CSS custom properties in **`src/styles/themes.css`**, one block per theme. Change a token there and it updates everywhere.
- `site.theme` in `src/data/site.ts` controls behaviour:
  - `default`: theme for first-time visitors (`'dark'`, matching the design).
  - `respectSystemPreference`: set to `true` to follow the visitor's OS light/dark setting until they pick a theme.
  - `colors`: browser UI colour (`<meta name="theme-color">`) for each theme.
- The visitor's choice is stored in `localStorage` under `theme`. A tiny inline script in `BaseLayout.astro` applies it before the page renders, so there is no flash. Without JavaScript the site shows the dark theme and the toggle is hidden.

---

## Contact form and email delivery

The form posts to `src/pages/api/contact.ts`, an on-demand (server-rendered) endpoint. All other routes are prerendered. Email is sent through **Gmail SMTP** with [Nodemailer](https://nodemailer.com) (`src/lib/mailer.ts`: `smtp.gmail.com`, port 465, TLS).

**Flow:** client-side validation, then a `fetch` POST (JSON), then server-side validation with the same rules (`src/lib/contact.ts`), then Gmail SMTP. The visitor only sees "sent" after Gmail accepts the message. Without JavaScript the form still submits natively and redirects to `/contact/sent/` or `/contact/error/`.

**Email details:**

- `From`: `Portfolio Contact <SMTP_USER>`. The visitor's address is never used as the sender.
- `To`: `CONTACT_TO` (defaults to `shihabcoc39@gmail.com`).
- `Reply-To`: the visitor's validated email, so hitting Reply in Gmail answers them directly.
- The body lists name, company ("Not provided" if blank), email and message, as plain text plus an HTML version.
- Visitor input is HTML-escaped in the email body. Newlines are stripped from single-line fields, and addresses are passed to Nodemailer as structured objects, which prevents header injection.

**Abuse protection:** server-side validation, a 16 KB body limit, a hidden honeypot field, a per-IP rate limit (5 submissions per 10 minutes), and Astro's built-in origin check for form posts. Unsupported methods get `405`, unsupported content types `415`, invalid input `422` with per-field errors, and send failures `502`. Logs record only the SMTP error code (e.g. `EAUTH`), never credentials, message contents or addresses.

> The rate limiter is in-memory, so on serverless platforms it is per warm instance (best-effort). For stronger protection, add a rate-limit rule for `/api/contact` in [Vercel Firewall](https://vercel.com/docs/vercel-firewall).

> **Gmail limits:** a personal Gmail account can send roughly 500 messages a day over SMTP, which is plenty for a portfolio. Gmail always sends from the authenticated account, so `SMTP_USER` is the sender shown in the inbox.

### Setting up Gmail SMTP

1. **Turn on 2-Step Verification** for the Gmail account you'll send from: <https://myaccount.google.com/security> → *How you sign in to Google* → *2-Step Verification*. App Passwords are only available once 2-Step Verification is on.
2. **Create an App Password:** go to <https://myaccount.google.com/apppasswords>, enter a name such as `Portfolio contact form`, and click *Create*. Google shows a 16-character password once. Copy it (the spaces don't matter).
   - If the page says App Passwords aren't available, the account is probably a work/school account whose admin disabled them, or it uses only security keys (Advanced Protection). Use a personal Gmail account instead.
3. **Configure `.env` locally:**

   ```bash
   cp .env.example .env
   ```

   ```env
   SMTP_USER=yourgmail@gmail.com
   SMTP_PASS=your_gmail_app_password
   CONTACT_TO=shihabcoc39@gmail.com
   ```

   `.env` is git-ignored. Never commit it or paste the App Password anywhere else. If the password ever leaks, revoke it on the App Passwords page and create a new one.
4. **Test locally:** run `npm run dev`, open <http://localhost:4321/#contacts>, submit the form, and check that the email arrives at `CONTACT_TO`. Click *Reply* and confirm it's addressed to the email you entered in the form. If something fails, the terminal shows `[contact] Gmail SMTP send failed (CODE)`. See [Troubleshooting](#troubleshooting).

### Environment variables

| Variable     | Required | Description |
| ------------ | -------- | ----------- |
| `SITE_URL`   | Yes (production) | Public origin, e.g. `https://yourname.dev`. Used for canonical URLs, Open Graph, sitemap and robots.txt. Defaults to `http://localhost:4321`. |
| `SMTP_USER`  | Yes, for email | Gmail address that sends the contact emails. |
| `SMTP_PASS`  | Yes, for email | Gmail **App Password** for `SMTP_USER`, not the normal account password. |
| `CONTACT_TO` | No | Recipient of contact submissions. Defaults to `shihabcoc39@gmail.com`. |

Variables are declared through `astro:env` in `astro.config.mjs` as server-only secrets. They are read at runtime inside the serverless function and never reach the browser bundle, HTML or API responses. If `SMTP_USER` or `SMTP_PASS` is missing, the endpoint answers **503** with a friendly message and the form shows an error. It never pretends the email was sent.

---

## Deployment (Vercel)

The project uses `@astrojs/vercel` with `output: 'static'`. Pages are deployed as static files, and `/api/contact` (`prerender = false`) becomes a Node.js serverless function. Nodemailer needs a Node runtime with outbound SMTP access, which Vercel's Node functions provide. It will **not** run on edge runtimes or static-only hosts.

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel: *Add New → Project*, import the repo. The Astro preset is detected automatically.
3. Under *Settings → Environment Variables*, add `SITE_URL`, `SMTP_USER`, `SMTP_PASS` and optionally `CONTACT_TO`. Enable them for **Production**, and for **Preview** too if preview deployments should send email. Mark `SMTP_PASS` as *Sensitive*.
4. Deploy, or redeploy after changing variables, since they're only picked up by a new deployment. Hashed assets in `/_astro/` are served with `Cache-Control: public, max-age=31536000, immutable` by the adapter.
5. **Test in production:** submit the live form once and confirm the email arrives at `CONTACT_TO` and that Reply goes to the visitor's address. If it fails, check the function logs under *Deployments → (deployment) → Functions* for the `[contact]` line.

**Other hosts:** to deploy to Netlify, swap the adapter (`npx astro add netlify`, then remove `@astrojs/vercel` from `astro.config.mjs` and `package.json`). For a Node server (Render, Railway, a VPS), use `npx astro add node`. Set the same environment variables there. Some hosts block outbound SMTP ports, so make sure port 465 is allowed. A static-only host (e.g. GitHub Pages) **cannot** run the contact endpoint.

### Domain and HTTPS

Add your domain under *Settings → Domains* in Vercel and follow the DNS instructions. Vercel issues and renews HTTPS certificates automatically and redirects HTTP to HTTPS. After the domain is live, set `SITE_URL` to the `https://` origin and redeploy so canonical URLs and the sitemap use it.

---

## SEO

- Per-page `<title>`, description, canonical, Open Graph and Twitter tags come from `src/components/SEO.astro`. Pages pass `title`/`description` to `BaseLayout`. Project pages derive them from frontmatter.
- `@astrojs/sitemap` generates `/sitemap-index.xml` from built pages. Drafts (`published: false`) have no page, so they are never listed. The `/contact/*` result pages and 404 are excluded and marked `noindex`.
- `/robots.txt` is generated by `src/pages/robots.txt.ts` and points to the sitemap using `SITE_URL`.
- JSON-LD: `WebSite` + `Person` on the homepage, `ProfilePage` on About, `CollectionPage` on Projects, `CreativeWork` on each project. Validate with <https://validator.schema.org> after deploying.
- After launch, submit the sitemap in Google Search Console.

---

## Testing

```bash
npm run check                       # TypeScript / Astro diagnostics
npm run build                       # production build
npx playwright install chromium firefox webkit   # first time only
npm test                            # all browsers
npx playwright test --project=chromium           # a single browser
npx playwright show-report          # HTML report of the last run
```

The suite covers the sticky navbar, anchor scrolling with the header offset, inner-page navigation, the mobile menu (open, close on link and Escape, fits the viewport), internal link crawling, exactly three featured projects, the projects list and filter, per-project metadata, 404s for unknown and draft slugs, theme persistence and the no-flash guarantee, horizontal overflow at 320–1920px, sidebar visibility, and the contact form. For the form, browser tests mock the endpoint for success and failure, and server tests check validation, honeypot, 503 when unconfigured, body size and the rate limit. Tests run with blank SMTP credentials, so they never send real email. Test delivery manually as described in [Setting up Gmail SMTP](#setting-up-gmail-smtp).

Automated runs use Playwright's engines (Chromium, Firefox, WebKit) and device emulation. They don't replace a manual check in real Safari on macOS/iOS and Chrome on Android before launch.

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Form says "temporarily unavailable" | `SMTP_USER` or `SMTP_PASS` is not set in this environment. Locally, check `.env` and restart `npm run dev`. On Vercel, add the variables and redeploy. |
| Form says "could not be sent right now" | Gmail refused or couldn't be reached. The log line `[contact] Gmail SMTP send failed (CODE)` tells you which: `EAUTH` means a wrong `SMTP_USER`/`SMTP_PASS`. Use an **App Password**, not your account password, and check that 2-Step Verification is still on. `ETIMEDOUT`/`ECONNECTION` means outbound port 465 is blocked by your network or host. |
| Emails land in spam | Mark the first one as "Not spam" and add `SMTP_USER` to your contacts. Sending from and to your own Gmail account is normally delivered to the inbox. |
| Canonical URLs / sitemap show `localhost` | Set `SITE_URL` in the hosting environment and rebuild. |
| `npm run preview` fails | Expected with the Vercel adapter. Use `npm run dev` or a Vercel preview deployment. |
| Build fails with a content error | A project's frontmatter doesn't match the schema. The error names the file and field. |
| Tests fail to start | Run `npx playwright install`. Astro allows one dev server per project, so stop any running `npm run dev` (or run `npx astro dev stop`) and make sure port 4329 is free. |
| Wrong theme sticks around | Clear the `theme` key in the browser's localStorage. |

## Replacing placeholder content

1. `src/data/site.ts`: name, role, descriptions, status, quote.
2. `src/data/about.ts`: all About text.
3. `src/data/social-links.ts`: real profile URLs.
4. `src/assets/portrait-*.png`: your photos.
5. `src/content/projects/*`: your projects (delete the samples or set `published: false`).
6. `public/og-default.png`, `public/favicon.svg`, `public/apple-touch-icon.png`: your branding.
