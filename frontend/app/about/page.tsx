export default function AboutPage() {
  return (
    <div className="page-shell">
      <div className="container">
        <div data-reveal>
          <div className="kicker">The Engineer's Specification</div>
          <h1 className="page-title">Alex Chen</h1>
          <p className="page-lead">连接物理硬件与数字生态的极客构建者。Bridging the gap between physical hardware and digital ecosystems.</p>
        </div>
        <section className="section" style={{ paddingTop: 54 }}>
          <div className="spec-grid">
            <div className="spec-item"><strong>Hardware</strong><span>Embedded systems, electronics, instrumentation thinking</span></div>
            <div className="spec-item"><strong>Software</strong><span>Qt/C++, Next.js, service architecture, tools</span></div>
            <div className="spec-item"><strong>Ops</strong><span>Docker, Linux, reverse proxy, secure access</span></div>
            <div className="spec-item"><strong>Creative</strong><span>WebGL, GSAP, industrial digital aesthetics</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
