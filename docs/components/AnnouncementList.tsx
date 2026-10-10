import { useEffect, useRef } from 'react';
import items from './announcements.json';
import './AnnouncementCards.css';
import './AnnouncementList.css';

interface Announcement {
  title: string;
  date: string;
  url: string | null;
  source: 'wechat' | 'gitee' | 'other' | 'milestone';
}

const SOURCE_LABEL: Record<Announcement['source'], string> = {
  wechat: '微信推文',
  gitee: 'Gitee',
  other: '外部链接',
  milestone: '里程碑',
};

function yearOf(date: string): string {
  const m = date.match(/^(\d{4})/);
  return m ? m[1] : '更早';
}

function Card({ item, order }: { item: Announcement; order: number }) {
  const inner = (
    <>
      <div className="ann-card-top">
        {item.date && <span className="ann-date">{item.date}</span>}
        <span className={`ann-badge ann-badge-${item.source}`}>
          {SOURCE_LABEL[item.source]}
        </span>
      </div>
      <h3 className="ann-card-title">{item.title}</h3>
      <div className="ann-card-foot">
        <span className="ann-readmore">
          {item.url ? '阅读原文' : '社团里程碑'}
        </span>
        {item.url && (
          <span className="ann-external" aria-hidden="true">↗</span>
        )}
      </div>
    </>
  );

  const style = { ['--ann-i' as string]: order };

  return item.url ? (
    <a
      className="ann-card"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
    >
      {inner}
    </a>
  ) : (
    <div className="ann-card ann-card-static" style={style}>
      {inner}
    </div>
  );
}

/**
 * 公告页全量卡片墙。
 * - 展示 announcements.json 全部条目，按年份分组（新→旧）
 * - 有链接的渲染为可跳转卡片，无链接的里程碑渲染为静态卡片
 * - 每个年份分组滚动进入视口时，卡片依次 blur-fade 浮入
 *   （animate-ui 同款效果，纯 CSS 实现，无额外依赖）
 */
export default function AnnouncementList() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      root?.querySelectorAll('.al-year-group').forEach((g) => g.classList.add('al-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('al-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    root.querySelectorAll('.al-year-group').forEach((g) => io.observe(g));
    return () => io.disconnect();
  }, []);

  // 按年份分组，保持新→旧顺序；组内序号用于动画交错（封顶 12 张）
  const groups: { year: string; list: Announcement[] }[] = [];
  (items as Announcement[]).forEach((it) => {
    const y = yearOf(it.date);
    const g = groups.find((g) => g.year === y);
    if (g) g.list.push(it);
    else groups.push({ year: y, list: [it] });
  });

  return (
    <div className="al-list" ref={rootRef}>
      {groups.map((g) => (
        <section className="al-year-group" key={g.year}>
          <h2 className="al-year">
            <span className="al-year-num">{g.year}</span>
            <span className="al-year-count">{g.list.length} 条</span>
          </h2>
          <div className="ann-grid">
            {g.list.map((item, i) => (
              <Card key={item.url ?? `${item.title}-${i}`} item={item} order={i % 12} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
