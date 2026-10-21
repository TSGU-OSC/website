import { useEffect, useState } from 'react';
import './AnnouncementCards.css';
import './CreateAnnouncement.css';

type Source = 'wechat' | 'gitee' | 'other';

// Fork 检测状态机：wrong = 仓库存在但不是本项目的 Fork；
// stale = 确实是本项目 Fork，但 Fork 里还没有 announcements.md（落后，需要 Sync fork）
type ForkState =
  | 'idle'
  | 'checking'
  | 'exists'
  | 'stale'
  | 'none'
  | 'wrong'
  | 'error';

const SOURCE_LABEL: Record<Source, string> = {
  wechat: '微信推文',
  gitee: 'Gitee',
  other: '外部链接',
};

// 上游仓库与 PR 的基准分支（表单生成的片段最终要合入这里）
const UPSTREAM_REPO = 'TSGU-OSC/website';
const UPSTREAM_BRANCH = 'master';

// GitHub 编辑链接自带身份分流：未 Fork 引导创建 Fork，已 Fork 自动在自己的
// Fork 中编辑，仓库成员则提示新建分支发 PR —— 一条链接覆盖所有提交者
const GITHUB_EDIT_URL = `https://github.com/${UPSTREAM_REPO}/edit/${UPSTREAM_BRANCH}/announcements.md`;
// 本地预览时 master 上还没有 announcements.md（要随本功能 PR 合入），
// 链接切到功能分支，否则 404
const GITHUB_EDIT_URL_PREVIEW =
  'https://github.com/TSGU-OSC/website/edit/new_page/announcements.md';

// GitHub 用户名规则：1-39 位，字母数字开头/结尾，中间允许单个连字符
const GITHUB_USER_RE = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;
// URL 快速预检（真正的有效性交给 isValidHttpUrl 里的 new URL 判定）
// 带 i 标志：用户粘贴 HTTPS:// 这类大写协议也应视为合法
const URL_RE = /^https?:\/\/\S+$/i;

// ---------- 日期解析（规则与 scripts/gen-announcements.mjs 完全一致） ----------

// 单个日期：2024.9.27 / 2024-9-27 / 2024/9/27 / 2023年6月25日
const DATE_TOKEN = /(\d{4})\s*[.\-/年]\s*(\d{1,2})\s*[.\-/月]\s*(\d{1,2})\s*日?/g;
// 日期之间允许的分隔符
const RANGE_SEP = /^[-~至到/]*$/;

/** 校验为真实存在的日历日期，返回时间戳；非法返回 null */
function toTime(y: number, mo: number, d: number): number | null {
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
 *
 * 与 gen-announcements.mjs 的同名函数逐条对齐：日期必须是真实日历日，
 * 去掉日期后只允许剩余区间分隔符，最多两个日期且结束不早于开始。
 */
function parseDateExpr(text: string): { start: number; end: number } | null {
  const s = text.trim();
  if (!s) return null;

  const tokens: number[] = [];
  DATE_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DATE_TOKEN.exec(s)) !== null) {
    const t = toTime(Number(m[1]), Number(m[2]), Number(m[3]));
    if (t === null) return null;
    tokens.push(t);
  }
  if (tokens.length === 0 || tokens.length > 2) return null;

  // 去掉日期后只允许剩余分隔符，防止把无关文字当成日期
  DATE_TOKEN.lastIndex = 0;
  if (!RANGE_SEP.test(s.replace(DATE_TOKEN, '').replace(/\s+/g, ''))) {
    return null;
  }

  const start = tokens[0];
  const end = tokens.length === 2 ? tokens[1] : start;
  if (end < start) return null;
  return { start, end };
}

/**
 * 校验链接是否为可用的 http(s) 站点地址。
 * 先用正则快速预检，避免对每个按键都构造 URL 对象；通过后再交给标准
 * URL 解析器判断协议与主机名（http://a 这类没有域名的主机不算有效站点）。
 * 只在渲染/事件中调用，不在模块顶层构造 URL（SSR 阶段也能安全执行）。
 */
