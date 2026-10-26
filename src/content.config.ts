import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  // Each Markdown file is one project; its filename (or a `slug` field) becomes the URL slug.
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** One or two sentences, used on cards and as the meta description. */
      description: z.string().max(180),
      thumbnail: image(),
      thumbnailAlt: z.string(),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      technologies: z.array(z.string()).min(1),
      features: z.array(z.string()).default([]),
      category: z.string(),
      featured: z.boolean().default(false),
      /** Unpublished projects get no page and are left out of every list and the sitemap. */
      published: z.boolean().default(true),
      liveUrl: z.url().optional(),
      repositoryUrl: z.url().optional(),
      purpose: z.string().optional(),
      challenge: z.string().optional(),
      solution: z.string().optional(),
      results: z.string().optional(),
      publishDate: z.coerce.date(),
    }),
});

export const collections = { projects };
