import { useRef, useEffect, useCallback, useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  BarChart3,
  Activity,
  Upload,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { FunscriptAction } from '../types'
import { HandyUploadStatus } from '../services/handy'
import { useTranslation } from '../i18n'
import ScriptTimeline from './ScriptTimeline'
import ScriptHeatmap from './ScriptHeatmap'

interface HandyOverlayInfo {
  connected: boolean
  ping: number | null
  uploadStatus: HandyUploadStatus
}

interface VideoPlayerProps {
  videoUrl: string | null
  actions: FunscriptAction[]
  onTimeUpdate: (time: number) => void
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  handyInfo?: HandyOverlayInfo | null
  timelineHeight?: number
  timelineWindow?: number
  speedColors?: boolean
}

export default function VideoPlayer({
  videoUrl,
  actions,
  onTimeUpdate,
  onPlay,
  onPause,
  onSeek,
  videoRef,
  handyInfo,
  timelineHeight = 64,
  timelineWindow = 10,
  speedColors = true,
}: VideoPlayerProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [showHandyOverlay, setShowHandyOverlay] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showTimeline, setShowTimeline] = useState(true)
  const handyOverlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('volume')
    return saved ? parseFloat(saved) : 1
  })
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const t = video.currentTime
    setCurrentTime(t)
    onTimeUpdate(t)
  }, [onTimeUpdate, videoRef])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
      onPlay()
    } else {
      video.pause()
      setPlaying(false)
      onPause()
    }
  }, [onPlay, onPause, videoRef])

  const handleSeek = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video) return
      video.currentTime = time
      setCurrentTime(time)
      onSeek(time)
    },
    [onSeek, videoRef]
  )

  const handleVolumeChange = (v: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = v
    setVolume(v)
    localStorage.setItem('volume', v.toString())
    if (v > 0) setMuted(false)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !muted
    setMuted(!muted)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  const skip = (seconds: number) => {
    handleSeek(Math.max(0, Math.min(duration, currentTime + seconds)))
  }

  // Mouse movement for auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [playing])

  // Show Handy overlay for 2s when connection status or upload status changes
  const prevHandyConnected = useRef<boolean | undefined>(undefined)
  const prevUploadStatus = useRef<string | undefined>(undefined)
  useEffect(() => {
    const connectionChanged = handyInfo && prevHandyConnected.current !== handyInfo.connected
    const uploadChanged = handyInfo && prevUploadStatus.current !== handyInfo.uploadStatus

    if (connectionChanged || uploadChanged) {
      if (handyInfo) {
        prevHandyConnected.current = handyInfo.connected
        prevUploadStatus.current = handyInfo.uploadStatus
      }
      setShowHandyOverlay(true)
      if (handyOverlayTimer.current) clearTimeout(handyOverlayTimer.current)
      // Keep overlay longer for upload status, shorter for connection
      const delay = handyInfo?.uploadStatus === 'ready' ? 2000 : (uploadChanged ? 4000 : 2000)
      handyOverlayTimer.current = setTimeout(() => setShowHandyOverlay(false), delay)
    }
  }, [handyInfo?.connected, handyInfo?.ping, handyInfo?.uploadStatus])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(e.shiftKey ? -10 : -5)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(e.shiftKey ? 10 : 5)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.05))
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, volume, currentTime, duration])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    video.volume = volume
  }, [videoUrl, videoRef])

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-black relative"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={togglePlay}>
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              const video = videoRef.current
              if (video) setDuration(video.duration)
            }}
            onPlay={() => { setPlaying(true); onPlay() }}
            onPause={() => { setPlaying(false); onPause() }}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <div className="text-text-muted text-sm flex flex-col items-center gap-3">
            <Play size={48} strokeWidth={1} className="text-text-muted/30" />
            <span>{t('player.noVideo')}</span>
          </div>
        )}
      </div>

      {/* Handy connection overlay */}
      {showHandyOverlay && handyInfo && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 animate-fade-in">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
            <div
              className={`w-2 h-2 rounded-full ${
                handyInfo.connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-white font-medium">
              {handyInfo.connected ? 'Handy Connected' : 'Handy Disconnected'}
            </span>
            {handyInfo.connected && handyInfo.ping !== null && (
              <span className="text-[10px] text-text-muted font-mono">
                {handyInfo.ping}ms
              </span>
            )}
          </div>
        </div>
      )}

      {/* Handy upload status (persistent when uploading/error) */}
      {handyInfo?.connected && handyInfo.uploadStatus !== 'idle' && handyInfo.uploadStatus !== 'ready' && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 animate-fade-in">
          {(handyInfo.uploadStatus === 'uploading' || handyInfo.uploadStatus === 'setting-up') && (
            <>
              <Loader2 size={14} className="text-accent animate-spin" />
              <span className="text-xs text-white">
                {handyInfo.uploadStatus === 'uploading' ? 'Uploading script...' : 'Setting up HSSP...'}
              </span>
            </>
          )}
          {handyInfo.uploadStatus === 'error' && (
            <>
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-xs text-red-400">Script upload failed</span>
            </>
          )}
        </div>
      )}

      {/* Script timeline / heatmap */}
      {actions.length > 0 && (showHeatmap || showTimeline) && (
        <div className="flex-shrink-0 border-t border-surface-100/20">
          {showHeatmap && (
            <div className="h-8">
              <ScriptHeatmap
                actions={actions}
                duration={duration}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
            </div>
          )}
          {showTimeline && (
            <div style={{ height: timelineHeight }}>
              <ScriptTimeline
                actions={actions}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                windowSize={timelineWindow}
              />
            </div>
          )}
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`flex-shrink-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300 ${
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar */}
        <div className="mb-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); skip(-5) }}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay() }}
              className="p-2 text-text-primary hover:text-accent transition-colors"
            >
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skip(5) }}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <SkipForward size={18} />
            </button>
            <span className="text-xs text-text-secondary ml-2 font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute() }}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => { e.stopPropagation(); handleVolumeChange(parseFloat(e.target.value)) }}
              onClick={(e) => e.stopPropagation()}
              className="w-20 h-1"
            />
            {actions.length > 0 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTimeline(v => !v) }}
                  className={`p-1.5 flex items-center gap-1 rounded transition-colors ${showTimeline ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary'}`}
                  title="Timeline"
                >
                  <Activity size={16} />
                  <span className="text-[10px] font-medium">TL</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowHeatmap(v => !v) }}
                  className={`p-1.5 flex items-center gap-1 rounded transition-colors ${showHeatmap ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary'}`}
                  title="Heatmap"
                >
                  <BarChart3 size={16} />
                  <span className="text-[10px] font-medium">HM</span>
                </button>
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
