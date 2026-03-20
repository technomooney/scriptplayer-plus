import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import VideoPlayer from './components/VideoPlayer'
import Settings from './components/Settings'
import { VideoFile, Funscript, FunscriptAction, MediaType, PlaybackMode, SubtitleCue, SubtitleFile } from './types'
import { parseFunscript, transformFunscriptActions } from './services/funscript'
import { handyService, HandyUploadStatus } from './services/handy'
import { AppSettings, loadSettings, saveSettings } from './services/settings'
import { getVideoSubtitleMatchScore, parseSubtitleFile } from './services/subtitles'
import { useTranslation } from './i18n'

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.wmv']
const AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.wma']
const PLAYBACK_MODE_STORAGE_KEY = 'scriptplayer-playback-mode'
const PLAYBACK_RATE_STORAGE_KEY = 'scriptplayer-playback-rate'

function getMediaTypeFromPath(filePath: string): MediaType | null {
  const ext = '.' + (filePath.split('.').pop()?.toLowerCase() || '')
  if (VIDEO_EXTS.includes(ext)) return 'video'
  if (AUDIO_EXTS.includes(ext)) return 'audio'
  return null
}

function loadPlaybackMode(): PlaybackMode {
  try {
    const stored = localStorage.getItem(PLAYBACK_MODE_STORAGE_KEY)
    if (stored === 'sequential' || stored === 'shuffle' || stored === 'none') {
      return stored
    }
  } catch {
    // Ignore storage failures
  }

  return 'none'
}

function loadPlaybackRate(): number {
  try {
    const stored = Number(localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY))
    if (Number.isFinite(stored) && stored > 0) {
      return stored
    }
  } catch {
    // Ignore storage failures
  }

  return 1
}

function getPlaybackTimeScale(playbackRate: number): number {
  return 1 / (Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1)
}

function getHandyStartTime(mediaTimeSeconds: number, playbackRate: number, timeOffset: number): number {
  const baseTime = mediaTimeSeconds * 1000 * getPlaybackTimeScale(playbackRate)
  return Math.max(0, Math.round(baseTime + timeOffset))
}

function getNextPlaybackFile(
  files: VideoFile[],
  currentFile: string | null,
  playbackMode: PlaybackMode
): VideoFile | null {
  if (playbackMode === 'none' || !currentFile || files.length === 0) {
    return null
  }

  const currentIndex = files.findIndex((file) => file.path === currentFile)
  if (currentIndex < 0) {
    return null
  }

  if (playbackMode === 'sequential') {
    return currentIndex < files.length - 1 ? files[currentIndex + 1] : null
  }

  if (files.length === 1) {
    return null
  }

  const candidates = files.filter((file) => file.path !== currentFile)
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null
}

