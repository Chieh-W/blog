import { seedPosts } from './seed-posts';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  tags: string[];
  content: string;
};

type UnknownRecord = Record<string, unknown>;

function normalizeStrapiItem(item: UnknownRecord): BlogPost | null {
  const attrs = (item.attributes && typeof item.attributes === 'object')
    ? item.attributes as UnknownRecord
    : item;

  const title = String(attrs.title || 'Untitled');
  const slug = String(attrs.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  const rawTags = attrs.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map(String)
    : typeof rawTags === 'string'
      ? rawTags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

  if (!slug || !title) return null;

  return {
    slug,
    title,
    excerpt: String(attrs.excerpt || ''),
    category: String(attrs.category || 'Log'),
    date: String(attrs.publishedAt || attrs.date || new Date().toISOString()).slice(0, 10),
    tags: tags.length ? tags : ['Nexus'],
    content: String(attrs.content || '')
  };
}

export async function getPosts(): Promise<BlogPost[]> {
  const api = process.env.STRAPI_API_URL || process.env.NEXT_PUBLIC_STRAPI_API_URL;
  if (!api) return seedPosts;

  try {
    const res = await fetch(`${api}/api/articles?populate=*&sort=publishedAt:desc`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return seedPosts;
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    const posts = data.map(normalizeStrapiItem).filter(Boolean) as BlogPost[];
    return posts.length ? posts : seedPosts;
  } catch {
    return seedPosts;
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const posts = await getPosts();
  return posts.find((post) => post.slug === slug) || null;
}
