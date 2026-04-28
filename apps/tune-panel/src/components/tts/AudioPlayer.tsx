import { useEffect, useRef } from 'react'
import { Button } from '#/components/ui/button'
import { base64ToObjectUrl } from '#/lib/audio-utils'

interface AudioPlayerProps {
  audioData?: string
  format?: string
  isPlaying: boolean
  onPlayPause: () => void
}

export function AudioPlayer({
  audioData,
  format,
  isPlaying,
  onPlayPause,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const objectUrl = useRef<string | null>(null)

  useEffect(() => {
    if (audioData && format) {
      // Clean up previous URL
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current)
      }
      objectUrl.current = base64ToObjectUrl(audioData, format)
      if (audioRef.current) {
        audioRef.current.src = objectUrl.current
      }
    }

    return () => {
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current)
      }
    }
  }, [audioData, format])

  useEffect(() => {
    if (!audioRef.current || !audioData) return

    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, audioData])

  if (!audioData) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <div className="text-4xl mb-2">🎵</div>
        <p>Generate audio to see the player</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onPlayPause}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </Button>
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      <audio ref={audioRef} className="w-full" controls />
    </div>
  )
}
