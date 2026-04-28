import { useState, useCallback, useEffect } from 'react'
import type { TtsModel, VoiceMode, AudioFormat } from '#/lib/tts-types'

const FORM_STORAGE_KEY = 'tts-form-data'

interface TtsFormData {
  model: TtsModel
  audioFormat: AudioFormat
  stream: boolean
  voiceMode: VoiceMode
  builtinVoice: string
  voiceDescription: string
  voiceCloneBase64: string
  userMessage: string
  assistantMessage: string
}

const DEFAULT_FORM_DATA: TtsFormData = {
  model: 'mimo-v2.5-tts',
  audioFormat: 'wav',
  stream: false,
  voiceMode: 'builtin',
  builtinVoice: 'mimo_default',
  voiceDescription: '',
  voiceCloneBase64: '',
  userMessage: '',
  assistantMessage: '你好，欢迎使用 TTS 调试台！',
}

function loadFormData(): TtsFormData {
  try {
    const stored = localStorage.getItem(FORM_STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_FORM_DATA, ...JSON.parse(stored) }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_FORM_DATA
}

function saveFormData(data: TtsFormData) {
  try {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

export function useTtsForm() {
  const [formData, setFormData] = useState<TtsFormData>(loadFormData)

  // Save to localStorage whenever form data changes
  useEffect(() => {
    saveFormData(formData)
  }, [formData])

  const updateField = useCallback(
    <K extends keyof TtsFormData>(field: K, value: TtsFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA)
  }, [])

  return {
    formData,
    updateField,
    resetForm,
  }
}
