import { useEffect } from 'react';

const CARD_CLASS = 'osc-search-in';
const ROOT_CLASS = 'osc-search-root-in';

// 排查开关：地址栏加 ?oscdebug=1 时向控制台打点，便于定位"没抓到 / 没生效"
const DEBUG =
  typeof location !== 'undefined' &&
  new URLSearchParams(location.search).has('oscdebug');
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[SearchPop]', ...args);
};

const isSearchInput = (el: HTMLInputElement) => {
  if (['checkbox', 'radio', 'button', 'submit', 'file'].includes(el.type)) return false;
  const ph = el.placeholder || '';
  return /搜索|search|查询|find/i.test(ph);
};

/**
 * 搜索弹窗弹出动画（Apple sheet：damping 0.8 / response ≈0.3s，轻微过冲）。
 *
 * 弹窗的类名被 CSS Modules 哈希，无法用 CSS 选，所以走运行时探测：
 * 1. MutationObserver 抓新挂载的弹层（最可靠），focusin 作为兜底；
 * 2. 遮罩 = 覆盖全屏的祖先（或 role=dialog / aria-modal 元素），只做淡入；
 * 3. 卡片 = 遮罩内第一个非全屏的容器，做缩放上浮；
 * 4. transform-origin 换算成相对卡片自身盒子，让弹窗从点击处放大；
 * 5. 动画结束后清掉标记，保证下次打开还能再放一次（DOM 被复用的情况）。
 */
export function SearchPop() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      log('已关闭：系统偏好减弱动效');
      return;
    }
    log('监听已启动');

    let lastPoint = { x: window.innerWidth / 2, y: 72 };
    window.addEventListener(
      'pointerdown',
      (e) => {
        lastPoint = { x: e.clientX, y: e.clientY };
      },
      true
    );

    const mark = (
      el: HTMLElement,
      cls: string,
      originX: number,
      originY: number,
      key: string
    ) => {
      el.style.transformOrigin = `${originX}px ${originY}px`;
      el.classList.add(cls);
      log('动画已挂载', cls, el.className, 'origin=', originX, originY);
      const done = (ev: AnimationEvent) => {
        if (!ev.animationName.startsWith('osc-search')) return;
        el.classList.remove(cls);
        el.style.transformOrigin = '';
        delete el.dataset[key];
        el.removeEventListener('animationend', done);
      };
      el.addEventListener('animationend', done);
    };

    const animate = (input: HTMLInputElement) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // 遮罩：优先语义标记，其次按几何（覆盖全屏）找
      const semantic = input.closest('[role="dialog"], [aria-modal="true"]') as HTMLElement | null;
      let mask: HTMLElement | null = semantic;
      if (!mask) {
        let node: HTMLElement | null = input.parentElement;
        while (node && node !== document.body) {
          const r = node.getBoundingClientRect();
          if (r.width >= vw * 0.9 && r.height >= vh * 0.6) {
            mask = node;
            break;
          }
          node = node.parentElement;
        }
      }
      if (!mask) mask = input.parentElement;
      if (!mask || mask === document.body) return;
      if (mask.dataset.oscPop === '1') return;
      mask.dataset.oscPop = '1';

      const maskRect = mask.getBoundingClientRect();
      mark(
        mask,
        ROOT_CLASS,
        lastPoint.x - maskRect.left,
        lastPoint.y - maskRect.top,
        'oscPop'
      );

      // 卡片：Rspress 的弹层结构是 mask > modal > ... > input，
      // 所以直接取遮罩的第一个子元素，别按宽度猜（会命中输入框那一行）
      let card: HTMLElement | null = mask.firstElementChild as HTMLElement | null;
      if (!card || card.getBoundingClientRect().width >= vw * 0.92) {
        // 兜底：从 input 向上找第一个宽度明显小于视口的容器
        card = input.parentElement;
        while (card && card !== mask && card.getBoundingClientRect().width >= vw * 0.92) {
          card = card.parentElement;
        }
      }
      if (card && card !== mask && card.dataset.oscCard !== '1') {
        card.dataset.oscCard = '1';
        const cardRect = card.getBoundingClientRect();
        mark(
          card,
          CARD_CLASS,
          lastPoint.x - cardRect.left,
          lastPoint.y - cardRect.top,
          'oscCard'
        );
      }
    };

    const observer = new MutationObserver((records) => {
      for (const rec of records) {
        for (const node of Array.from(rec.addedNodes)) {
          if (node.nodeType !== 1) continue;
          const el = node as HTMLElement;
          const self = el instanceof HTMLInputElement ? el : null;
          const found =
            (self && isSearchInput(self)) ||
            (Array.from(el.querySelectorAll('input')) as HTMLInputElement[]).find(isSearchInput);
          if (found) {
            requestAnimationFrame(() => animate(found));
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t instanceof HTMLInputElement && isSearchInput(t)) {
        requestAnimationFrame(() => animate(t));
      }
    };
    document.addEventListener('focusin', onFocusIn, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', onFocusIn, true);
    };
  }, []);

  return null;
}
