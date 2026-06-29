import { notFound } from 'next/navigation';
import { getPost, getPosts } from '@/lib/posts';
import { renderMarkdown } from '@/lib/markdown';

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: `${post.title} | Cyber-Physical Nexus`,
    description: post.excerpt
  };
}

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();
  const html = renderMarkdown(post.content);

  return (
    <div className="page-shell post-detail-shell">
      <div className="container">
        <div className="article-intro" data-reveal style={{ marginBottom: 48 }}>
          <div className="kicker">{post.category} · {post.date}</div>
          <h1 className="page-title">{post.title}</h1>
          <p className="page-lead">{post.excerpt}</p>
          <div className="tag-row">{post.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div>
        </div>
        <div className="article-layout article-surface">
          <aside className="toc" data-reveal>
            <div>TRACE INDEX</div>
            <div style={{ marginTop: 16, color: 'var(--copper)' }}>scroll-linked TOC placeholder</div>
          </aside>
          <article className="article-body layered-body" data-reveal dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
