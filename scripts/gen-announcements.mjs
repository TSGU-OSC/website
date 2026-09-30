/**
 * 从 docs/zh/announcement/index.md 提取公告列表，生成
 * docs/components/announcements.json 供首页 AnnouncementCards 组件使用。
 *
 * 维护方式：只改 announcement/index.md，本脚本随 predev/prebuild 自动执行。
 *
 * 支持的行格式：
 *   ### [标题：2024.9.27](https://...)
 *   ### [标题：2024.9.21 - 2024.9.22](https://...)
 * 无链接的纯文本条目（如里程碑）会被跳过——首页卡片只放可跳转的文章。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'docs/zh/announcement/index.md');
const out = join(root, 'docs/components/announcements.json');

const md = readFileSync(src, 'utf-8');

// ### [标题](链接)
const entryRe = /^###\s+\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\s*$/gm;
// 尾部日期：2024.9.27 / 2024.9.21 - 2024.9.22 / 2023年6月25日 等
const dateRe = /^(.*?)[：:]\s*((?:\d{4}[./\-年]\s*\d{1,2}.*))$/;

const items = [];
let m;
while ((m = entryRe.exec(md)) !== null) {
  const rawTitle = m[1].trim();
  const url = m[2].trim();

  let title = rawTitle;
  let date = '';
  const dm = rawTitle.match(dateRe);
  if (dm) {
    title = dm[1].trim();
    date = dm[2].trim().replace(/\s+/g, ' ');
  }

  const source = url.includes('mp.weixin.qq.com')
    ? 'wechat'
    : url.includes('gitee.com')
      ? 'gitee'
      : 'other';

  items.push({ title, date, url, source });
}

// 文件中时间从旧到新排列，首页要最新的在前
items.reverse();

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(items, null, 2) + '\n', 'utf-8');
console.log(`[gen-announcements] ${items.length} 条 -> ${out}`);
