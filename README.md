# 卫戍专用俄罗斯方块

一个基于 `Vite + TypeScript + Canvas 2D` 的网页端俄罗斯方块小游戏。首版默认接入项目内已有的表情包图片和 BGM，并预留 Electron 打包能力。

## 本地运行

```bash
npm install
npm run dev
```

## 构建网页版本

```bash
npm run build
```

如果你要本地模拟 GitHub Pages 的路径构建，可以这样：

```bash
node_modules/.bin/vite build --mode github-pages
```

## 运行测试

```bash
npm run test
```

## Electron 桌面壳

开发模式：

```bash
npm run electron:dev
```

构建 Windows 安装包：

```bash
npm run electron:build
```

## 公网部署

这个项目是标准的 Vite 静态站点，`npm run build` 产出的 `dist/` 可以直接部署到静态托管平台。

### 方案一：GitHub Pages

仓库里已经带好了 GitHub Pages 的自动部署工作流：

- 工作流文件：[.github/workflows/deploy-pages.yml](/D:/Project/tetris/.github/workflows/deploy-pages.yml)
- Vite 的 GitHub Pages 路径配置在 [vite.config.ts](/D:/Project/tetris/vite.config.ts)

首次启用时，你只需要在 GitHub 仓库里做一次设置：

1. 打开仓库 `Settings`
2. 进入 `Pages`
3. 在 `Build and deployment` 里把 `Source` 设为 `GitHub Actions`
4. 确认默认分支是 `main`
5. 之后每次推送到 `main`，GitHub Actions 都会自动构建并发布

这个仓库发布后的 GitHub Pages 地址通常会是：

```text
https://pigeonry-jpg.github.io/Protocol-style-tetris/
```

说明：

- 按 Vite 官方文档，部署到 `https://<USER>.github.io/<REPO>/` 时，需要把 `base` 设成 `/<REPO>/`
- 这里我用了 `github-pages` 构建模式来只在 GitHub Pages 构建时启用仓库路径，避免影响本地开发和 Vercel

参考：

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html)
- [GitHub Docs: Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

### 方案二：Vercel

Vercel 对这个项目会更省心，通常不需要额外配置文件。

操作步骤：

1. 登录 [Vercel](https://vercel.com/)
2. 选择 `Add New Project`
3. 导入这个 GitHub 仓库 `pigeonry-jpg/Protocol-style-tetris`
4. 保持默认 Framework Preset 或选择 `Vite`
5. 构建命令填 `npm run build`
6. 输出目录填 `dist`
7. 点击 `Deploy`

Vercel 部署时本项目会使用根路径 `/`，所以不需要 GitHub Pages 那种仓库子路径。

参考：

- [Vercel Documentation](https://vercel.com/docs/)
- [Vercel deploy](https://vercel.com/docs/cli/deploy)

## 素材替换说明

### 方块图片

- 默认方块图片映射集中在 [src/config/theme.ts](/D:/Project/tetris/src/config/theme.ts)。
- 当前固定映射：
  - `I -> 表情套组_卫戍专用_call.png`
  - `O -> 表情套组_卫戍专用_cooperate.png`
  - `T -> 表情套组_卫戍专用_happy.png`
  - `S -> 表情套组_卫戍专用_respect.png`
  - `Z -> 表情套组_卫戍专用_sorry.png`
  - `J -> 表情套组_卫戍专用_thinking.png`
  - `L -> 表情套组_卫戍专用_noproblem.png`
- 更换主题时，只需要替换对应 URL 或新增一个新的 `ThemePack`。

### 音频

- BGM 默认读取项目中的 `素材/BGM/塞壬唱片-MSR; Erik Castro - Protocol.mp3`
- 页面内支持：
  - 曲目下拉选择
  - 音量滑杆调节
  - 从本地导入整个音乐文件夹
  - 从本地导入多首音频文件
- 音效默认读取 `public/assets/audio/` 下的：
  - `move.mp3`
  - `rotate.mp3`
  - `drop.mp3`
  - `clear.mp3`
  - `gameover.mp3`
- 如果这些音效文件不存在，游戏会自动静默降级，不会阻塞运行。

## 当前首版范围

- 标准 10x20 棋盘与 7 种方块
- 7-bag 随机出块
- 左右移动、旋转、软降、硬降
- 行消除、计分、等级提升
- 暂停、继续、重新开始、游戏结束提示
- 下一个方块预览
- Canvas 主题化渲染
- 屏幕按钮和键盘操作并存
- 自动暂停：双击棋盘、切出窗口、页面失焦都会暂停
- 移动端友好的单栏布局与底部图标控制区
- 行消除礼花表情特效与浮动加分提示
