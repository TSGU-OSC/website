/**
 * 公告解析核心。
 *
 * 这里是「公告数据」的唯一实现：rspress.config.ts（构建期注入）、
 * scripts/check-announcements.mjs（提交前校验）、CreateAnnouncement.tsx
 * （表单实时校验）三处共用同一份规则。
 *
 * 之前是「构建脚本一份 + 表单一份」的拷贝式同步，改一处忘另一处就会出现
 * 「表单放过、构建报错」这种最难排查的情况；抽成纯函数后只有一处可改。
 *
 * 本模块不读写文件、不依赖 Node API：输入 Markdown 字符串，输出结构化数据，
 * 因此既能被 Node 脚本 import，也能被浏览器端组件 import。
 */

// ---------- 日期解析 ----------

// 单个日期：2024.9.27 / 2024-9-27 / 2024/9/27 / 2023年6月25日
const DATE_TOKEN = /(\d{4})\s*[.\-/年]\s*(\d{1,2})\s*[.\-/月]\s*(\d{1,2})\s*日?/g;
// 非全局版本，用于 .test()，避免 lastIndex 副作用
const DATE_LIKE = /(\d{4})\s*[.\-/年]\s*(\d{1,2})\s*[.\-/月]\s*(\d{1,2})\s*日?/;
// 日期之间允许的分隔符
const RANGE_SEP = /^[-~至到/]*$/;

// URL 快速预检（真正的有效性交给 isValidHttpUrl 里的 new URL 判定）
// 带 i 标志：用户粘贴 HTTPS:// 这类大写协议也应视为合法
const URL_RE = /^https?:\/\/\S+$/i;

/**
 * 校验为真实存在的日历日期，返回时间戳；非法返回 null。
 * 用「构造后回读年/月/日」的方式排除 2024.2.30 这类看似合法但不存在的日期。
 *
 * @param {number} y 年
 * @param {number} mo 月（1-12）
 * @param {number} d 日
 * @returns {number | null}
 */
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
 *
 * @param {string} text
 * @returns {{ start: number, end: number } | null} 格式非法 / 日期不存在时返回 null
 */
export function parseDateExpr(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  /** @type {number[]} */
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

// ---------- 链接与来源 ----------

/**
 * 校验链接是否为可用的 http(s) 站点地址。
 * 先用正则快速预检，避免对每个按键都构造 URL 对象；通过后再交给标准
 * URL 解析器判断协议与主机名（http://a 这类没有域名的主机不算有效站点）。
 *
 * @param {string} raw
 * @returns {boolean}
 */
export function isValidHttpUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!URL_RE.test(s)) return false;
  try {
    const parsed = new URL(s);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname;
    if (!host) return false;
    // localhost 是本地预览的合法特例，其余主机名必须带点（含域名后缀）
    return host === 'localhost' || host.includes('.');
  } catch {
    return false;
  }
}

/**
 * 按链接域名识别来源，用于卡片上的来源标签。
 *
 * @param {string} url
 * @returns {'wechat' | 'gitee' | 'other'}
 */
export function detectSource(url) {
  const s = String(url ?? '');
  if (s.includes('mp.weixin.qq.com')) return 'wechat';
  if (s.includes('gitee.com')) return 'gitee';
  return 'other';
}

// ---------- 行解析 ----------

/**
 * 把 "标题：日期" 拆成 { title, date, range }。
 * 从右往左尝试每个冒号，取第一个右侧可被解析为日期的位置，
 * 这样标题自身含冒号时（如「…刘奇翰：拥抱开源是程序员的浪漫主义:2024.10.22」）
 * 不会被错误切断。
 *
 * @param {string} raw
 */
function splitTitleDate(raw) {
  const s = String(raw ?? '').trim();
  /** @type {number[]} */
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
      return { title: left, date: right.replace(/\s+/g, ' '), range: null, invalid: true };
    }
  }
  return { title: s, date: '', range: null };
}

// ---------- 主入口 ----------

/**
 * @typedef {object} AnnouncementItem
 * @property {string} title 卡片标题
 * @property {string} date 展示用日期原文
 * @property {string | null} url 原文链接，里程碑为 null
 * @property {'wechat' | 'gitee' | 'other' | 'milestone'} source 来源
 */

/**
 * @typedef {object} ParseIssue
 * @property {number} line 源文件行号
 * @property {string} msg 问题描述
 */

/**
 * 解析 announcements.md。
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
 * 关键字段缺失或格式非法时全部收集后返回，由调用方决定中止还是提示，
 * 避免坏数据静默进入正式网站。
 *
 * @param {string} markdown announcements.md 的原始内容
 * @returns {{ items: AnnouncementItem[], errors: ParseIssue[], warnings: ParseIssue[] }}
 */
export function parseAnnouncements(markdown) {
  /** @type {ParseIssue[]} */
  const errors = [];
  /** @type {ParseIssue[]} */
  const warnings = [];

  let md = typeof markdown === 'string' ? markdown : '';
  if (md.charCodeAt(0) === 0xfeff) md = md.slice(1); // 去掉 UTF-8 BOM

  // 去掉代码围栏里的内容（文档中的示例不应被当成真公告）
  md = md.replace(/^```[\s\S]*?^```/gm, '');

  const lines = md.split(/\r?\n/);
  /** @type {(AnnouncementItem & { start: number, end: number, line: number })[]} */
  const items = [];
  /** @type {Map<string, number>} */
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
        warnings.push({ line: lineNo, msg: '列表项不会被识别为公告，请改用 ### 开头' });
      }
      continue;
    }

    const body = trimmed.replace(/^###\s+/, '');
    /** @type {string} */
    let rawTitle;
    /** @type {string | null} */
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

    const parsed = splitTitleDate(rawTitle);
    const title = parsed.title;
    const date = parsed.date;
    const range = parsed.range;

    if (!title) {
      errors.push({ line: lineNo, msg: '公告标题为空' });
      continue;
    }
    if (parsed.invalid) {
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

    const source = url ? detectSource(url) : 'milestone';

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

  // 起始日期降序，无日期沉底；同日期保持文件中的相对顺序（sort 稳定）
  items.sort((a, b) => {
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
    return 0;
  });

  return {
    items: items.map(({ title, date, url, source }) => ({ title, date, url, source })),
    errors,
    warnings,
  };
}
