const projects = [
  ['Sonar Control Platform', 'Qt6 / Plugin Host / Cross-platform desktop architecture'],
  ['Tunnel Gateway Stack', 'NPS / Caddy / Docker / Multi-domain routing'],
  ['Creative WebGL Lab', 'Three.js / GLSL / GSAP interaction prototypes']
];

export default function ProjectsPage() {
  return (
    <div className="page-shell">
      <div className="container">
        <div data-reveal>
          <div className="kicker">The Sandbox</div>
          <h1 className="page-title">项目展示</h1>
          <p className="page-lead">这里用于呈现硬件、软件、网络与创意编码项目。第一版使用 3D 卡片感布局，后续可接入真实项目模型与架构图。</p>
        </div>
        <div className="card-grid" style={{ marginTop: 42 }}>
          {projects.map(([title, desc]) => (
            <div className="article-card" key={title} data-reveal>
              <div className="article-meta">Sandbox Module</div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <div className="rgb-scan" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
