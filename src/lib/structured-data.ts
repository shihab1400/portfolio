import { site } from '../data/site';
import { isPlaceholderUrl, socialLinks } from '../data/social-links';

/** Only real (non-placeholder) profiles are published as `sameAs`. */
const sameAs = socialLinks.map((link) => link.url).filter((url) => !isPlaceholderUrl(url));

export function personSchema(siteUrl: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': new URL('/#person', siteUrl).href,
    name: site.name,
    jobTitle: site.role,
    url: siteUrl.href,
    email: `mailto:${site.email}`,
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function websiteSchema(siteUrl: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: siteUrl.href,
    description: site.defaultDescription,
    inLanguage: site.locale,
    author: { '@id': new URL('/#person', siteUrl).href },
  };
}
