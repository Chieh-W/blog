import Link from 'next/link';
import { WebGLTopology } from '@/components/WebGLTopology';
import { ArticleCard } from '@/components/ArticleCard';
import { getPosts } from '@/lib/posts';

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <>
      <section className="hero">
        <WebGLTopology />
        <div className="container hero-content">
          <div className="kicker">Digital-Physical Resonance</div>
          <h1><span className="gradient-text">Cyber-Physical</span><br />Nexus</h1>
          <p>连接物理硬件与数字生态的极客构建者。这里记录服务器、网络、上位机、WebGL 与工程美学的交汇。</p>
          <div className="cta-row">
            <Link className="btn" href="/posts">进入 Log Matrix</Link>
            <Link className="btn secondary" href="/about">查看 Engineer Spec</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2>Latest Signals</h2>
            <p className="section-desc">文章卡片以电磁信号片段呈现，悬停时触发 RGB 通道错位与扫描线反馈。</p>
          </div>
          <div className="card-grid">
            {posts.slice(0, 3).map((post) => <ArticleCard post={post} key={post.slug} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container signal-panel" data-reveal>
          <div className="section-head">
            <h2>System Baseline</h2>
            <p className="section-desc">第一阶段先固定架构骨架：Next.js standalone、Strapi、Docker Compose、ISR 级内容刷新链路。</p>
          </div>
          <div className="spec-grid">
            <div className="spec-item"><strong>Frontend</strong><span>Next.js standalone on Node.js runtime</span></div>
            <div className="spec-item"><strong>Motion</strong><span>GSAP ScrollTrigger + Lenis</span></div>
            <div className="spec-item"><strong>Visual</strong><span>Three.js EMP topology particles</span></div>
            <div className="spec-item"><strong>CMS</strong><span>Strapi Headless content bus</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
