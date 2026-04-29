import { useRef } from 'react'
import { useGenerateSpeech } from '@tanstack/ai-react'
import type { TTSResult } from '@tanstack/ai'
import type { SpeechGenerateInput } from '@tanstack/ai-react'

interface TtsStreamResult {
  audioData: string
  format: string
  requestBody: string
  responseBody: string
}

interface TtsStreamConfig {
  model: string
  apiKey: string
  userMessage?: string
  voice?: string
  format?: string
}

export function useTtsStream(
  config: TtsStreamConfig,
  onSuccess?: (data: TtsStreamResult) => void,
) {
  const configRef = useRef(config)
  configRef.current = config

  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  return useGenerateSpeech({
    fetcher: async (input: SpeechGenerateInput) => {
      const cfg = configRef.current
      const res = await fetch('/api/tts-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          apiKey: cfg.apiKey,
          text: input.text,
          voice: input.voice,
          format: input.format,
          userMessage: cfg.userMessage,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        let detail = errText
        try {
          const errJson = JSON.parse(errText)
          detail = errJson.error || errText
        } catch {
          // use raw
        }
        throw new Error(`Stream Error ${res.status}: ${detail}`)
      }

      return res
    },
    onResult: (result: TTSResult) => {
      const cfg = configRef.current
      const data: TtsStreamResult = {
        audioData: result.audio,
        format: result.format,
        requestBody: JSON.stringify(
          {
            model: cfg.model,
            voice: cfg.voice,
            format: cfg.format,
          },
          null,
          2,
        ),
        responseBody: JSON.stringify(result, null, 2),
      }
      onSuccessRef.current?.(data)
      return data
    },
  })
}
