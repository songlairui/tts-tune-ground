import { os, ORPCError } from '@orpc/server'
import { TtsRequestSchema } from '../schema'

export const generateTts = os
  .input(TtsRequestSchema)
  .handler(async ({ input }) => {
    const { apiKey, model, userMessage, assistantMessage, audioFormat, voice, stream } = input

    // Construct MIMO API request
    const messages = []
    if (userMessage && userMessage.trim()) {
      messages.push({ role: 'user', content: userMessage })
    }
    messages.push({ role: 'assistant', content: assistantMessage })

    const requestBody: Record<string, unknown> = {
      model,
      messages,
      audio: {
        format: audioFormat,
      },
      stream,
    }

    // Add voice for non-voicedesign models
    if (model !== 'mimo-v2.5-tts-voicedesign' && voice) {
      requestBody.audio = {
        format: audioFormat,
        voice,
      }
    }

    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
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

      throw new ORPCError('BAD_REQUEST', {
        message: `MIMO API Error ${response.status}: ${errorDetail}`,
      })
    }

    // Handle streaming response (both wav and pcm16)
    if (stream) {
      const chunks: string[] = []
      const rawChunks: string[] = []
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Process complete lines
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            rawChunks.push(trimmed)

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6).trim()
              if (data === '[DONE]') continue

              try {
                const json = JSON.parse(data)
                // Try different paths for audio data
                const audioChunk =
                  json.choices?.[0]?.delta?.audio?.data ||
                  json.choices?.[0]?.message?.audio?.data ||
                  json.audio?.data

                if (audioChunk) {
                  chunks.push(audioChunk)
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          rawChunks.push(buffer.trim())
        }
      }

      const audioData = chunks.join('')
      if (!audioData) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'No audio data in streaming response',
          data: {
            rawChunksCount: rawChunks.length,
            sampleChunks: rawChunks.slice(0, 3),
          },
        })
      }

      return {
        id: Date.now().toString(),
        audioData,
        format: audioFormat,
        contentType: audioFormat === 'wav' ? 'audio/wav' : 'audio/pcm',
        requestBody: JSON.stringify(requestBody, null, 2),
        responseBody: JSON.stringify({ streaming: true, chunks: chunks.length, rawChunks: rawChunks.length }),
      }
    }

    // Handle non-streaming response
    const data = await response.json()
    const audioData = data.choices?.[0]?.message?.audio?.data

    if (!audioData) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'No audio data in response',
        data: { response: JSON.stringify(data).slice(0, 500) },
      })
    }

    return {
      id: Date.now().toString(),
      audioData,
      format: audioFormat,
      contentType: audioFormat === 'wav' ? 'audio/wav' : 'audio/pcm',
      requestBody: JSON.stringify(requestBody, null, 2),
      responseBody: JSON.stringify(data, null, 2),
    }
  })
