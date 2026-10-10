import { useEffect, useState } from 'react';
import './AnnouncementCards.css';
import './CreateAnnouncement.css';

type Source = 'wechat' | 'gitee' | 'other';

const SOURCE_LABEL: Record<Source, string> = {
  wechat: '微信推文',
  gitee: 'Gitee',
  other: '外部链接',
};

// GitHub 编辑链接自带身份分流：未 Fork 引导创建 Fork，已 Fork 自动在自己的
// Fork 中编辑，仓库成员则提示新建分支发 PR —— 一条链接覆盖所有提交者
const GITHUB_EDIT_URL =
  'https://github.com/TSGU-OSC/website/edit/master/announcements.md';
// 本地预览时 master 上还没有 announcements.md（要随本功能 PR 合入），
// 链接切到功能分支，否则 404
const GITHUB_EDIT_URL_PREVIEW =
  'https://github.com/TSGU-OSC/website/edit/new_page/announcements.md';

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
  const [forkState, setForkState] = useState<
    'idle' | 'checking' | 'exists' | 'none' | 'error'
  >('idle');

  useEffect(() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      setEditUrl(GITHUB_EDIT_URL_PREVIEW);
      setIsLocalPreview(true);
    }
  }, []);

  // 免鉴权 GitHub API（60 次/小时/IP）：检测提交者是否已有 Fork
  const checkFork = async () => {
    const u = ghUser.trim();
    if (!u || forkState === 'checking') return;
    setForkState('checking');
    try {
      const res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(u)}/website`
      );
      if (res.ok) {
        const data = await res.json();
        setForkState(data.fork ? 'exists' : 'none');
      } else if (res.status === 404) {
        setForkState('none');
      } else {
        setForkState('error');
      }
    } catch {
      setForkState('error');
    }
  };

  const userForkEditUrl = `https://github.com/${ghUser.trim()}/website/edit/master/announcements.md`;
  // 已检测到 Fork → 直达本人 Fork 编辑页（仓库成员也走这里）；
  // 未检测/无 Fork → 上游编辑链接（GitHub 自动引导建 Fork）
  const submitUrl = forkState === 'exists' ? userForkEditUrl : editUrl;
  const submitLabel =
    forkState === 'exists' ? '在我的 Fork 中编辑 →' : '去 GitHub 提交 →';

  const urlValid = /^https?:\/\/\S+$/.test(url.trim());
  const ready = urlValid && title.trim().length > 0 && date.trim().length > 0;
  const source = detectSource(url.trim());
  const snippet = `### [${title.trim() || '卡片标题'}：${date.trim()}](${url.trim() || 'https://…'})`;

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
              <p className="ca-error">链接格式不正确，需要以 http:// 或 https:// 开头</p>
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
                ✓ 已找到你的 Fork：{ghUser.trim()}/website。若编辑时提示文件不存在，
                请先在你的 Fork 页面点 <strong>Sync fork</strong> 同步最新代码
              </p>
            )}
            {forkState === 'none' && (
              <p className="ca-fork-none">
                未找到你的 Fork——点下方「去 GitHub 提交」，GitHub 会自动引导你一键创建
              </p>
            )}
            {forkState === 'error' && (
              <p className="ca-error">检测失败（网络或 API 限流），不影响正常提交</p>
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
              GitHub 会自动跳转到 PR 页面，确认目标是{' '}
              <code>TSGU-OSC/website</code> 的 <code>master</code>，提交即可
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
              <span className="ann-date">{date.trim() || '日期'}</span>
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
