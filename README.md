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
