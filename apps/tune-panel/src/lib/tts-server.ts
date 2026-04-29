import { createServerFn } from '@tanstack/react-start'
import { generateSpeech, toServerSentEventsResponse } from '@tanstack/ai'
import { mimoTTS } from './mimo-tts-adapter'

interface TtsInput {
  apiKey: string
  model: string
  text: string
  userMessage?: string
  voice?: string
  format?: 'wav' | 'pcm'
}

export const generateSpeechStreamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: TtsInput) => data)
  .handler(({ data }) => {
    const adapter = mimoTTS(data.model, {
      apiKey: data.apiKey,
    })

    return toServerSentEventsResponse(
      generateSpeech({
        adapter,
        text: data.text,
        voice: data.voice,
        format: data.format === 'pcm' ? 'pcm' : 'wav',
        modelOptions: {
          userMessage: data.userMessage,
        },
        stream: true,
      }),
    )
  })
