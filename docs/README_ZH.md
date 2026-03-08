<p align="center">
  <img src="../public/icon.png" width="128" height="128" alt="ScriptPlayer+ 图标">
</p>

<h1 align="center">ScriptPlayer+</h1>

<p align="center">
  集成 <b>The Handy</b> 设备、<b>EroScripts</b> 浏览器登录和多语言支持的现代 Funscript 视频播放器
</p>

<p align="center">
  <a href="../README.md">English</a> · <a href="README_KO.md">한국어</a> · <a href="README_JA.md">日本語</a> · <a href="README_ZH.md">中文</a>
</p>

---

## 截图

| Windows | macOS |
|:-:|:-:|
| ![Windows](screenshots/playing_mode1.png) | ![macOS](screenshots/macos.png) |

| 热力图和时间线 | Handy 连接 |
|:-:|:-:|
| ![热力图](screenshots/heatmap.png) | ![Handy](screenshots/handy_connect.png) |

| EroScripts 搜索 | 设置 |
|:-:|:-:|
| ![脚本](screenshots/scripts_search.png) | ![设置](screenshots/setting.png) |

## 主要功能

- **视频播放器** — 播放本地视频文件（MP4、MKV、AVI、WebM、MOV、WMV）
- **Funscript 支持** — 自动加载与视频同名的 `.funscript` 文件
- **时间线可视化** — 按速度颜色实时显示脚本动作点
- **热力图** — 全视频强度的颜色可视化（绿→黄→橙→红→紫）
- **The Handy 集成** — 通过 HSSP 协议与 The Handy 设备同步
  - 自动连接和连接历史
  - 脚本自动上传
  - 时间偏移调整
  - 行程范围自定义
- **EroScripts 集成** — 通过应用内浏览器登录搜索和下载 Funscript（无需 API 密钥）
- **多语言** — English、한국어、日本語、中文
- **拖放** — 直接将视频文件拖入播放器
- **文件夹浏览器** — 子文件夹分组和脚本检测（绿色对勾）
- **键盘快捷键** — Space、方向键、F（全屏）、M（静音）等
- **跨平台** — Windows（独立版）和 macOS（通过 GitHub Actions）

## 安装

### Windows

1. 从 [Releases](https://github.com/sioaeko/scriptplayer-plus/releases) 下载最新版本
2. 解压后运行 `ScriptPlayerPlus.exe` — 无需安装

### macOS

1. 从 [Releases](https://github.com/sioaeko/scriptplayer-plus/releases) 下载 `ScriptPlayerPlus-1.0.0-MacOS-Universal.zip`
2. 解压后将 `ScriptPlayerPlus.app` 移动到 Applications 文件夹

### 从源码构建

```bash
git clone https://github.com/sioaeko/scriptplayer-plus.git
cd scriptplayer-plus
npm install
```

**开发模式：**
```bash
npm run electron:dev
```

**构建 Windows：**
```bash
npm run build:win
```

**构建 macOS**（需要 macOS）：
```bash
npm run build:mac
```

## 键盘快捷键

| 按键 | 操作 |
|------|------|
| `Space` / `K` | 播放 / 暂停 |
| `←` / `→` | 快进/快退 ±5秒 |
| `Shift + ←/→` | 快进/快退 ±10秒 |
| `↑` / `↓` | 音量 ±5% |
| `F` | 切换全屏 |
| `M` | 切换静音 |
| `Ctrl + ,` | 打开设置 |

## 技术栈

- **Electron** — 桌面应用框架
- **React** + **TypeScript** — UI 组件
- **Tailwind CSS** — 样式
- **Vite** — 构建工具
- **Handy API v2** — 设备通信
- **Discourse API** — EroScripts 集成

## 许可证

MIT

---

<p align="center">
  使用 Electron、React 和 Tailwind CSS 构建
</p>
