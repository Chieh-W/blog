# Cyber-Physical Nexus

一个以“数字与物理的共振”为设计核心的沉浸式个人技术博客 Docker 服务。

## 技术栈

- Next.js standalone 运行模式
- React + Three.js WebGL 背景
- GSAP + ScrollTrigger + Lenis 平滑滚动
- Strapi Headless CMS
- Docker Compose

## 快速启动

```bash
docker compose up -d --build
```

访问：

```text
http://localhost:9053
```

Strapi 后台：

```text
http://localhost:1337/admin
```

## 端口

- 前端：宿主机 `9053` → 容器 `3000`
- Strapi：宿主机 `1337` → 容器 `1337`

## 验证

```bash
curl -I http://localhost:9053
curl http://localhost:9053 | head
```

## 内容策略

前端会优先从 Strapi 读取文章；如果 Strapi 尚未配置文章模型或没有公开内容，会自动回退到 `frontend/lib/seed-posts.ts` 内置的 5 篇示例文章，保证第一版开箱即可运行。

建议在 Strapi 中创建 Collection Type：`article`，字段如下：

- `title` Text
- `slug` UID 或 Text
- `excerpt` Text
- `content` Rich Text / Markdown Text
- `category` Text
- `tags` JSON 或 Text
- `publishedAt` DateTime

## Webhook / ISR

前端包含 revalidate API：

```text
POST http://localhost:9053/api/revalidate?secret=change-me-to-a-long-random-string
```

Strapi 发布文章后可配置 Webhook 调用该接口，触发文章列表与文章详情页缓存刷新。

## Strapi image fix

This project builds Strapi from `./backend` instead of pulling `strapi/strapi:latest`. Strapi does not publish official container images, so the CMS container is built locally with the bundled Strapi project.

After the containers start, open `http://localhost:1337/admin` and create the first admin account. The bundled Strapi project already includes an `Article` collection type with these fields: `title`, `slug`, `excerpt`, `category`, `date`, `tags`, and `content`.

If you want the Next.js frontend to read CMS articles instead of the built-in fallback examples, publish Article entries in Strapi and enable public `find` / `findOne` permissions for the Article API, or add an API token flow later.
