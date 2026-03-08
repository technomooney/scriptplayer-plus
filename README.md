<p align="center">
  <img src="public/icon.png" width="128" height="128" alt="ScriptPlayer+ Icon">
</p>

<h1 align="center">ScriptPlayer+</h1>

<p align="center">
  A modern funscript video player with <b>The Handy</b> integration, <b>EroScripts</b> browser login, and multi-language support.
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="docs/README_KO.md">한국어</a> · <a href="docs/README_JA.md">日本語</a> · <a href="docs/README_ZH.md">中文</a>
</p>

---

## Screenshots

| Main Interface | Playing with Timeline & Heatmap |
|:-:|:-:|
| ![Main](docs/screenshots/main.png) | ![Playing](docs/screenshots/playing_mode1.png) |

| Heatmap & Timeline Detail | Handy Device Connection |
|:-:|:-:|
| ![Heatmap](docs/screenshots/heatmap.png) | ![Handy](docs/screenshots/handy_connect.png) |

| EroScripts Search | Settings |
|:-:|:-:|
| ![Scripts](docs/screenshots/scripts_search.png) | ![Settings](docs/screenshots/setting.png) |

## Features

- **Video Player** — Play local video files (MP4, MKV, AVI, WebM, MOV, WMV) with full playback controls
- **Funscript Support** — Automatically loads matching `.funscript` files alongside videos
- **Timeline Visualization** — Real-time scrolling timeline showing script action points with speed-based colors
- **Heatmap** — Full-video intensity heatmap (green → yellow → orange → red → purple)
- **The Handy Integration** — Connect and sync The Handy device via HSSP protocol
  - Auto-connect & connection history
  - Script auto-upload to Handy servers
  - Time offset adjustment
  - Stroke range customization
- **EroScripts Integration** — Search and download funscripts directly from EroScripts via in-app browser login (no API key needed)
- **Multi-Language** — English, 한국어, 日本語, 中文
- **Drag & Drop** — Drop video files directly into the player
- **Folder Browser** — Browse folders with subfolder grouping and script detection (green checkmark)
- **Keyboard Shortcuts** — Space, Arrow keys, F (fullscreen), M (mute), and more
- **Cross-Platform** — Windows (standalone) and macOS (via GitHub Actions)

## Installation

### Windows

1. Download the latest release from [Releases](https://github.com/sioaeko/scriptplayer-plus/releases)
2. Extract and run `ScriptPlayerPlus.exe` — no installation required

### Build from Source

```bash
git clone https://github.com/sioaeko/scriptplayer-plus.git
cd scriptplayer-plus
npm install
```

**Development:**
```bash
npm run electron:dev
```

**Build Windows:**
```bash
npm run build:win
```

**Build macOS** (requires macOS):
```bash
npm run build:mac
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play / Pause |
| `←` / `→` | Seek ±5s |
| `Shift + ←/→` | Seek ±10s |
| `↑` / `↓` | Volume ±5% |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `Ctrl + ,` | Open settings |

## Tech Stack

- **Electron** — Desktop application framework
- **React** + **TypeScript** — UI components
- **Tailwind CSS** — Styling
- **Vite** — Build tool
- **Handy API v2** — Device communication
- **Discourse API** — EroScripts integration

## License

MIT

---

<p align="center">
  Built with Electron, React, and Tailwind CSS
</p>
