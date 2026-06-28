import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9053';
  const posts = await getPosts();
  return [
    '', '/posts', '/projects', '/about', '/contact',
    ...posts.map((post) => `/posts/${post.slug}`)
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
