# 开源鸿蒙社官网

天津中德应用技术大学开源鸿蒙社（TSGU-OSC）的门户网站。

线上地址：https://osc.tsguas.cn/ ｜ 开源协议：Apache-2.0

它既是社团对外的名片——介绍我们是谁、做过什么、怎么加入；也是给在校成员的实用手册——从新生入学到校内生活、从项目导航到学习路线。站点是纯静态的，内容全部是 Markdown，改完提 PR 就能上线，不需要数据库或后台。

## 站内有什么

**给新同学**
新生指南，六章：前言、入学准备、校内生活、校外与津城、津外生源、附录；以及每年的纳新信息。

**了解社团**
社团介绍、现任与往届成员、项目总览（社团仓库导航）、人才培养计划与各方向学习路线。

**跟动态**
社团公告按年份归档，首页展示最近 6 条，点卡片可跳转公众号原文或活动仓库。

**找资源**
技术文档（[docs.tsguas.cn](https://docs.tsguas.cn/)）、社团微信公众号、[1024 代码画廊](https://osc-harmony1024-gallery.pages.dev/)。

## 技术栈

Rspress 1.36（SSG）+ React/TSX 自研组件，Node.js 18+，npm 管理依赖。构建产物是纯静态文件，放在任意静态托管都能跑。

## 本地运行

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 产物在 doc_build/
npm run preview  # 预览构建结果
```

## 参与贡献

- **发公告**：打开线上 [`/announcement/create`](https://osc.tsguas.cn/announcement/create)，填标题、日期、原文链接，复制生成的片段，按页面引导 Fork 仓库并发 PR。
- **改内容**：Fork → 修改 `docs/zh`（英文站为 `docs/en`）里的 Markdown → 提 PR。

包括仓库管理员在内，所有人都走 Fork + PR，`master` 有分支保护。公告格式、目录约定、校验命令等细节见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## CI 与部署

`.github/workflows/ci.yaml` 在 push / PR 到 `master` 时用 Node 18、20 跑 `npm ci` + `npm run build`。`doc_build/` 是纯静态产物，直接交给静态托管即可。

## 许可证

Apache-2.0，详见 [LICENSE](./LICENSE)。
