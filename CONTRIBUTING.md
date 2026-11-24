# 贡献指南

面向想改这个站点的社团成员。README 讲「站点是什么」，这里讲「怎么改」。

## 内容放在哪

| 想改什么 | 改哪里 |
| --- | --- |
| 公告 | 根目录 `announcements.md` |
| 首页 hero / 功能入口 | `docs/zh/index.md`（英文 `docs/en/index.md`） |
| 社团介绍、项目表 | `docs/zh/content/index.md` |
| 成员名录 | `docs/zh/content/members/` |
| 人才培养、学习路线 | `docs/zh/content/personalDevelopment/` |
| 新生指南 | `docs/zh/guide/`（6 个分章目录） |
| 纳新信息 | `docs/zh/recruitment/index.md` |
| 侧栏 / 导航条目 | 对应目录的 `_meta.json` |

英文站 `docs/en/` 与中文站结构镜像。公告页是例外：中文站由 `announcements.md` 自动生成，英文站仍是手写 Markdown。

## 公告怎么写

一行一条，`###` 开头：

```markdown
### [开源鸿蒙社2026纳新活动：2026.9.21 - 2026.9.22](https://mp.weixin.qq.com/s/xxxx)
### [社团获华为昇腾AI创新大赛铜奖：2026.5.10](https://mp.weixin.qq.com/s/xxxx)
### 社团管理系统正式上线：2024.3.4
```

规则：

- 只有 `###` 会被解析，其他级别的标题、列表项会被忽略（校验脚本会提示）。
- 标题与日期用中文或英文冒号分隔；标题自身含冒号时，以最右侧能解析成日期的一段为准。
- 日期支持 `2026.9.21`、`2026-9-21`、`2026/9/21`、`2026年9月21日`；区间用 `-`、`~`、`至`、`到` 连接。
- 日期必须是真实存在的日期，`2026.2.30` 会被判为错误。
- 有原文的写 `[标题：日期](https://…)`，链接须是带主机名的 http(s) 地址；没有链接的社团里程碑只写 `标题：日期`，渲染成静态卡片。
- 不用手动排序，构建时按起始日期从新到旧排列，补录旧公告写在文件任何位置都可以。

数据链路：`announcements.md` → `rspress.config.ts` 构建期解析 → 注入 `__ANNOUNCEMENTS__` → 首页取前 6 条、公告页全量按年份分组。

两个约定：

- 仓库里不要出现 `announcements.json` 之类中间产物，数据只在构建时存在。
- 日期与链接规则只有一份实现：`docs/components/announcements-core.mjs`，构建期、校验脚本、投稿表单共用。要改规则改这一处，不要复制第二份。

## 代码约定

```
docs/components/                 自研 React 组件，tsx + 同名 css
theme/index.tsx                  主题入口，只做首页公告区注入
scripts/check-announcements.mjs  公告校验，只读不写文件
rspress.config.ts                站点配置 + 构建期解析公告
```

- 组件放 `docs/components/`，不要放进 `theme/`，避免和主题升级冲突。
- `scripts/` 下的脚本只做校验，不生成文件。
- 新增页面后要在所在目录的 `_meta.json` 里登记，否则不会出现在侧栏。

## 本地检查

```bash
npm run check:announcements   # 只校验公告，成功时无输出
npm run build                 # 完整构建，公告有问题会在配置加载阶段中止
```

## 提交流程

1. Fork 本仓库，在自己的 Fork 里改。
2. 提交后向 `TSGU-OSC/website` 的 `master` 发起 PR。
3. PR 合并后，下一次构建自动生效。

`master` 有分支保护，管理员也必须走 PR。提交信息尽量一句话说清改了什么，例如 `docs: add 2026 recruitment info`，一个提交只做一件事。
