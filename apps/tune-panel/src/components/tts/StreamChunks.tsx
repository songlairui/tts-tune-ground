import type { AudioChunk } from '#/hooks/useTtsStream'

interface StreamChunksProps {
  chunks: AudioChunk[]
  audioBytes: number
  isStreaming: boolean
}

export function StreamChunks({ chunks, audioBytes, isStreaming }: StreamChunksProps) {
  if (chunks.length === 0 && !isStreaming) return null

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
          <span>{chunks.length} chunks</span>
        </div>
        <span>{(audioBytes / 1024).toFixed(1)} KB</span>
      </div>

      {/* Chunk timeline */}
      {chunks.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chunks.map((chunk, i) => {
            const chunkSize = atob(chunk.data).length
            const sizeKb = chunkSize / 1024
            // Color by relative size
            const maxSize = Math.max(...chunks.map((c) => atob(c.data).length))
            const intensity = maxSize > 0 ? chunkSize / maxSize : 0.5
            const opacity = 0.3 + intensity * 0.7

            return (
              <div
                key={i}
                className="relative group"
                title={`Chunk #${chunk.index}: ${(chunkSize / 1024).toFixed(1)} KB`}
              >
                <div
                  className="w-6 h-6 rounded text-[9px] flex items-center justify-center font-mono bg-primary text-primary-foreground transition-opacity"
                  style={{ opacity }}
                >
                  {chunk.index}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border whitespace-nowrap">
                    #{chunk.index} · {sizeKb.toFixed(1)} KB
                  </div>
                </div>
              </div>
            )
          })}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: isStreaming ? '100%' : '0%' }}
        />
      </div>
    </div>
  )
}
