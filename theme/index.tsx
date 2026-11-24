import Theme from 'rspress/theme';
import { useEffect, type ComponentProps } from 'react';
import { useLang } from 'rspress/runtime';
import AnnouncementCards from '../docs/components/AnnouncementCards';

// 英文站已收敛为一个概览页，所有英文入口最终都回这里
const EN_HOME = '/en/';
// Rspress 给站内链接自动加的语言前缀（/content/ → /en/content/）
const EN_PREFIX = /^\/en(?=\/)/;

/**
 * 英文站只剩 /en/ 一个页面，Rspress 的默认行为会带来两类死链：
 *
 * 1. 语言切换器按「同路径换语言前缀」生成链接（/guide/... → /en/guide/...）；
 * 2. 首页 hero 按钮里的站内相对路径会被自动套上语言前缀
 *    （/content/ → /en/content/），而英文站已没有这些页面。
 *
 * 这里在客户端把前缀摘掉：切换器统一回 /en/，hero 按钮回到中文页。
 * 用 MutationObserver 而不是只跑一次：切换器是下拉菜单，路由变化时会重新渲染。
 */
function useEnglishSiteFixes() {
  useEffect(() => {
    const isHeroButton = (el: Element) => el.className.includes('button_');

    const fixHrefs = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/en/"]').forEach((a) => {
        const href = a.getAttribute('href') || '';

        // hero 按钮：摘掉语言前缀回到中文页。
        // 改 DOM 只覆盖「新标签页 / 复制链接」这类默认行为。
        if (isHeroButton(a)) {
          const stripped = href.replace(EN_PREFIX, '');
          if (stripped !== href) a.setAttribute('href', stripped);
          return;
        }

        // 语言切换器：英文子页已删除，一律回概览页
        if (href !== EN_HOME) a.setAttribute('href', EN_HOME);
      });
    };

    fixHrefs();
    const observer = new MutationObserver(fixHrefs);
    observer.observe(document.body, { childList: true, subtree: true });

    /**
     * 普通点击走的是主题的 <Link>（React Router），它内部仍持有渲染时带 /en 的地址，
     * 只改 DOM 属性不会改变导航目标，所以在捕获阶段拦下来自己整页跳转。
     */
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (!window.location.pathname.startsWith('/en')) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.('a');
      if (!anchor || !isHeroButton(anchor)) return;

      const href = (anchor.getAttribute('href') || '/').replace(EN_PREFIX, '');
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(href || '/');
    };
    document.addEventListener('click', onClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
    };
  }, []);
}

// 在首页 features 区块之后插入公告卡片区（仅中文站点）
const HomeLayout = () => {
  const lang = useLang();
  useEnglishSiteFixes();
  return (
    <Theme.HomeLayout
      afterFeatures={lang === 'zh' ? <AnnouncementCards /> : null}
    />
  );
};

// 文档页同样挂一次：带导航栏的页面都有语言切换器
const Layout = (props: ComponentProps<typeof Theme.Layout>) => {
  useEnglishSiteFixes();
  return <Theme.Layout {...props} />;
};

/**
 * 自定义 404。英文站删掉子页后，旧 /en/... 地址会落到这里，
 * 沿用主题默认的居中版式，补一行中英双语出口。
 */
function NotFoundLayout() {
  return (
    <div className="m-auto mt-50 p-16 sm:p-8 sm:pt-24 sm:pb-40 text-center flex-center flex-col">
      <p className="text-6xl font-semibold">404</p>
      <h1 className="leading-5 pt-3 text-xl font-bold">PAGE NOT FOUND</h1>
      <div
        className="mt-6 mx-auto mb-4.5 w-16 bg-gray-light-1"
        style={{ height: '1px' }}
      />
      <p className="pt-5 text-sm">
        Looking for the English overview?{' '}
        <a className="text-brand" href={EN_HOME}>
          English
        </a>
      </p>
      <p className="text-sm">
        中文内容请回首页：
        <a className="text-brand" href="/">
          返回中文站
        </a>
      </p>
    </div>
  );
}

export default {
  ...Theme,
  HomeLayout,
  Layout,
  NotFoundLayout,
};

export * from 'rspress/theme';
