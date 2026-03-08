# ScriptPlayer+ Development Log

## Project Overview

FunPlayer라는 이름으로 다른 계정에서 만들던 funscript 플레이어를 이어받아 ScriptPlayer+로 리브랜딩하고 기능을 완성한 프로젝트.

- **Stack**: Electron + React + TypeScript + Tailwind CSS + Vite
- **Repo**: https://github.com/sioaeko/scriptplayer-plus

---

## Session Summary (2026-03-08)

### 1. 타임라인/히트맵 토글 버튼 수정
- 히트맵 버튼만 있고 타임라인 토글 버튼이 없는 문제 → 둘 다 존재했으나 아이콘만 있어서 구분 불가
- 각 버튼에 텍스트 라벨 추가 (`TL`, `HM`), 활성화 시 배경색 추가

### 2. Handy 디바이스 연동 수정
- **스크립트 업로드 URL 수정**: `handyfeeling.com/api/handy-rest/v3/uploads` (404) → `scripts01.handyfeeling.com/api/script/v0/temp/upload` (공식 SDK가 사용하는 올바른 엔드포인트)
- 공식 Handy SDK (`@ohdoki/handy-sdk`) 소스코드 분석하여 올바른 엔드포인트 확인
- 모든 Handy API 호출에 `console.log`/`console.error` 추가
- 업로드 상태 UI 표시 (uploading → setting-up → ready / error)
- 드래그 & 드롭으로 파일 열 때도 Handy에 스크립트 업로드하도록 수정
- `uploadScript` + `setHSSP`를 `uploadAndSetup` 메서드로 통합

### 3. Windows/macOS Standalone 빌드
- `electron-builder` 설정으로 Windows portable 빌드 (`dir` target)
- macOS는 Windows에서 빌드 불가 → GitHub Actions workflow 생성 (`.github/workflows/build.yml`)
- macOS: `titleBarStyle: 'hiddenInset'`, traffic light position, `app.on('activate')` 처리
- `signAndEditExecutable: false`로 코드사인 우회 (symlink 권한 문제)
- `rcedit`로 빌드 후 아이콘 수동 적용 (`scripts/set-icon.js` 자동화)

### 4. Handy 자동 연결 & 연결 기록
- localStorage에 연결 기록 저장 (최대 5개)
- 최근 기록에서 원클릭 연결
- 자동 연결 토글 (앱 시작 시 마지막 키로 자동 연결)
- i18n 키 추가 (en/ko/ja/zh)

### 5. 앱 리브랜딩
- `FunPlayer` → `ScriptPlayer+` 로 전체 이름 변경
- package.json, i18n 파일, 타이틀바, Handy CSV 헤더 등 모두 반영
- `productName: "ScriptPlayerPlus"` (파일명에 `+` 사용 불가)

### 6. 앱 아이콘 생성
- Node.js로 1024x1024 PNG 아이콘 프로그래밍 방식 생성 (S+ 로고, 퍼플 그라데이션)
- `png2icons`로 `.ico` (Windows) / `.icns` (macOS) 변환
- `rcedit`로 exe에 아이콘 삽입 자동화

### 7. EroScripts 브라우저 로그인
- API 키 입력 방식 제거 → 앱 내 BrowserWindow로 EroScripts 직접 로그인
- Electron `session.cookies.get()`으로 `_t` 쿠키 감지 → 세션 캡처
- 모든 EroScripts API 호출을 main process에서 프록시 (쿠키 포함)
- **로그인 유지**: `userData` 폴더에 쿠키+유저네임 저장, 앱 재시작 시 `checkSession`으로 자동 복원
- 설정의 EroScripts 섹션 (API키 입력) 완전 제거

### 8. NAS WebDAV/FTP 기능
- 백엔드 구현은 있었으나 프론트엔드 미구현 상태 발견
- 파일 탭에 NAS 브라우징 UI 구현 (폴더/파일 탐색, WebDAV 프록시 스트리밍)
- 설정에 연결 테스트 버튼 + 프로토콜 안내 추가
- **이후 사용자 요청으로 NAS 기능 전체 제거** (폴더 선택 기능으로 충분)

### 9. 설정 기능 정리
- 미구현/미연동 설정 제거: `autoLoadScript`, `autoSearchEroScripts`, `rememberVolume`, `rememberPosition`, `handyKey` (Sidebar에서 관리)
- 실제 연동 구현:
  - `timeOffset` → HSSP play/seek에 오프셋 적용
  - `timelineHeight` → VideoPlayer 타임라인 높이 반영
  - `timelineWindow` → ScriptTimeline 표시 범위 반영 (`windowSize` prop)
  - `speedColors` → 토글 연동
  - `strokeRangeMin/Max` → 설정 UI에서 조절
