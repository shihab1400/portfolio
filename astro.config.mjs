// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Production origin used for canonical URLs, Open Graph tags and the sitemap.
// Set SITE_URL in your hosting provider's environment (e.g. https://yourname.dev).
const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  // Pages are prerendered to static HTML; only /api/contact runs on the server.
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => !/\/(contact\/(sent|error)|404)\/?$/.test(new URL(page).pathname),
    }),
  ],
  env: {
    schema: {
      // Gmail account that sends contact emails, and its App Password (not the account password).
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASS: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO: envField.string({
        context: 'server',
        access: 'secret',
        default: 'shihabcoc39@gmail.com',
      }),
    },
  },
});
