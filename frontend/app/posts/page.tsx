import { ArticleCard } from '@/components/ArticleCard';
import { getPosts } from '@/lib/posts';

export const revalidate = 60;

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="page-shell">
      <div className="container">
        <div data-reveal>
          <div className="kicker">The Log Matrix</div>
          <h1 className="page-title">文章矩阵</h1>
          <p className="page-lead">基础设施、网络、桌面工程、Docker 迁移与 WebGL 美学的信号记录。</p>
        </div>
        <div className="card-grid" style={{ marginTop: 42 }}>
          {posts.map((post) => <ArticleCard post={post} key={post.slug} />)}
        </div>
      </div>
    </div>
  );
}
