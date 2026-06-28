import Link from 'next/link';
import type { BlogPost } from '@/lib/posts';

export function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link className="article-card" href={`/posts/${post.slug}`} data-reveal>
      <div className="article-meta">{post.category} · {post.date}</div>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <div className="tag-row">
        {post.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}
      </div>
      <div className="rgb-scan" />
    </Link>
  );
}
