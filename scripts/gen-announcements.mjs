/**
 * 从仓库根目录 announcements.md 提取公告列表，生成
 * docs/components/announcements.json 供首页 AnnouncementCards 与
 * 公告页 AnnouncementList 组件使用。
 *
 * 维护方式：只改 announcements.md，本脚本随 predev/prebuild 自动执行。
 *
 * 支持的行格式：
 *   ### [标题：2024.9.27](https://...)   —— 可跳转的公告文章
 *   ### [标题：2024.9.21 - 2024.9.22](https://...)
 *   ### 标题：2023.6.25                  —— 无链接的里程碑（生成静态卡片）
 *
 * 排序：按解析出的起始日期降序（最新在前），不依赖文件中的书写顺序，
 * 因此补录较早的公告写在文件任意位置都不会影响首页「最新」的准确性。
 * 无日期的条目排在末尾并给出警告。
 *
 * 校验：日期必须是真实存在的日历日期，链接必须是 http/https。
 * 关键字段缺失或格式非法时收集全部错误后以退出码 1 中止，
 * 避免坏数据静默进入正式网站。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'announcements.md');
const out = join(root, 'docs/components/announcements.json');

const errors = [];
const warnings = [];

// ---------- 日期解析 ----------

// 单个日期：2024.9.27 / 2024-9-27 / 2024/9/27 / 2023年6月25日
const DATE_TOKEN = /(\d{4})\s*[.\-/年]\s*(\d{1,2})\s*[.\-/月]\s*(\d{1,2})\s*日?/g;
// 非全局版本，用于 .test()，避免 lastIndex 副作用
const DATE_LIKE = /(\d{4})\s*[.\-/年]\s*(\d{1,2})\s*[.\-/月]\s*(\d{1,2})\s*日?/;
// 日期之间允许的分隔符
const RANGE_SEP = /^[-~至到/]*$/;

/** 校验公告链接为可用的 http(s) 站点地址。 */
function isValidHttpUrl(raw) {
  if (!/^https?:\/\/\S+$/i.test(raw)) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname;
    return Boolean(host) && (host === 'localhost' || host.includes('.'));
  } catch {
    return false;
  }
}

/** 校验为真实存在的日历日期，返回时间戳；非法返回 null */
function toTime(y, mo, d) {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt.getTime();
}

/**
 * 解析日期表达式，支持单日与区间：
 *   2024.9.27
 *   2024.9.21 - 2024.9.22 / 2024.9.21~2024.9.22 / 2024.9.21 至 2024.9.22
 * 返回 { start, end } 或 null（格式非法 / 日期不存在）。
 */
function parseDateExpr(text) {
  const s = text.trim();
  if (!s) return null;

  const tokens = [];
  DATE_TOKEN.lastIndex = 0;
  let m;
  while ((m = DATE_TOKEN.exec(s)) !== null) {
    const t = toTime(Number(m[1]), Number(m[2]), Number(m[3]));
    if (t === null) return null;
    tokens.push(t);
  }
  if (tokens.length === 0 || tokens.length > 2) return null;

  // 去掉日期后只允许剩余分隔符，防止把无关文字当成日期
  if (!RANGE_SEP.test(s.replace(DATE_TOKEN, '').replace(/\s+/g, ''))) {
    return null;
  }

  const start = tokens[0];
  const end = tokens.length === 2 ? tokens[1] : start;
  if (end < start) return null;
  return { start, end };
}

/**
 * 把 "标题：日期" 拆成 { title, date, range }。
 * 从右往左尝试每个冒号，取第一个右侧可被解析为日期的位置，
 * 这样标题自身含冒号时（如「…刘奇翰：拥抱开源是程序员的浪漫主义:2024.10.22」）
 * 不会被错误切断。
 */
function splitTitleDate(raw) {
  const s = raw.trim();
  const colons = [];
  for (let i = 0; i < s.length; i += 1) {
    if (s[i] === '：' || s[i] === ':') colons.push(i);
  }
  for (let k = colons.length - 1; k >= 0; k -= 1) {
    const i = colons[k];
    const left = s.slice(0, i).trim();
    if (!left) continue;
    const right = s.slice(i + 1).trim();
    const range = parseDateExpr(right);
    if (range) {
      return { title: left, date: right.replace(/\s+/g, ' '), range };
    }
    // 右侧「看起来像日期」（含四位年份）但解析失败 → 视为非法日期而非无日期
    if (DATE_LIKE.test(right)) {
      return {
        title: left,
        date: right.replace(/\s+/g, ' '),
        range: null,
        invalid: true,
      };
    }
  }
  return { title: s, date: '', range: null };
}

// ---------- 读取源文件 ----------

let md;
try {
  md = readFileSync(src, 'utf-8');
} catch {
  console.error('');
  console.error(`[gen-announcements] 找不到公告源文件：${src}`);
  console.error('请在仓库根目录创建 announcements.md，每行一条公告，例如：');
  console.error('  ### [公告标题：2024.9.27](https://mp.weixin.qq.com/s/xxxx)');
  console.error('  ### 里程碑标题：2023.6.25');
  console.error('');
  process.exit(1);
}