export default function App() {
  const { locale, setLocale } = useTranslation()
  const [files, setFiles] = useState<VideoFile[]>([])
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [currentFileType, setCurrentFileType] = useState<MediaType | null>(null)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [funscript, setFunscript] = useState<Funscript | null>(null)
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([])
  const [handyConnected, setHandyConnected] = useState(false)
  const [scriptUploadUrl, setScriptUploadUrl] = useState<string | null>(null)
  const [handyUploadStatus, setHandyUploadStatus] = useState<HandyUploadStatus>('idle')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [manualScriptPaths, setManualScriptPaths] = useState<Record<string, string>>({})
  const [manualSubtitleFiles, setManualSubtitleFiles] = useState<Record<string, SubtitleFile>>({})
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(loadPlaybackMode)
  const [playbackRate, setPlaybackRate] = useState<number>(loadPlaybackRate)
  const [autoPlayRequestId, setAutoPlayRequestId] = useState(0)
  const mediaRef = useRef<HTMLMediaElement | null>(null)
  const handyUploadRequestId = useRef(0)

  const actions: FunscriptAction[] = funscript?.actions || []
  const displayActions = useMemo(
    () =>
      transformFunscriptActions(actions, {
        strokeMin: settings.strokeRangeMin,
        strokeMax: settings.strokeRangeMax,
        invert: settings.invertStroke,
      }),
    [actions, settings.strokeRangeMin, settings.strokeRangeMax, settings.invertStroke]
  )
  const handyActions = useMemo(
    () => transformFunscriptActions(displayActions, { timeScale: getPlaybackTimeScale(playbackRate) }),
    [displayActions, playbackRate]
  )
  const displayFiles = useMemo(
    () => files.map((file) => ({
      ...file,
      hasScript: file.hasScript || Boolean(manualScriptPaths[file.path]),
      hasSubtitles: file.hasSubtitles || Boolean(manualSubtitleFiles[file.path]),
    })),
    [files, manualScriptPaths, manualSubtitleFiles]
  )

  // Listen for Handy upload status changes
  useEffect(() => {
    handyService.onStatusChange = (status) => {
      setHandyUploadStatus(status)
    }
    return () => { handyService.onStatusChange = null }
  }, [])

  // Sync settings language with i18n
  useEffect(() => {
    if (settings.language !== locale) {
      setLocale(settings.language)
    }
  }, [settings.language])

  useEffect(() => {
    try {
      localStorage.setItem(PLAYBACK_MODE_STORAGE_KEY, playbackMode)
    } catch {
      // Ignore storage failures
    }
  }, [playbackMode])

  useEffect(() => {
    try {
      localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, playbackRate.toString())
    } catch {
      // Ignore storage failures
    }
  }, [playbackRate])

  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }, [])

  const loadSubtitleCues = useCallback(async (mediaPath: string, mediaType: MediaType) => {
    const manualSubtitle = manualSubtitleFiles[mediaPath]
    if (manualSubtitle) {
      return parseSubtitleFile(manualSubtitle.content, manualSubtitle.path)
    }

    const subtitleFiles = await window.electronAPI.readSubtitles(mediaPath)
    return selectSubtitleCues(mediaPath, mediaType, subtitleFiles)
  }, [manualSubtitleFiles])

  const loadScript = useCallback(async (mediaPath: string) => {
    const manualScriptPath = manualScriptPaths[mediaPath]
    if (manualScriptPath) {
      const manualScript = await window.electronAPI.readFunscriptFile(manualScriptPath)
      return manualScript ? parseFunscript(manualScript) : null
    }

    const script = await window.electronAPI.readFunscript(mediaPath, settings.scriptFolder)
    return script ? parseFunscript(script) : null
  }, [manualScriptPaths, settings.scriptFolder])


  const handleOpenFolder = useCallback(async () => {
    const folderPath = await window.electronAPI.openFolder()
    if (!folderPath) return
    const mediaFiles = await window.electronAPI.readDir(folderPath)
    setFiles(mediaFiles)
  }, [])

  const openMediaFile = useCallback(async (
    filePath: string,
    fileType?: MediaType,
    options?: { autoplay?: boolean }
  ) => {
    const resolvedType = fileType ?? getMediaTypeFromPath(filePath)
    if (!resolvedType) return

    if (handyService.isConnected) {
      await handyService.hsspStop()
    }

    const currentMedia = mediaRef.current
    if (currentMedia && !currentMedia.paused) {
      currentMedia.pause()
    }

    if (options?.autoplay) {
      setAutoPlayRequestId((prev) => prev + 1)
    }

    setCurrentFile(filePath)
    setCurrentFileType(resolvedType)
    setFunscript(null)
    setSubtitleCues([])
    setScriptUploadUrl(null)

    setArtworkUrl(null)

    const [url, nextSubtitleCues, parsed, artworkPath] = await Promise.all([
      window.electronAPI.getVideoUrl(filePath),
      loadSubtitleCues(filePath, resolvedType),
      loadScript(filePath),
      resolvedType === 'audio'
        ? window.electronAPI.findArtwork(filePath)
        : Promise.resolve<string | null>(null),
    ])

    setVideoUrl(url)
    setSubtitleCues(nextSubtitleCues)
    setFunscript(parsed)

    if (artworkPath) {
      const nextArtworkUrl = await window.electronAPI.getVideoUrl(artworkPath)
      setArtworkUrl(nextArtworkUrl)
    }
  }, [loadScript, loadSubtitleCues])

  const handleFileSelect = useCallback(async (file: VideoFile) => {
    await openMediaFile(file.path, file.type)
  }, [openMediaFile])

  const handleManualScriptSelect = useCallback(async (file: VideoFile) => {
    const scriptPath = await window.electronAPI.openScriptFile()
    if (!scriptPath) return

    setManualScriptPaths((prev) => ({ ...prev, [file.path]: scriptPath }))

    if (currentFile === file.path) {
      const parsed = await window.electronAPI.readFunscriptFile(scriptPath)
      const nextScript = parsed ? parseFunscript(parsed) : null
      setFunscript(nextScript)
    }
  }, [currentFile])

  const handleManualSubtitleSelect = useCallback(async (file: VideoFile) => {
    const subtitlePath = await window.electronAPI.openSubtitleFile()
    if (!subtitlePath) return

    const subtitleFile = await window.electronAPI.readSubtitleFile(subtitlePath)
    if (!subtitleFile) return
    const cues = parseSubtitleFile(subtitleFile.content, subtitleFile.path)
    if (cues.length === 0) return

    setManualSubtitleFiles((prev) => ({ ...prev, [file.path]: subtitleFile }))

    if (currentFile === file.path) {
      setSubtitleCues(cues)
    }
  }, [currentFile])

  const handleClearManualScript = useCallback(async (file: VideoFile) => {
    setManualScriptPaths((prev) => {
      const next = { ...prev }
      delete next[file.path]
      return next
    })

    if (currentFile === file.path) {
      const script = await window.electronAPI.readFunscript(file.path, settings.scriptFolder)
      const parsed = script ? parseFunscript(script) : null
      setFunscript(parsed)
    }
  }, [currentFile, settings.scriptFolder])

  const handleClearManualSubtitle = useCallback(async (file: VideoFile) => {
    setManualSubtitleFiles((prev) => {
      const next = { ...prev }
      delete next[file.path]
      return next
    })

    if (currentFile === file.path) {
      const subtitleFiles = await window.electronAPI.readSubtitles(file.path)
      setSubtitleCues(selectSubtitleCues(file.path, file.type, subtitleFiles))
    }
  }, [currentFile])

  const handleHandyConnect = async (key: string) => {
    const connected = await handyService.connect(key)
    setHandyConnected(connected)
  }

  const handleHandyDisconnect = async () => {
    await handyService.hsspStop()
    handyService.disconnect()
    setHandyConnected(false)
    setScriptUploadUrl(null)
  }

  const syncHandyPlayback = useCallback(async (mediaTimeSeconds: number) => {
    if (!handyService.isConnected || !scriptUploadUrl) return
    const startTime = getHandyStartTime(mediaTimeSeconds, playbackRate, settings.timeOffset || 0)
    await handyService.hsspPlay(handyService.getServerTime(), startTime)
  }, [playbackRate, scriptUploadUrl, settings.timeOffset])

  const handlePlay = useCallback(async () => {
    const media = mediaRef.current
    if (!media) return
    await syncHandyPlayback(media.currentTime)
  }, [syncHandyPlayback])

  const handlePause = useCallback(async () => {
    if (handyService.isConnected) {
      await handyService.hsspStop()
    }
  }, [])

  const handleSeek = useCallback(
    async (time: number) => {
      if (handyService.isConnected && scriptUploadUrl) {
        const media = mediaRef.current
        if (media && !media.paused) {
          await handyService.hsspStop()
          await syncHandyPlayback(time)
        }
      }
    },
    [scriptUploadUrl, syncHandyPlayback]
  )

  const handleTimeUpdate = useCallback((_time: number) => {}, [])

  const handleEnded = useCallback(async () => {
    const nextFile = getNextPlaybackFile(files, currentFile, playbackMode)
    if (!nextFile) return
    await openMediaFile(nextFile.path, nextFile.type, { autoplay: true })
  }, [currentFile, files, openMediaFile, playbackMode])

  // Keyboard shortcuts for settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        setSettingsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle drag and drop
  useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      const mediaType = getMediaTypeFromPath(file.name)
      if (mediaType) {
        const path = window.electronAPI.getDroppedFilePath(file) || (file as any).path as string
        if (path) {
          await openMediaFile(path, mediaType)
        }
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    window.addEventListener('drop', handleDrop)
    window.addEventListener('dragover', handleDragOver)
    return () => {
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('dragover', handleDragOver)
    }
  }, [openMediaFile])

  // Load default folder on startup
  useEffect(() => {
    if (settings.defaultVideoFolder) {
      window.electronAPI.readDir(settings.defaultVideoFolder).then(setFiles)
    }
  }, [])

  useEffect(() => {
    if (!handyConnected || handyActions.length === 0) {
      if (handyService.isConnected) {
        void handyService.hsspStop()
      }
      setScriptUploadUrl(null)
      return
    }

    let cancelled = false
    const requestId = ++handyUploadRequestId.current

    setScriptUploadUrl(null)

    const runUpload = async () => {
      await handyService.hsspStop()
      const url = await handyService.uploadAndSetup(handyActions)
      if (cancelled || requestId !== handyUploadRequestId.current) {
        return
      }

      setScriptUploadUrl(url)
    }

    void runUpload()

    return () => {
      cancelled = true
    }
  }, [handyActions, handyConnected])

  useEffect(() => {
    if (!handyConnected || !scriptUploadUrl) return
    const media = mediaRef.current
    if (!media || media.paused) return
    void syncHandyPlayback(media.currentTime)
  }, [handyConnected, scriptUploadUrl, syncHandyPlayback])

  return (
    <div className="h-screen flex flex-col bg-surface-300">
      <TitleBar onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          files={displayFiles}
          currentFile={currentFile}
          onFileSelect={handleFileSelect}
          onOpenFolder={handleOpenFolder}
          onManualScriptSelect={handleManualScriptSelect}
          onManualSubtitleSelect={handleManualSubtitleSelect}
          onClearManualScript={handleClearManualScript}
          onClearManualSubtitle={handleClearManualSubtitle}
          manualScriptPaths={new Set(Object.keys(manualScriptPaths))}
          manualSubtitlePaths={new Set(Object.keys(manualSubtitleFiles))}
          handyConnected={handyConnected}
          onHandyConnect={handleHandyConnect}
          onHandyDisconnect={handleHandyDisconnect}
          scriptFolder={settings.scriptFolder}
        />
        <VideoPlayer
          videoUrl={videoUrl}
          mediaType={currentFileType}
          currentFileName={currentFile ? getFileName(currentFile) : null}
          artworkUrl={artworkUrl}
          actions={displayActions}
          subtitleCues={subtitleCues}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onEnded={handleEnded}
          mediaRef={mediaRef}
          autoPlayRequestId={autoPlayRequestId}
          playbackMode={playbackMode}
          onPlaybackModeChange={setPlaybackMode}
          playbackRate={playbackRate}
          onPlaybackRateChange={setPlaybackRate}
          handyInfo={handyConnected ? { connected: true, ping: handyService.ping, uploadStatus: handyUploadStatus } : { connected: false, ping: null, uploadStatus: 'idle' as const }}
          defaultShowHeatmap={settings.showHeatmapByDefault}
          defaultShowTimeline={settings.showTimelineByDefault}
          timelineHeight={settings.timelineHeight}
          timelineWindow={settings.timelineWindow}
          speedColors={settings.speedColors}
          subtitleFontSize={settings.subtitleFontSize}
        />
      </div>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || ''
}

function selectSubtitleCues(mediaPath: string, mediaType: MediaType, subtitleFiles: SubtitleFile[]): SubtitleCue[] {
  if (mediaType === 'audio') {
    for (const subtitleFile of subtitleFiles) {
      const cues = parseSubtitleFile(subtitleFile.content, subtitleFile.path)
      if (cues.length > 0) {
        return cues
      }
    }

    return []
  }

  let bestMatch: { score: number; cues: SubtitleCue[] } | null = null

  for (const subtitleFile of subtitleFiles) {
    const cues = parseSubtitleFile(subtitleFile.content, subtitleFile.path)
    if (cues.length === 0) continue

    const score = getVideoSubtitleMatchScore(mediaPath, subtitleFile)
    if (score < 0) continue
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { score, cues }
    }
  }

  return bestMatch?.cues ?? []
}
