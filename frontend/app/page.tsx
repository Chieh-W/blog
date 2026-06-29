import Link from 'next/link';
import { WebGLTopology } from '@/components/WebGLTopology';
import { ArticleCard } from '@/components/ArticleCard';
import { LogMatrixCurvature } from '@/components/LogMatrixCurvature';
import { getPosts } from '@/lib/posts';

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <>
      <section className="hero">
        <WebGLTopology />
        <div className="container hero-content">
          <div className="kicker">Precision Optics · Blueprint Depth</div>
          <h1 className="hero-title" aria-label="Cyber-Physical Nexus">
            <span>Cyber-Physical</span>
            <br />
            <span>Nexus</span>
          </h1>
          <p>连接物理硬件与数字生态的极客构建者。以冷峻蓝图、精密光学与三维纵深记录服务器、网络、上位机、WebGL 与工程美学的交汇。</p>
          <div className="cta-row">
            <Link className="btn" href="/posts"><span>进入 Blueprint Matrix</span></Link>
            <Link className="btn secondary" href="/about"><span>查看 Engineer Spec</span></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <LogMatrixCurvature />
        <div className="container">
          <div className="section-head" data-reveal>
            <h2>Latest Signals</h2>
            <p className="section-desc status-line">STATUS: OPTICAL_LOCK_READY · BLUEPRINT_DIVE_ARMED · CAD_MATRIX_ONLINE</p>
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
            <p className="section-desc status-line">STATUS: STANDALONE_RUNTIME · STRAPI_BUS · ISR_REVALIDATION_ARMED</p>
          </div>
          <div className="spec-grid">
            <div className="spec-item"><strong>Frontend</strong><span>Next.js standalone on Node.js runtime</span></div>
            <div className="spec-item"><strong>Motion</strong><span>GSAP ScrollTrigger + Lenis</span></div>
            <div className="spec-item"><strong>Visual</strong><span>Three.js precision schematic particles</span></div>
            <div className="spec-item"><strong>CMS</strong><span>Strapi Headless content bus</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
