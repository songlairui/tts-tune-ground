import { BaseTTSAdapter } from '@tanstack/ai'
import type { TTSOptions, TTSResult } from '@tanstack/ai'

interface MimoTTSProviderOptions {
  userMessage?: string
  stream?: boolean
}

interface MimoTTSConfig {
  apiKey: string
  baseUrl?: string
}

export class MimoTTSAdapter extends BaseTTSAdapter<string, MimoTTSProviderOptions> {
  readonly name = 'mimo-tts'
  private apiKey: string
  private baseUrl: string

  constructor(model: string, config: MimoTTSConfig) {
    super(model, config)
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.xiaomimimo.com/v1'
  }

  async generateSpeech(options: TTSOptions<MimoTTSProviderOptions>): Promise<TTSResult> {
    const { text, voice, format = 'wav', modelOptions } = options

    // Build messages array
    const messages = []
    if (modelOptions?.userMessage) {
      messages.push({ role: 'user', content: modelOptions.userMessage })
    }
    messages.push({ role: 'assistant', content: text })

    // Build request body
    const requestBody = {
      model: this.model,
      messages,
      audio: {
        format: format === 'wav' ? 'wav' : 'pcm16',
        ...(voice ? { voice } : {}),
      },
      stream: false,
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetail = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetail = errorJson.error?.message || errorText
      } catch {
        // Use raw text
      }
      throw new Error(`MIMO API Error ${response.status}: ${errorDetail}`)
    }

    const data = await response.json()
    const audioData = data.choices?.[0]?.message?.audio?.data

    if (!audioData) {
      throw new Error('No audio data in response')
    }

    return {
      id: this.generateId(),
      model: this.model,
      audio: audioData,
      format: format === 'wav' ? 'wav' : 'pcm',
      contentType: format === 'wav' ? 'audio/wav' : 'audio/pcm',
    }
  }
}

// Factory function
export function mimoTTS(model: string, config: MimoTTSConfig): MimoTTSAdapter {
  return new MimoTTSAdapter(model, config)
}