function isValidHttpUrl(raw: string): boolean {
  const s = raw.trim();
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

function detectSource(url: string): Source {
  if (url.includes('mp.weixin.qq.com')) return 'wechat';
  if (url.includes('gitee.com')) return 'gitee';
  return 'other';
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

/**
 * 创建公告卡片表单页（/announcement/create）。
 *
 * 静态站没有后端，新公告必须回流到仓库：
 * 表单生成标准 Markdown 片段，提交者 Fork 仓库后粘贴到
 * 根目录 announcements.md 末尾，再向官方仓库发起 PR；
 * 合并后 prebuild 钩子会自动把它同步进首页卡片与公告页。
 */
export default function CreateAnnouncement() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr());
  const [copied, setCopied] = useState(false);
  const [editUrl, setEditUrl] = useState(GITHUB_EDIT_URL);
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [ghUser, setGhUser] = useState('');
  const [forkState, setForkState] = useState<ForkState>('idle');
  // Fork 的默认分支（来自 API，不硬编码 master）与本次检测的错误文案
  const [forkBranch, setForkBranch] = useState(UPSTREAM_BRANCH);
  const [forkError, setForkError] = useState('');

  useEffect(() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      setEditUrl(GITHUB_EDIT_URL_PREVIEW);
      setIsLocalPreview(true);
    }
  }, []);

  // 免鉴权 GitHub API（60 次/小时/IP）：检测提交者是否已有 Fork，
  // 并确认这个 Fork 确实是 TSGU-OSC/website 的 Fork、且已包含 announcements.md
  const checkFork = async (): Promise<void> => {
    const u = ghUser.trim();
    if (!u || forkState === 'checking') return;

    // 用户名不合法就不发请求，直接提示
    if (!GITHUB_USER_RE.test(u)) {
      setForkError(
        'GitHub 用户名格式不正确（1-39 位，仅字母、数字与单个连字符，不能以连字符开头或结尾）'
      );
      setForkState('error');
      return;
    }

    setForkState('checking');
    setForkError('');

    try {
      const res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(u)}/website`
      );

      // 区分限流：403 + x-ratelimit-remaining: 0 说明是配额耗尽，不是仓库不存在
      if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
        setForkError('GitHub API 已限流（每小时 60 次），请稍后再试');
        setForkState('error');
        return;
      }
      if (res.status === 404) {
        setForkState('none');
        return;
      }
      if (!res.ok) {
        setForkError('检测失败（网络或 API 异常），不影响正常提交');
        setForkState('error');
        return;
      }

      const data = (await res.json()) as {
        fork?: boolean;
        default_branch?: string;
        parent?: { full_name?: string };
        source?: { full_name?: string };
      };
      // 仓库存在还不够，必须确认它确实 Fork 自本项目：
      // 直接 Fork 时 parent 是上游，Fork 的 Fork 时只有 source 指向上游
      const parentName = data.parent?.full_name;
      const sourceName = data.source?.full_name;
      if (parentName !== UPSTREAM_REPO && sourceName !== UPSTREAM_REPO) {
        setForkState('wrong');
        return;
      }

      const branch: string =
        typeof data.default_branch === 'string' && data.default_branch
          ? data.default_branch
          : UPSTREAM_BRANCH;
      setForkBranch(branch);

      // 再确认 Fork 里已经有 announcements.md：Fork 落后时编辑页会 404
      const fileRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(u)}/website/contents/announcements.md?ref=${encodeURIComponent(branch)}`
      );
      if (fileRes.status === 404) {
        setForkState('stale');
        return;
      }
      if (
        fileRes.status === 403 &&
        fileRes.headers.get('x-ratelimit-remaining') === '0'
      ) {
        setForkError('GitHub API 已限流（每小时 60 次），请稍后再试');
        setForkState('error');
        return;
      }
      // 文件检查因其它原因失败时不拦用户（Fork 本身有效），仍按 exists 处理
      setForkState('exists');
    } catch {
      setForkError('检测失败（网络或 API 异常），不影响正常提交');
      setForkState('error');
    }
  };

  const user = ghUser.trim();
  const userForkBranch = forkBranch || UPSTREAM_BRANCH;
  const userForkEditUrl = `https://github.com/${user}/website/edit/${userForkBranch}/announcements.md`;
  // Fork 落后时的同步页：Sync fork 后编辑页才有 announcements.md
  const userForkSyncUrl = `https://github.com/${user}/website/sync`;
  // 手动创建 PR / Compare & pull request 直达链接（base 为上游分支）
  const compareUrl = `https://github.com/${UPSTREAM_REPO}/compare/${UPSTREAM_BRANCH}...${user}:${userForkBranch}`;

  // 已检测到 Fork → 直达本人 Fork 编辑页（仓库成员也走这里）；
  // Fork 落后 → 先去 Sync；未检测/无 Fork → 上游编辑链接（GitHub 自动引导建 Fork）
  const submitUrl =
    forkState === 'exists'
      ? userForkEditUrl
      : forkState === 'stale'
        ? userForkSyncUrl
        : editUrl;
  const submitLabel =
    forkState === 'exists'
      ? '在我的 Fork 中编辑 →'
      : forkState === 'stale'
        ? '先 Sync 我的 Fork →'
        : '去 GitHub 提交 →';

  const urlValid = isValidHttpUrl(url);
  const dateText = date.trim();
  const dateRange = parseDateExpr(dateText);
  const dateValid = dateRange !== null;
  const ready = urlValid && title.trim().length > 0 && dateValid;
  const source = detectSource(url.trim());
  const snippet = `### [${title.trim() || '卡片标题'}：${dateText}](${url.trim() || 'https://…'})`;

  const copySnippet = async () => {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      // 剪贴板 API 不可用时的兜底
      const ta = document.createElement('textarea');
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ca-wrap">
      <div className="ca-body">
        {/* 左：表单 */}
        <div className="ca-form">
          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-url">
              原文链接 <span className="ca-req">*必填</span>
            </label>
            <input
              id="ca-url"
              className="ca-input"
              type="url"
              placeholder="https://mp.weixin.qq.com/s/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="ca-help">支持微信公众号 / Gitee 链接，粘贴后自动识别来源</p>
            {url.trim() !== '' && !urlValid && (
              <p className="ca-error">
                链接格式不正确，需要以 http:// 或 https:// 开头，且包含有效域名
              </p>
            )}
          </div>

          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-title">
              卡片标题 <span className="ca-req">*必填</span>
            </label>
            <input
              id="ca-title"
              className="ca-input"
              type="text"
              placeholder="例如：开源鸿蒙社2026春季纳新正式启动"
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-date">
              发布日期
            </label>
            <input
              id="ca-date"
              className="ca-input"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="ca-help">默认今天，格式如 2026.9.30，时间范围可写 2026.9.30 - 2026.10.2</p>
            {dateText !== '' && !dateValid && (
              <p className="ca-error">
                日期不合法：需为真实存在的日期，如 2026.9.30 或 2026.9.21 - 2026.9.22
              </p>
            )}
          </div>

          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-ghuser">
              GitHub 用户名
            </label>
            <div className="ca-ghuser-row">
              <input
                id="ca-ghuser"
                className="ca-input"
                type="text"
                placeholder="你的 GitHub 用户名"
                value={ghUser}
                onChange={(e) => {
                  setGhUser(e.target.value);
                  setForkState('idle');
                  setForkError('');
                  setForkBranch(UPSTREAM_BRANCH);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    checkFork();
                  }
                }}
              />
              <button
                className="ca-btn-check"
                disabled={!ghUser.trim() || forkState === 'checking'}
                onClick={checkFork}
              >
                {forkState === 'checking' ? '检测中…' : '检测我的 Fork'}
              </button>
            </div>
            <p className="ca-help">
              所有人（包括仓库管理者）都通过自己的 Fork 提交，保持官方仓库历史干净
            </p>
            {forkState === 'exists' && (
              <p className="ca-fork-ok">
                ✓ 已找到你的 Fork：{user}/website（默认分支{' '}
                <code>{userForkBranch}</code>，其中已有 announcements.md），可直接编辑
              </p>
            )}
            {forkState === 'stale' && (
              <p className="ca-fork-stale">
                你的 Fork 还没有该文件，请先{' '}
                <a href={userForkSyncUrl} target="_blank" rel="noopener noreferrer">
                  Sync fork
                </a>{' '}
                同步最新代码后再编辑
              </p>
            )}
            {forkState === 'none' && (
              <p className="ca-fork-none">
                未找到你的 Fork——点下方「去 GitHub 提交」，GitHub 会自动引导你一键创建
              </p>
            )}
            {forkState === 'wrong' && (
              <p className="ca-error">
                该仓库不是本项目的 Fork（应为 <code>{UPSTREAM_REPO}</code>{' '}
                的 Fork），请检查用户名或重新 Fork
              </p>
            )}
            {forkState === 'error' && (
              <p className="ca-error">{forkError || '检测失败（网络或 API 异常），不影响正常提交'}</p>
            )}
          </div>

          <div className="ca-actions">
            <button
              className="ca-btn-primary"
              disabled={!ready}
              onClick={copySnippet}
            >
              {copied ? '✓ 已复制' : '复制 Markdown 片段'}
            </button>
            <a
              className="ca-btn-secondary"
              href={submitUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {submitLabel}
            </a>
            {/* Fork 确认存在时才给 PR 直达链接，避免把用户带到空对比页 */}
            {forkState === 'exists' && (
              <a
                className="ca-btn-secondary"
                href={compareUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Compare &amp; pull request →
              </a>
            )}
          </div>

          {isLocalPreview && (
            <p className="ca-preview-note">
              本地预览模式：提交链接已指向 <code>new_page</code> 分支
              （<code>announcements.md</code> 还未合入 master，正式上线后自动指回 master）
            </p>
          )}

          <ol className="ca-steps">
            <li>点击「复制 Markdown 片段」</li>
            <li>
              填写 GitHub 用户名并「检测我的 Fork」：已 Fork 过会直达
              <strong>你自己 Fork</strong> 的编辑页；没 Fork 过会自动引导你一键创建
            </li>
            <li>
              在编辑器里把片段<strong>粘贴到文件末尾</strong>，点击
              <strong> Commit changes</strong>
            </li>
            <li>
              GitHub 通常会自动跳转到 PR 页面，确认目标是{' '}
              <code>{UPSTREAM_REPO}</code> 的 <code>{UPSTREAM_BRANCH}</code>，提交即可
            </li>
            <li>
              若 Commit 后没有自动跳转到 PR 页面，可手动创建 PR：打开{' '}
              <code>TSGU-OSC/website</code> 的 Compare 页面，选择你自己的分支作为
              compare 分支、<code>{UPSTREAM_BRANCH}</code> 作为 base 分支
              {forkState === 'exists' && (
                <>
                  ，或直接点{' '}
                  <a href={compareUrl} target="_blank" rel="noopener noreferrer">
                    手动创建 PR
                  </a>
                </>
              )}
            </li>
          </ol>

          <p className="ca-member-link">
            包括仓库管理者在内，所有人都通过自己的 Fork 提交 PR，官方仓库历史保持干净。
          </p>
        </div>

        {/* 右：实时预览 */}
        <div className="ca-side">
          <span className="ca-side-label">卡片实时预览</span>
          <a
            className={`ann-card ca-preview${ready ? '' : ' ca-preview-empty'}`}
            href={ready ? url.trim() : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!ready) e.preventDefault();
            }}
          >
            <div className="ann-card-top">
              <span className="ann-date">{dateText || '日期'}</span>
              <span className={`ann-badge ann-badge-${source}`}>
                {SOURCE_LABEL[source]}
              </span>
            </div>
            <h3 className="ann-card-title">
              {title.trim() || '在左侧填写标题后，这里会实时更新'}
            </h3>
            <div className="ann-card-foot">
              <span className="ann-readmore">阅读原文</span>
              <span className="ann-external" aria-hidden="true">↗</span>
            </div>
          </a>

          <span className="ca-side-label">生成的 Markdown 片段</span>
          <pre className="ca-snippet">
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
