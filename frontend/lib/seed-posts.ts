import type { BlogPost } from './posts';

export const seedPosts: BlogPost[] = [
  {
    slug: 'ubuntu-server-deployment-log',
    title: 'Ubuntu 服务器部署记录：从裸机到稳定服务',
    excerpt: '记录一次从 SSH、安全策略、systemd 到 Docker Compose 的完整服务器初始化过程。',
    category: 'Infrastructure',
    date: '2026-06-01',
    tags: ['Ubuntu', 'SSH', 'systemd', 'Ops'],
    content: `
## 为什么要重视服务器底座

一台稳定的服务器不是从安装应用开始的，而是从身份认证、端口边界、服务自启和日志观测开始的。

## 基础流程

- 创建非 root 管理用户
- 配置 SSH 密钥登录
- 保留必要端口，关闭无用暴露面
- 使用 systemd 或 Docker Compose 管理服务生命周期

\`\`\`bash
sudo adduser alex
sudo usermod -aG sudo alex
sudo systemctl status ssh
sudo journalctl -u ssh -n 80 --no-pager
\`\`\`

## 工程师笔记

硬件世界里，电源、地线和屏蔽层决定了系统稳定性。服务器世界里，身份、网络和日志承担着同样的角色。
`
  },
  {
    slug: 'nps-intranet-penetration-guide',
    title: 'NPS 内网穿透配置指南：把内网服务安全暴露出去',
    excerpt: '从云服务器端口、NPC 客户端、vkey 到反代链路，整理一套可复用的内网穿透部署方式。',
    category: 'Networking',
    date: '2026-06-08',
    tags: ['NPS', 'NPC', 'Caddy', 'Tunnel'],
    content: `
## 拓扑结构

NPS 适合把内网中的 HTTP、TCP 服务映射到公网服务器上。核心是区分三层入口：公网域名、NPS 服务端、内网 NPC 客户端。

## 配置重点

- 公网安全组必须开放入口端口
- NPC 端保持稳定在线
- Web 管理后台不建议直接暴露弱密码
- HTTPS 证书建议在最外层网关统一处理

\`\`\`bash
sudo grep -nE 'web_username|web_password|bridge_port|public_vkey' /usr/local/nps/conf/nps.conf
systemctl status nps
systemctl status npc
\`\`\`

## 运维建议

把端口、域名、反代路径写进文档，避免几个月后自己也忘记链路关系。
`
  },
  {
    slug: 'qt6-plugin-refactor',
    title: 'Qt6 上位机插件化重构：从 MainWindow 到 Host Service',
    excerpt: '记录将多个 Qt 上位机统一为一个跨平台、可插件拓展软件的阶段性设计。',
    category: 'Desktop Engineering',
    date: '2026-06-14',
    tags: ['Qt6', 'Plugin', 'C++', 'Architecture'],
    content: `
## 为什么要插件化

当所有功能都被塞进 MainWindow 时，新增功能会变成风险叠加。插件化的价值不是立刻让旧代码消失，而是阻止复杂度继续无序增长。

## 分层思路

- Host Application 负责生命周期和主窗口
- Host Service 暴露受控能力
- Plugin 只通过 SDK 与主程序沟通
- 旧业务逐步迁移，不一次性推倒重来

\`\`\`cpp
class IFrameCaptureService {
public:
    virtual ~IFrameCaptureService() = default;
    virtual QImage captureCurrentFrame() const = 0;
};
\`\`\`

## 风险控制

C++ 插件运行在同一进程中，崩溃仍可能拖垮主程序。因此插件边界、日志、禁用和卸载机制必须一开始就设计好。
`
  },
  {
    slug: 'docker-service-migration-notes',
    title: 'Docker 服务迁移笔记：让环境成为可复制资产',
    excerpt: '把零散服务迁移为 Compose 编排，统一网络、卷、端口和启动策略。',
    category: 'DevOps',
    date: '2026-06-20',
    tags: ['Docker', 'Compose', 'Migration', 'Nginx'],
    content: `
## 迁移目标

Docker 化不是为了追新，而是为了让服务的运行条件变成可审查、可复刻、可回滚的资产。

## Compose 的四个核心点

1. 服务名就是内网 DNS
2. volume 决定数据是否真正持久
3. ports 决定对外暴露边界
4. restart 策略决定异常恢复方式

\`\`\`yaml
services:
  app:
    image: node:20-alpine
    restart: unless-stopped
    ports:
      - "9053:3000"
\`\`\`

## 我的原则

先让服务跑起来，再把安全、备份、日志和监控一层层补齐。
`
  },
  {
    slug: 'webgl-industrial-digital-aesthetics',
    title: 'WebGL 与工业数字美学：让网页拥有物理质感',
    excerpt: '从电路板、示波器、粒子场和 GSAP 时间轴出发，探索技术博客的视觉语言。',
    category: 'Creative Coding',
    date: '2026-06-25',
    tags: ['WebGL', 'GSAP', 'Three.js', 'Design'],
    content: `
## 视觉不是装饰

对于工程师博客来说，视觉语言应该服务于身份表达。电子电路网格、铜金导线、绿色信号态，都能把“软硬件交汇”的特征变成可感知体验。

## 动效原则

- WebGL 负责空间与物理感
- GSAP 负责确定性时间轴
- CSS 负责低成本质感和响应式降级
- 内容始终保持可读与可索引

\`\`\`ts
gsap.to(mesh.rotation, {
  y: Math.PI * 1.4,
  scrollTrigger: {
    trigger: section,
    scrub: true
  }
});
\`\`\`

## 最终目标

一个好的技术博客应该像一台打开外壳的仪器：结构清晰、信号流动、每个交互都像真实物理反馈。
`
  }
];
