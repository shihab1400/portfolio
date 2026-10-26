import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

/** Published projects, newest first. The single source for every project list and route. */
export async function getPublishedProjects(): Promise<Project[]> {
  const projects = await getCollection('projects', ({ data }) => data.published);
  return projects.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

export async function getFeaturedProjects(count = 3): Promise<Project[]> {
  const projects = await getPublishedProjects();
  const featured = projects.filter((p) => p.data.featured);
  // Top up with recent projects if fewer than `count` are marked featured.
  const rest = projects.filter((p) => !p.data.featured);
  return [...featured, ...rest].slice(0, count);
}

/** Up to `count` other projects, preferring ones that share a category or technology. */
export function getRelatedProjects(current: Project, all: Project[], count = 3): Project[] {
  const techs = new Set(current.data.technologies);
  const score = (p: Project) =>
    (p.data.category === current.data.category ? 2 : 0) +
    p.data.technologies.filter((t) => techs.has(t)).length;
  return all
    .filter((p) => p.id !== current.id)
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map(({ p }) => p);
}
