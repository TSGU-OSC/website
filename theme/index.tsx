import Theme from 'rspress/theme';
import { useLang } from 'rspress/runtime';
import AnnouncementCards from '../docs/components/AnnouncementCards';

// 在首页 features 区块之后插入公告卡片区（仅中文站点）
const HomeLayout = () => {
  const lang = useLang();
  return (
    <Theme.HomeLayout
      afterFeatures={lang === 'zh' ? <AnnouncementCards /> : null}
    />
  );
};

export default {
  ...Theme,
  HomeLayout,
};

export * from 'rspress/theme';
