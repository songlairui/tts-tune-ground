import { z } from 'zod'

// Todo schema (existing)
export const TodoSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
})

// TTS Request Schema
export const TtsRequestSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  model: z.enum([
    'mimo-v2.5-tts',
    'mimo-v2.5-tts-voicedesign',
    'mimo-v2.5-tts-voiceclone',
  ]),
  userMessage: z.string().optional(),
  assistantMessage: z.string().min(1, 'Synthesis text is required'),
  audioFormat: z.enum(['wav', 'pcm16']),
  voice: z.string().optional(),
  stream: z.boolean().default(false),
})

export const TtsResponseSchema = z.object({
  id: z.string(),
  audioData: z.string(),
  format: z.string(),
  contentType: z.string(),
  requestBody: z.string(),
  responseBody: z.string(),
})

export type TtsRequest = z.infer<typeof TtsRequestSchema>
export type TtsResponse = z.infer<typeof TtsResponseSchema>
