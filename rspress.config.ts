import * as path from 'path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'rspress/config';
import { LastUpdated } from 'rspress/theme';
import rspressPluginAlignImage from 'rspress-plugin-align-image';
import { parseAnnouncements } from './docs/components/announcements-core.mjs';

/**
 * 构建期读取根目录 announcements.md 并解析成公告数组。
 *
 * 这里取代了原来「predev/prebuild 生成 docs/components/announcements.json」的做法：
 * 仓库里只有 md 这一个数据源，不再有任何需要提交或清理的中间产物。
 * 解析出的数据通过 builderConfig.source.define 注入前端，组件直接读 __ANNOUNCEMENTS__。
 *
 * 解析失败直接抛错，让 dev / build 立刻停下来——坏数据不会静默上线。
 */
function loadAnnouncements() {
  const source = path.join(__dirname, 'announcements.md');
  let md: string;
  try {
    md = readFileSync(source, 'utf-8');
  } catch {
    throw new Error(
      `[announcements] 找不到公告源文件：${source}\n` +
        '请在仓库根目录创建 announcements.md，每行一条公告，例如：\n' +
        '  ### [公告标题：2024.9.27](https://mp.weixin.qq.com/s/xxxx)\n' +
        '  ### 里程碑标题：2023.6.25'
    );
  }

  const { items, errors, warnings } = parseAnnouncements(md);

  for (const w of warnings) {
    console.warn(`[announcements] 警告 第 ${w.line} 行：${w.msg}`);
  }

  if (errors.length > 0) {
    const detail = errors
      .map((e) => `  第 ${e.line} 行：${e.msg}`)
      .join('\n');
    throw new Error(
      `[announcements] announcements.md 有 ${errors.length} 处错误，已中止构建：\n${detail}`
    );
  }

  return items;
}

const announcements = loadAnnouncements();

export default defineConfig({
  builderConfig: {
    source: {
      define: {
        __ANNOUNCEMENTS__: JSON.stringify(announcements),
      },
    },
  },
  // base: '/website/',
  ssg:true,
  // route: {
  //   cleanUrls: true,
  // },
  lang: 'zh',
  publicPath:'./',
  // 少量主题层面的微调（首屏按钮留白），见 theme/styles.css
  globalStyles: path.join(__dirname, 'theme/styles.css'),
  // locales 为一个对象数组
  locales: [
    {
      lang: 'en',
      // 导航栏切换语言的标签
      label: 'English',
      title: 'TSGU-OSC',
      description: 'Open Source Harmony Community at TSGUAS',
    },
    {
      lang: 'zh',
      // 导航栏切换语言的标签
      label: '简体中文',
      title: '开源鸿蒙社',
      description: '开源鸿蒙社官网',
    },
  ],
  themeConfig: {
    sourceCodeText: 'Source',
    enableScrollToTop: true,
    enableContentAnimation: true,
    lastUpdated: true,
    hideNavbar: 'never',
    footer: {
      message: '开源鸿蒙社 版权所有   All rights reserved by TSGU-OSC',
    },
    locales: [
      {
        lang: 'en',
        title: "TSGU-OSC",
        outlineTitle: 'ON THIS Page',
        lastUpdatedText: 'Last Updated',
        searchPlaceholderText: 'Search Docs',
        description: 'Open Source Harmony Community at TSGUAS',
        label: ''
      },
      {
        lang: 'zh',
        title: "开源鸿蒙社",
        outlineTitle: '大纲',
        lastUpdatedText: '最后更新时间',
        searchPlaceholderText: '搜索',
        description: '开源鸿蒙社',
        label: ''
      },
    ],
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/TSGU-OSC' },
      { icon: {
        svg: '<svg t="1708355640791" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1446" width="24" height="24"><path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z" fill="#C71D23" p-id="1447"></path></svg>'
      }, mode: 'link', content: 'https://gitee.com/TSGU-OSC' },
      // {
      //   icon: 'qq',
      //   mode: 'text',
      //   content: 'QQ群：927923903',
      // },
    ],
  },
  root: path.join(__dirname, 'docs'),
  // root: 'docs',
  // title: 'OHC',
  description: 'TSGU-OSC',
  icon: '/icon-l.jpg',
  logo: {
    light: '/logo-2.png',
    dark: '/logo-4.png',
  },
  plugins:[
    rspressPluginAlignImage({
        justify:'center'
      }
    )
  ]

});
