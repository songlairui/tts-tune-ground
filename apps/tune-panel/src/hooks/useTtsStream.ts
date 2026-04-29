import { useState, useRef, useCallback } from 'react'

export interface AudioChunk {
  index: number
  data: string
  bytes: number
  receivedAt: number
}

export interface TtsStreamState {
  chunks: AudioChunk[]
  audioData: string | null
  audioBytes: number
  isStreaming: boolean
  error: string | null
}

export function useTtsStream() {
  const [state, setState] = useState<TtsStreamState>({
    chunks: [],
    audioData: null,
    audioBytes: 0,
    isStreaming: false,
    error: null,
  })

  const abortRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (params: {
    model: string
    apiKey: string
    text: string
    userMessage?: string
    voice?: string
    format?: string
  }) => {
    // Abort previous
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({
      chunks: [],
      audioData: null,
      audioBytes: 0,
      isStreaming: true,
      error: null,
    })

    try {
      const res = await fetch('/api/tts-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text()
        let detail = errText
        try { detail = JSON.parse(errText).error || errText } catch { /* raw */ }
        throw new Error(`Stream Error ${res.status}: ${detail}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      const chunks: AudioChunk[] = []
      let totalBytes = 0
      let buffer = ''

      console.log('[useTtsStream] Starting to read SSE stream')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE: each event is "data: {...}\n\n"
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // Keep incomplete event

        for (const event of events) {
          const dataLine = event.trim()
          if (!dataLine || !dataLine.startsWith('data: ')) continue

          const jsonStr = dataLine.slice(6).trim()
          if (!jsonStr) continue

          try {
            const msg = JSON.parse(jsonStr)

            if (msg.type === 'chunk') {
              const chunk: AudioChunk = {
                index: msg.index,
                data: msg.data,
                bytes: msg.bytes || atob(msg.data).length,
                receivedAt: Date.now(),
              }
              chunks.push(chunk)
              totalBytes += chunk.bytes

              console.log(`[useTtsStream] Chunk #${chunk.index}: ${chunk.bytes} bytes, total: ${totalBytes}`)

              // Update state with all chunks so far
              setState({
                chunks: [...chunks],
                audioData: null, // Don't accumulate on client; player handles per-chunk
                audioBytes: totalBytes,
                isStreaming: true,
                error: null,
              })
            } else if (msg.type === 'done') {
              console.log('[useTtsStream] Done, total chunks:', msg.totalChunks)
            } else if (msg.type === 'error') {
              throw new Error(msg.message)
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message.startsWith('Stream Error')) {
              throw parseErr
            }
            // Skip non-JSON
          }
        }
      }

      setState((prev) => ({ ...prev, isStreaming: false }))
    } catch (err) {
      if (controller.signal.aborted) return
      console.error('[useTtsStream] Error:', err)
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({
      chunks: [],
      audioData: null,
      audioBytes: 0,
      isStreaming: false,
      error: null,
    })
  }, [])

  return { ...state, startStream, stop, reset }
}
