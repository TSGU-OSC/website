import Theme from 'rspress/theme';
import { MusicPlayer, ScrollProgress } from './components/MusicPlayer';
import { SearchPop } from './components/SearchPop';
import './styles.css';

// bottom 插槽位于整页最底部，挂在 Layout 层，路由切换时不会卸载，
// 所以翻页时背景音乐不会中断。ScrollProgress 是顶部阅读进度条，
// SearchPop 只负责监听事件、驱动搜索弹窗的弹出动画。
const Layout = () => (
  <Theme.Layout
    bottom={
      <>
        <ScrollProgress />
        <MusicPlayer />
        <SearchPop />
      </>
    }
  />
);

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';
