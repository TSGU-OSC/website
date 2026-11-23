/**
 * 公告数据入口（供首页卡片与公告页使用）。
 *
 * 数据来源：根目录 announcements.md → rspress.config.ts 构建期解析
 * → builderConfig.source.define 注入 __ANNOUNCEMENTS__ 常量。
 *
 * 仓库中不存在 announcements.json 之类的中间产物：改公告只改 md，
 * 首次启动 dev / build 时数据就已内联进来，无需先跑任何生成脚本。
 */

export type AnnouncementSource = 'wechat' | 'gitee' | 'other' | 'milestone';

export interface Announcement {
  title: string;
  date: string;
  url: string | null;
  source: AnnouncementSource;
}

// 由 rspress.config.ts 在编译期替换成字面量数组；
// typeof 兜底用于极端情况（例如配置未生效时）避免整页白屏。
declare const __ANNOUNCEMENTS__: Announcement[] | undefined;

export const announcements: Announcement[] =
  typeof __ANNOUNCEMENTS__ === 'undefined' ? [] : __ANNOUNCEMENTS__;

export const SOURCE_LABEL: Record<AnnouncementSource, string> = {
  wechat: '微信推文',
  gitee: 'Gitee',
  other: '外部链接',
  milestone: '里程碑',
};

export default announcements;