if (md.charCodeAt(0) === 0xfeff) md = md.slice(1); // 去掉 UTF-8 BOM

// 去掉代码围栏里的内容（文档中的示例不应被当成真公告）
md = md.replace(/^```[\s\S]*?^```/gm, '');

// ---------- 逐行解析 ----------

const lines = md.split(/\r?\n/);
const items = [];
const seen = new Map();

for (let i = 0; i < lines.length; i += 1) {
  const lineNo = i + 1;
  // 去掉行尾 HTML 注释（PR 文档里示范的写法）再判断，注释不参与解析
  const trimmed = lines[i].replace(/\s*<!--.*?-->\s*$/, '').trim();

  if (!/^###\s+/.test(trimmed)) {
    // 帮贡献者定位「格式写错但会被静默忽略」的行
    if (/^#{2,4}\s+/.test(trimmed) && /\d{4}/.test(trimmed)) {
      warnings.push({
        line: lineNo,
        msg: '以 # 开头但不是 ###，已忽略（公告必须以 ### 开头）',
      });
    } else if (/^[-*+]\s+/.test(trimmed) && /\d{4}/.test(trimmed)) {
      warnings.push({
        line: lineNo,
        msg: '列表项不会被识别为公告，请改用 ### 开头',
      });
    }
    continue;
  }

  const body = trimmed.replace(/^###\s+/, '');
  let rawTitle;
  let url = null;

  if (body.includes('](')) {
    // 标题里的方括号允许嵌套一层，URL 内也允许出现括号（如维基链接）
    const linkMatch = body.match(/^\[(.+)\]\((https?:\/\/\S+)\)$/);
    if (!linkMatch) {
      errors.push({
        line: lineNo,
        msg: '链接格式不正确，应为 ### [标题：日期](https://…)',
      });
      continue;
    }
    rawTitle = linkMatch[1];
    url = linkMatch[2];
    if (!isValidHttpUrl(url)) {
      errors.push({
        line: lineNo,
        msg: '链接地址无效，必须是包含有效主机名的 http:// 或 https:// 地址',
      });
      continue;
    }
  } else {
    rawTitle = body;
  }

  rawTitle = rawTitle.trim();
  if (!rawTitle) {
    errors.push({ line: lineNo, msg: '公告标题为空' });
    continue;
  }
  // 标题里残留的 markdown 链接语法说明方括号没配对，会解析出错误的标题/日期
  if (/\]\(/.test(rawTitle)) {
    errors.push({
      line: lineNo,
      msg: '标题里含有 ]( 会破坏链接解析，请去掉方括号或改写标题',
    });
    continue;
  }

  const { title, date, range, invalid } = splitTitleDate(rawTitle);
  if (!title) {
    errors.push({ line: lineNo, msg: '公告标题为空' });
    continue;
  }
  if (invalid) {
    errors.push({
      line: lineNo,
      msg: `日期不合法：${date}（需为真实存在的日期，如 2024.9.27 或 2024.9.21 - 2024.9.22）`,
    });
    continue;
  }
  if (!date) {
    warnings.push({
      line: lineNo,
      msg: `未识别到日期，将排在列表末尾：${title.slice(0, 30)}`,
    });
  }

  const source = !url
    ? 'milestone'
    : url.includes('mp.weixin.qq.com')
      ? 'wechat'
      : url.includes('gitee.com')
        ? 'gitee'
        : 'other';

  const dedupeKey = url ? `url:${url}` : `title:${title}|${date}`;
  if (seen.has(dedupeKey)) {
    warnings.push({
      line: lineNo,
      msg: `与第 ${seen.get(dedupeKey)} 行重复，已跳过`,
    });
    continue;
  }
  seen.set(dedupeKey, lineNo);

  items.push({
    title,
    date,
    url,
    source,
    start: range ? range.start : -Infinity,
    end: range ? range.end : -Infinity,
    line: lineNo,
  });
}

// ---------- 排序：起始日期降序，无日期沉底 ----------

function compare(a, b) {
  if (a.start !== b.start) {
    if (a.start === -Infinity) return 1;
    if (b.start === -Infinity) return -1;
    return b.start - a.start;
  }
  if (a.end !== b.end) {
    if (a.end === -Infinity) return 1;
    if (b.end === -Infinity) return -1;
    return b.end - a.end;
  }
  return 0; // 同日期保持文件中的相对顺序（sort 是稳定排序）
}

items.sort(compare);

// ---------- 输出 ----------

for (const w of warnings) {
  console.warn(`[gen-announcements] 警告 第 ${w.line} 行：${w.msg}`);
}

if (errors.length > 0) {
  console.error('');
  for (const e of errors) {
    console.error(`[gen-announcements] 错误 第 ${e.line} 行：${e.msg}`);
  }
  console.error('');
  console.error(
    `[gen-announcements] 共 ${errors.length} 处错误，已中止生成。请修正 announcements.md 后重试。`
  );
  console.error('');
  process.exit(1);
}

const output = items.map(({ title, date, url, source }) => ({
  title,
  date,
  url,
  source,
}));

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
console.log(`[gen-announcements] ${output.length} 条 -> ${out}`);
