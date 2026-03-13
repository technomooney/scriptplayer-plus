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

| 音频播放 + 热力图 | 音频播放 |
|:-:|:-:|
| ![音频播放 + 热力图](screenshots/VOICE_HM_TL.png) | ![音频播放](screenshots/VOICE_ASMR.png) |

| 时间线设置 | Windows 播放 |
|:-:|:-:|
| ![时间线设置](screenshots/Timeline_setting.png) | ![Windows](screenshots/playing_mode1.png) |

| 热力图和时间线 | EroScripts 搜索 |
|:-:|:-:|
| ![热力图](screenshots/heatmap.png) | ![脚本](screenshots/scripts_search.png) |

| 设置 | macOS |
|:-:|:-:|
| ![设置](screenshots/setting.png) | ![macOS](screenshots/macos.png) |

## v0.1.2 新增内容

- **音频播放支持** — 现在可以播放本地音频文件，并自动检测封面图，同时保留原有 Handy / funscript 工作流
- **时间线 / 热力图默认显示设置** — 可以在设置中决定打开带脚本的媒体时是否默认显示时间线和热力图
- **更干净的初始状态** — 新安装时，时间线和热力图默认都处于关闭状态
- **恢复自定义 Windows 图标** — 重新应用了自定义可执行文件图标和 Windows 元数据
- **播放器 UI 调整** — 版本徽标和设置界面已经根据新功能做了整理

## 主要功能

- **视频 + 音频播放器** — 播放本地视频文件（MP4、MKV、AVI、WebM、MOV、WMV）和音频文件（MP3、WAV、FLAC、M4A、AAC、OGG、OPUS、WMA）
- **音频封面检测** — 自动查找并显示同一文件夹中的专辑封面 / 插图
- **Funscript 支持** — 自动加载与媒体同名的 `.funscript` 文件
- **时间线可视化** — 按速度颜色实时显示脚本动作点
- **热力图** — 整个媒体强度的颜色可视化（绿→黄→橙→红→紫）
- **可配置默认视图** — 可以在设置中分别控制时间线和热力图是否默认开启
- **The Handy 集成** — 通过 HSSP 协议与 The Handy 设备同步
  - 自动连接和连接历史
  - 脚本自动上传
  - 时间偏移调整
  - 行程范围自定义
- **EroScripts 集成** — 通过应用内浏览器登录搜索和下载 Funscript（无需 API 密钥）
  - 登录会话保存在本地
  - 可直接下载到设置的脚本保存文件夹
- **多语言** — English、한국어、日本語、中文
- **拖放** — 直接将视频或音频文件拖入播放器
- **文件夹浏览器** — 子文件夹分组和脚本检测（绿色对勾）
- **键盘快捷键** — Space、方向键、F（全屏）、M（静音）等
- **跨平台** — Windows（独立版）和 macOS（通过 GitHub Actions）

## 安装

### Windows

1. 从 [Releases](https://github.com/sioaeko/scriptplayer-plus/releases) 下载最新的 `ScriptPlayerPlus-0.1.2-Windows-x64.zip`
2. 解压后运行 `ScriptPlayerPlus.exe` — 无需安装

### macOS

1. 从 [Releases](https://github.com/sioaeko/scriptplayer-plus/releases) 下载最新的 macOS 构建
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
