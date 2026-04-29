import { createFileRoute } from '@tanstack/react-router'

interface TtsStreamInput {
  model: string
  apiKey: string
  text: string
  userMessage?: string
  voice?: string
  format?: string
}

async function handle({ request }: { request: Request }) {
  const body: TtsStreamInput = await request.json()
  const { model, apiKey, text, voice, format, userMessage } = body

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API Key is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Build MIMO request
  const messages: Array<{ role: string; content: string }> = []
  if (userMessage) {
    messages.push({ role: 'user', content: userMessage })
  }
  messages.push({ role: 'assistant', content: text })

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    audio: { format: format === 'pcm16' ? 'pcm16' : 'wav' },
    stream: true,
  }
  if (model !== 'mimo-v2.5-tts-voicedesign' && voice) {
    ;(requestBody.audio as Record<string, unknown>).voice = voice
  }

  console.log('[tts-stream] Requesting MIMO:', {
    model,
    textLen: text.length,
    format,
    stream: true,
  })

  const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let detail = errorText
    try {
      detail = JSON.parse(errorText).error?.message || errorText
    } catch { /* raw */ }
    return new Response(
      JSON.stringify({ error: `MIMO API ${response.status}: ${detail}` }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Stream MIMO SSE → client SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) { controller.close(); return }

      let buffer = ''
      let chunkIndex = 0
      let totalMimoChunks = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            // MIMO SSE format: "data: {...}" or "data: [DONE]"
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6).trim()
              if (data === '[DONE]') {
                console.log('[tts-stream] MIMO stream done, total chunks:', totalMimoChunks)
                continue
              }

              try {
                const json = JSON.parse(data)
                const audioChunk =
                  json.choices?.[0]?.delta?.audio?.data ||
                  json.choices?.[0]?.message?.audio?.data ||
                  json.audio?.data

                if (audioChunk) {
                  totalMimoChunks++
                  const chunkBytes = atob(audioChunk).length
                  console.log(`[tts-stream] MIMO chunk #${totalMimoChunks}: ${chunkBytes} bytes`)

                  // Send as SSE event
                  const sseData = JSON.stringify({
                    type: 'chunk',
                    index: chunkIndex++,
                    data: audioChunk,
                    bytes: chunkBytes,
                  })
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`))
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim()
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6).trim()
            if (data !== '[DONE]') {
              try {
                const json = JSON.parse(data)
                const audioChunk =
                  json.choices?.[0]?.delta?.audio?.data ||
                  json.choices?.[0]?.message?.audio?.data
                if (audioChunk) {
                  totalMimoChunks++
                  const chunkBytes = atob(audioChunk).length
                  console.log(`[tts-stream] MIMO chunk #${totalMimoChunks} (buffer): ${chunkBytes} bytes`)

                  const sseData = JSON.stringify({
                    type: 'chunk',
                    index: chunkIndex++,
                    data: audioChunk,
                    bytes: chunkBytes,
                  })
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`))
                }
              } catch { /* skip */ }
            }
          }
        }

        // Done event
        console.log('[tts-stream] Sending done, total chunks forwarded:', chunkIndex)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', totalChunks: chunkIndex })}\n\n`))
      } catch (err) {
        console.error('[tts-stream] Error:', err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`))
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export const Route = createFileRoute('/api/tts-stream')({
  server: {
    handlers: {
      POST: handle,
    },
  },
})
