import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nagargo.com';
  const routes = [
    '', '/ride', '/delivery', '/medicine', '/rider', '/pricing', '/track', '/support',
    '/about', '/privacy', '/terms', '/refund', '/rider-terms', '/location-policy',
    '/login', '/register', '/dashboard', '/orders', '/payments', '/locations',
    '/notifications', '/reviews', '/account',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));
}
