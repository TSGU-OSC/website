# TSGU-OSC Website

The community portal of the Open Source Harmony Community (TSGU-OSC), Tianjin Sino-German University of Applied Sciences.

Live: https://osc.tsguas.cn/ ｜ License: Apache-2.0

It doubles as our public face — who we are, what we have built, how to join — and as a practical handbook for members, from freshman orientation to project navigation and learning paths. The site is fully static and every page is Markdown, so a pull request is all it takes to publish.

## What is on the site

**For new students**
A six-chapter freshman guide (preface, admission, campus life, off-campus, out-of-town students, appendix) and yearly recruitment information.

**About the community**
Introduction, current and former members, a catalogue of our repositories, and the training programme with learning paths.

**Latest activity**
Announcements archived by year, with the six most recent on the homepage; each card links to the original WeChat article or event repository.

**Resources**
Technical docs ([docs.tsguas.cn](https://docs.tsguas.cn/)), our WeChat official account, and the [1024 Code Gallery](https://osc-harmony1024-gallery.pages.dev/).

## Services we used to run

Over the years the community also built a set of internal tools. Their homepage entries have been retired and most of the services are no longer running; this is a record of them:

- **Club management system** — member and announcement management back office
- **Alist / OpenList storage** — shared study materials
- **AI painting tool** — a Stable Diffusion playground for members
- **Asset management system** — statistics and visualisation for club assets
- **Minecraft server** — multiplayer server for members
- **Self-hosted GitLab** — code hosting for the community

Most of these ran on campus intranet or community-owned servers, and some went offline when servers were reclaimed or addresses changed. The code and docs are still in our repositories — anyone interested is welcome to bring them back.

## Stack

Rspress 1.36 (SSG) with custom React/TSX components, Node.js 18+, npm. The build output is plain static files and runs on any static host.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # output in doc_build/
npm run preview
```

## Contributing

- **Post an announcement**: open [`/announcement/create`](https://osc.tsguas.cn/announcement/create), fill in the title, date and link, copy the generated snippet, then follow the on-page guide to fork and open a PR.
- **Edit content**: fork, edit Markdown under `docs/zh` (English site: `docs/en`), open a PR.

Everyone, maintainers included, contributes through a fork and a pull request; `master` is protected. Announcement format, directory conventions and check commands are documented in [CONTRIBUTING.md](./CONTRIBUTING.md).

## CI and deployment

`.github/workflows/ci.yaml` runs `npm ci` + `npm run build` on Node 18 and 20 for pushes and PRs to `master`. `doc_build/` is static output — hand it to any static host.

## License

Apache-2.0, see [LICENSE](./LICENSE).
