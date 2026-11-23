/**
 * 校验仓库根目录 announcements.md，不写任何文件。
 *
 * 数据流向：announcements.md ──(rspress.config.ts 构建期解析)──> source.define
 *           ──> 首页 AnnouncementCards / 公告页 AnnouncementList
 *
 * dev / build 时的拦截由 rspress.config.ts 在加载阶段完成（同样会解析并报错），
 * 所以日常启动不会有额外输出。本脚本用于两件事：
 *   1. 手动快速自查：npm run check:announcements（成功时静默，仅异常时输出）
 *   2. CI / 提交前检查：直接看退出码
 * 解析规则全部来自 docs/components/announcements-core.mjs，与前端表单共用。
 *
 * 维护方式：只改 announcements.md，不需要生成或提交任何中间文件。
 *
 * 支持的行格式：
 *   ### [标题：2024.9.27](https://...)   —— 可跳转的公告文章
 *   ### [标题：2024.9.21 - 2024.9.22](https://...)
 *   ### 标题：2023.6.25                  —— 无链接的里程碑（生成静态卡片）
 *
 * 排序：按解析出的起始日期降序（最新在前），不依赖文件中的书写顺序。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseAnnouncements } from '../docs/components/announcements-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'announcements.md');

let md;
try {
  md = readFileSync(src, 'utf-8');
} catch {
  console.error('');
  console.error(`[announcements] 找不到公告源文件：${src}`);
  console.error('请在仓库根目录创建 announcements.md，每行一条公告，例如：');
  console.error('  ### [公告标题：2024.9.27](https://mp.weixin.qq.com/s/xxxx)');
  console.error('  ### 里程碑标题：2023.6.25');
  console.error('');
  process.exit(1);
}

const { errors, warnings } = parseAnnouncements(md);

// 只在有问题时输出；成功时保持静默（退出码 0 即为通过）
for (const w of warnings) {
  console.warn(`[announcements] 警告 第 ${w.line} 行：${w.msg}`);
}

if (errors.length > 0) {
  console.error('');
  for (const e of errors) {
    console.error(`[announcements] 错误 第 ${e.line} 行：${e.msg}`);
  }
  console.error('');
  console.error(
    `[announcements] 共 ${errors.length} 处错误，请修正 announcements.md 后重试。`
  );
  console.error('');
  process.exit(1);
}
