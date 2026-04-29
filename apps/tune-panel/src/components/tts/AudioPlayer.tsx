import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '#/components/ui/button'
import type { AudioChunk } from '#/hooks/useTtsStream'

interface AudioPlayerProps {
  /** Individual chunks for progressive playback */
  chunks?: AudioChunk[]
  /** Accumulated base64 audio for non-streaming mode */
  audioData?: string
  format?: string
  isStreaming?: boolean
  isPlaying?: boolean
  onPlayPause?: () => void
}

export function AudioPlayer({
  chunks,
  audioData,
  format,
  isStreaming,
  isPlaying,
  onPlayPause,
}: AudioPlayerProps) {
  const ctxRef = useRef<AudioContext | null>(null)
  const scheduledUntil = useRef<number>(0)
  const nextChunkIndex = useRef<number>(0)
  const activeSource = useRef<AudioBufferSourceNode | null>(null)
  const [currentChunk, setCurrentChunk] = useState<number>(-1)

  // Standard audio element for non-streaming mode
  const audioRef = useRef<HTMLAudioElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  // --- Progressive playback (Web Audio API) ---
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  // Schedule a chunk for playback
  const scheduleChunk = useCallback(
    async (chunk: AudioChunk, fmt?: string) => {
      const ctx = getCtx()

      // Decode audio data
      const rawBytes = atob(chunk.data)
      const rawBuf = new Uint8Array(rawBytes.length)
      for (let i = 0; i < rawBytes.length; i++) {
        rawBuf[i] = rawBytes.charCodeAt(i)
      }

      let audioBuffer: AudioBuffer
      if (fmt === 'pcm') {
        // PCM: wrap in WAV header
        const sampleRate = 24000
        const channels = 1
        const bitsPerSample = 16
        const wavBuf = createWavBuffer(rawBuf, sampleRate, channels, bitsPerSample)
        audioBuffer = await ctx.decodeAudioData(wavBuf.buffer as ArrayBuffer)
      } else {
        // WAV: direct decode
        audioBuffer = await ctx.decodeAudioData(rawBuf.buffer as ArrayBuffer)
      }

      // Schedule this chunk to play after the previous one
      const startTime = Math.max(scheduledUntil.current, ctx.currentTime + 0.01)
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.start(startTime)
      scheduledUntil.current = startTime + audioBuffer.duration

      // Track which chunk is playing
      const idx = chunk.index
      source.onended = () => {
        setCurrentChunk((prev) => (prev === idx ? -1 : prev))
      }

      activeSource.current = source
      setCurrentChunk(idx)
    },
    [getCtx],
  )

  // Process new chunks
  useEffect(() => {
    if (!chunks || chunks.length === 0) return

    // Schedule any unscheduled chunks
    while (nextChunkIndex.current < chunks.length) {
      const chunk = chunks[nextChunkIndex.current]
      nextChunkIndex.current++
      scheduleChunk(chunk, format)
    }
  }, [chunks, format, scheduleChunk])

  // Reset when chunks are cleared
  useEffect(() => {
    if (!chunks || chunks.length === 0) {
      nextChunkIndex.current = 0
      scheduledUntil.current = 0
      setCurrentChunk(-1)
    }
  }, [chunks])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [])

  // --- Non-streaming mode (standard audio element) ---
  useEffect(() => {
    if (chunks && chunks.length > 0) return // Progressive mode active
    if (!audioData || !format) return

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    const blob = base64ToBlob(audioData, format)
    objectUrlRef.current = URL.createObjectURL(blob)
    if (audioRef.current) {
      audioRef.current.src = objectUrlRef.current
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [audioData, format, chunks])

  useEffect(() => {
    if (chunks && chunks.length > 0) return
    if (!audioRef.current || !audioData) return
    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, audioData, chunks])

  // Stop all playback
  const handleStop = useCallback(() => {
    activeSource.current?.stop()
    activeSource.current = null
    scheduledUntil.current = 0
    nextChunkIndex.current = 0
    setCurrentChunk(-1)
    ctxRef.current?.suspend()
  }, [])

  // --- Render ---
  const isProgressive = chunks && chunks.length > 0
  const hasAnyData = isProgressive || audioData

  if (!hasAnyData) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <div className="text-4xl mb-2">🎵</div>
        <p>Generate audio to see the player</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4">
        {isProgressive ? (
          <>
            <Button variant="outline" size="lg" onClick={handleStop}>
              ⏹️ Stop
            </Button>
            {currentChunk >= 0 && (
              <span className="text-sm text-muted-foreground">
                Playing chunk #{currentChunk}
              </span>
            )}
            {isStreaming && currentChunk < 0 && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Waiting for audio...
              </span>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" size="lg" onClick={onPlayPause}>
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </Button>
            <audio ref={audioRef} className="w-full" controls />
          </>
        )}
      </div>

      {/* Chunk playback timeline */}
      {isProgressive && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {chunks!.map((chunk, i) => {
              const isThisPlaying = currentChunk === chunk.index
              const isDone = !isStreaming && chunk.index < chunks!.length
              return (
                <div
                  key={i}
                  className={`
                    w-7 h-7 rounded text-[10px] flex items-center justify-center font-mono transition-all
                    ${isThisPlaying
                      ? 'bg-green-500 text-white scale-110 shadow-md'
                      : isDone
                        ? 'bg-primary/60 text-primary-foreground'
                        : 'bg-primary/20 text-primary/60'
                    }
                  `}
                  title={`Chunk #${chunk.index}: ${(atob(chunk.data).length / 1024).toFixed(1)} KB`}
                >
                  {chunk.index}
                </div>
              )
            })}
            {isStreaming && (
              <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Helpers ---

function base64ToBlob(base64: string, format: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const mimeType = format === 'wav' ? 'audio/wav' : 'audio/pcm'
  return new Blob([byteArray], { type: mimeType })
}

function createWavBuffer(
  pcmData: Uint8Array,
  sampleRate: number,
  channels: number,
  bitsPerSample: number,
): Uint8Array {
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)
  const dataSize = pcmData.length
  const headerSize = 44
  const buf = new Uint8Array(headerSize + dataSize)
  const view = new DataView(buf.buffer)

  // RIFF header
  buf.set([0x52, 0x49, 0x46, 0x46]) // "RIFF"
  view.setUint32(4, 36 + dataSize, true)
  buf.set([0x57, 0x41, 0x56, 0x45]) // "WAVE"

  // fmt subchunk
  buf.set([0x66, 0x6d, 0x74, 0x20]) // "fmt "
  view.setUint32(16, 16, true) // subchunk1 size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)

  // data subchunk
  buf.set([0x64, 0x61, 0x74, 0x61]) // "data"
  view.setUint32(40, dataSize, true)
  buf.set(pcmData, headerSize)

  return buf
}
