import { BaseTTSAdapter, type TTSAdapterConfig } from '@tanstack/ai/adapters'
import type { TTSOptions, TTSResult } from '@tanstack/ai'

interface MimoTTSProviderOptions {
  userMessage?: string
}

export class MimoTTSAdapter extends BaseTTSAdapter<string, MimoTTSProviderOptions> {
  readonly name = 'mimo-tts'

  constructor(model: string, config?: TTSAdapterConfig) {
    super(model, config)
  }

  async generateSpeech(options: TTSOptions<MimoTTSProviderOptions>): Promise<TTSResult> {
    const { text, voice, format = 'wav', modelOptions } = options
    const apiKey = this.config.apiKey
    const baseUrl = this.config.baseUrl || 'https://api.xiaomimimo.com/v1'

    if (!apiKey) {
      throw new Error('API Key is required')
    }

    // Build messages array
    const messages: Array<{ role: string; content: string }> = []
    if (modelOptions?.userMessage) {
      messages.push({ role: 'user', content: modelOptions.userMessage })
    }
    messages.push({ role: 'assistant', content: text })

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages,
      audio: {
        format: format === 'wav' ? 'wav' : 'pcm16',
      },
      stream: false,
    }

    // Add voice for non-voicedesign models
    if (this.model !== 'mimo-v2.5-tts-voicedesign' && voice) {
      ;(requestBody.audio as Record<string, unknown>).voice = voice
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
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
      id: `mimo-${Date.now()}`,
      model: this.model,
      audio: audioData,
      format: format === 'wav' ? 'wav' : 'pcm',
      contentType: format === 'wav' ? 'audio/wav' : 'audio/pcm',
    }
  }
}

export function mimoTTS(model: string, config?: TTSAdapterConfig): MimoTTSAdapter {
  return new MimoTTSAdapter(model, config)
}
