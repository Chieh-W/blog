export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="container">
        <div data-reveal>
          <div className="kicker">Signal Station</div>
          <h1 className="page-title">联系我</h1>
          <p className="page-lead">邮箱：hello@nexus-dev.local</p>
        </div>
        <div className="signal-panel" style={{ marginTop: 42 }} data-reveal>
          <p className="section-desc">第一阶段先保留静态联系方式。第二阶段可以接入表单提交、电波扩散 WebGL 粒子反馈和后端通知。</p>
        </div>
      </div>
    </div>
  );
}
