import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/llms.txt'],
      // Dashboards, sign-in links, private claim pages and APIs aren't useful in search.
      disallow: ['/admin', '/auth', '/api', '/claim'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
