import { createFileRoute } from '@tanstack/react-router'
import { generateSpeech, toServerSentEventsResponse } from '@tanstack/ai'
import { mimoTTS } from '#/lib/mimo-tts-adapter'

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

  const adapter = mimoTTS(model, { apiKey })

  const stream = generateSpeech({
    adapter,
    text,
    voice,
    format: format === 'pcm16' ? 'pcm' : 'wav',
    modelOptions: {
      userMessage,
    },
    stream: true,
  })

  return toServerSentEventsResponse(stream)
}

export const Route = createFileRoute('/api/tts-stream')({
  server: {
    handlers: {
      POST: handle,
    },
  },
})
