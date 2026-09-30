import { useEffect, useRef, useState } from 'react';
import items from './announcements.json';
import './AnnouncementCards.css';

interface Announcement {
  title: string;
  date: string;
  url: string;
  source: 'wechat' | 'gitee' | 'other';
}

const SOURCE_LABEL: Record<Announcement['source'], string> = {
  wechat: '微信推文',
  gitee: 'Gitee',
  other: '外部链接',
};

/**
 * 首页公告卡片区。
 * - 数据来自 scripts/gen-announcements.mjs 生成的 announcements.json
 *   （自动同步 announcement/index.md，无需手工维护）
 * - 滚动进入视口时卡片依次浮入（IntersectionObserver + 交错延迟）
 * - prefers-reduced-motion 下直接呈现，无动画
 */
export default function AnnouncementCards({ count = 6 }: { count?: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // 不支持 IO 的老浏览器直接显示
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const list = (items as Announcement[]).slice(0, count);

  return (
    <section
      ref={sectionRef}
      className={`ann-section${revealed ? ' ann-revealed' : ''}`}
      aria-label="社团公告"
    >
      <div className="ann-header">
        <div className="ann-header-text">
          <span className="ann-eyebrow">ANNOUNCEMENTS</span>
          <h2 className="ann-title">社团公告</h2>
          <p className="ann-subtitle">社团动态与活动纪实，点击卡片查看原文</p>
        </div>
        <div className="ann-actions">
          <a className="ann-create" href="/announcement/create">
            <span aria-hidden="true">＋</span> 创建公告
          </a>
          <a className="ann-more" href="/announcement/">
            查看全部
            <span className="ann-more-arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className="ann-grid">
        {list.map((item, i) => (
          <a
            key={item.url}
            className="ann-card"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ['--ann-i' as string]: i }}
          >
            <div className="ann-card-top">
              {item.date && <span className="ann-date">{item.date}</span>}
              <span className={`ann-badge ann-badge-${item.source}`}>
                {SOURCE_LABEL[item.source]}
              </span>
            </div>
            <h3 className="ann-card-title">{item.title}</h3>
            <div className="ann-card-foot">
              <span className="ann-readmore">阅读原文</span>
              <span className="ann-external" aria-hidden="true">↗</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