- EroScripts 관련 설정 잔여물 제거 (`eroScriptsApiKey`, `eroScriptsUsername`)

### 10. EroScripts 첨부파일명 수정
- Discourse 업로드 파일명이 해시값 (`hxitVoMKzrmu9U...funscript`)으로 표시되는 문제
- `cooked` HTML에서 `<a href="...">원본파일명.funscript</a>` 링크 텍스트 파싱으로 변경
- URL 인코딩된 파일명도 `safeDecodeURI`로 디코딩

### 11. 스크립트 저장 폴더 설정
- 설정에 "스크립트 저장 폴더" 추가 (i18n 4개 언어)
- EroScripts 다운로드 → 지정 폴더에 원본 파일명으로 저장
- 영상 재생 시 영상 옆에 `.funscript` 없으면 → 스크립트 폴더에서 같은 이름 자동 검색
- 드래그 & 드롭에도 fallback 적용

### 12. 영상/클라우드 링크 표시
- EroScripts 게시물에서 영상 호스팅 링크 자동 감지
- 지원: MEGA, Google Drive, Pixeldrain, Dropbox, MediaFire, GoFile, OneDrive, SpankBang, Pornhub, Erome, RedGIFs 등 20개 서비스
- 스크립트: `FileText` 아이콘 (보라색) → 다운로드
- 영상 링크: `Film` 아이콘 (파란색) → 브라우저에서 열기

### 13. GitHub 리포 & 릴리스
- `sioaeko/scriptplayer-plus` 리포 생성
- README 4개 언어 (EN/KO/JA/ZH) + 스크린샷 8장
- macOS 스크린샷 추가, 다운로드 안내 추가
- `gh` CLI 설치 및 인증 (`workflow` scope 포함)
- v1.0.0 릴리스: Windows + macOS Universal zip
- v0.1.1 릴리스: 위 변경점 반영 + 타이틀바 버전 표시

---

## File Structure

```
FunPlayer/
├── .github/workflows/build.yml    # CI build (Win + Mac)
├── electron/
│   ├── main.ts                    # Electron main process
│   └── preload.ts                 # Context bridge
├── public/
│   ├── icon.png                   # 1024x1024 app icon
│   ├── icon.ico                   # Windows icon
│   └── icon.icns                  # macOS icon
├── scripts/
│   └── set-icon.js                # Post-build icon setter
├── src/
│   ├── App.tsx                    # Main app component
│   ├── components/
│   │   ├── EroScriptsPanel.tsx    # EroScripts search & download
│   │   ├── ScriptHeatmap.tsx      # Full-video heatmap canvas
│   │   ├── ScriptTimeline.tsx     # Scrolling timeline canvas
│   │   ├── Settings.tsx           # Settings modal
│   │   ├── Sidebar.tsx            # File browser, device, search tabs
│   │   ├── TitleBar.tsx           # Custom title bar
│   │   └── VideoPlayer.tsx        # Video player with controls
│   ├── i18n/
│   │   ├── index.ts               # i18n provider
│   │   └── locales/               # en, ko, ja, zh
│   ├── services/
│   │   ├── eroscripts.ts          # EroScripts API (legacy, mostly replaced by IPC)
│   │   ├── funscript.ts           # Funscript parsing
│   │   ├── handy.ts               # Handy device service (HSSP)
│   │   └── settings.ts            # App settings persistence
│   └── types.ts                   # TypeScript types + electronAPI
├── docs/
│   ├── DEVLOG.md                  # This file
│   ├── README_KO.md
│   ├── README_JA.md
│   ├── README_ZH.md
│   └── screenshots/               # App screenshots
├── package.json
├── vite.config.ts
└── README.md
```

## Key Technical Decisions

1. **Handy Script Upload**: 공식 SDK 소스 분석 → `scripts01.handyfeeling.com/api/script/v0/temp/upload` 엔드포인트 사용
2. **EroScripts Auth**: API 키 대신 BrowserWindow 로그인 → 세션 쿠키 캡처 → main process 프록시
3. **아이콘**: `signAndEditExecutable: false`로 빌드 후 `rcedit`로 수동 적용 (symlink 권한 문제 우회)
4. **NAS 제거**: 백엔드는 유지하되 프론트엔드 제거 (폴더 선택으로 충분)
5. **스크립트 폴더**: 영상 옆 → 스크립트 폴더 순서로 fallback 검색
