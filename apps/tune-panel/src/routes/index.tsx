import { useState, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useLocalStorage } from '#/hooks/useLocalStorage'
import { useTtsForm } from '#/hooks/useTtsForm'
import { useTtsGenerate } from '#/hooks/useTtsGenerate'
import type { TtsModel, VoiceMode, AudioFormat } from '#/lib/tts-types'

import { ApiKeyInput } from '#/components/tts/ApiKeyInput'
import { ModelSelect } from '#/components/tts/ModelSelect'
import { AudioConfig } from '#/components/tts/AudioConfig'
import { VoiceTabs } from '#/components/tts/VoiceTabs'
import { StyleInput } from '#/components/tts/StyleInput'
import { TextEditor } from '#/components/tts/TextEditor'
import { GenerateButton } from '#/components/tts/GenerateButton'
import { JsonViewer } from '#/components/tts/JsonViewer'
import { AudioPlayer } from '#/components/tts/AudioPlayer'
import { AudioActions } from '#/components/tts/AudioActions'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  // Form state with persistence
  const { formData, updateField, resetForm } = useTtsForm()

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastResult, setLastResult] = useState<{
    audioData: string
    format: string
    requestBody: string
    responseBody: string
  } | null>(null)

  // Get API key
  const { data: apiKey } = useLocalStorage('tts-api-key', '')

  // Generate mutation
  const generateMutation = useTtsGenerate((data) => {
    setLastResult(data)
    setIsPlaying(false)
  })

  // Get current voice based on mode
  const getCurrentVoice = useCallback((): string | undefined => {
    switch (formData.voiceMode) {
      case 'builtin':
        return formData.builtinVoice
      case 'clone':
        return formData.voiceCloneBase64 || undefined
      default:
        return undefined
    }
  }, [formData.voiceMode, formData.builtinVoice, formData.voiceCloneBase64])

  // Handle generate
  const handleGenerate = useCallback(() => {
    if (!apiKey) return

    generateMutation.mutate({
      apiKey,
      model: formData.model,
      userMessage: formData.userMessage || undefined,
      assistantMessage: formData.assistantMessage,
      audioFormat: formData.audioFormat,
      voice: getCurrentVoice(),
      stream: formData.stream,
    })
  }, [apiKey, formData, generateMutation, getCurrentVoice])

  // Generate curl command
  const curlCommand = useMemo(() => {
    const messages = []
    if (formData.userMessage) {
      messages.push({ role: 'user', content: formData.userMessage })
    }
    messages.push({ role: 'assistant', content: formData.assistantMessage })

    const body: Record<string, unknown> = {
      model: formData.model,
      messages,
      audio: { format: formData.audioFormat },
      stream: formData.stream,
    }

    if (formData.voiceMode === 'builtin' && formData.model !== 'mimo-v2.5-tts-voicedesign') {
      (body.audio as Record<string, unknown>).voice = formData.builtinVoice
    }

    return `curl --location --request POST 'https://api.xiaomimimo.com/v1/chat/completions' \\
  --header "api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  --header 'Content-Type: application/json' \\
  --data-raw '${JSON.stringify(body, null, 2)}'`
  }, [apiKey, formData])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">TTS API 调试台</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={resetForm}>
              🔄 Reset
            </Button>
            <span className="text-sm text-muted-foreground">
              Xiaomi MiMo TTS v2.5
            </span>
          </div>
        </div>

        {/* Main Layout: Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input Controls */}
          <div className="space-y-6">
            {/* API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ApiKeyInput />
                <div className="grid grid-cols-2 gap-4">
                  <ModelSelect
                    value={formData.model}
                    onChange={(v) => updateField('model', v as TtsModel)}
                  />
                  <AudioConfig
                    format={formData.audioFormat}
                    stream={formData.stream}
                    onFormatChange={(v) => updateField('audioFormat', v as AudioFormat)}
                    onStreamChange={(v) => updateField('stream', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voice Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voice Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceTabs
                  model={formData.model}
                  voiceMode={formData.voiceMode}
                  builtinVoice={formData.builtinVoice}
                  voiceDescription={formData.voiceDescription}
                  voiceCloneBase64={formData.voiceCloneBase64}
                  onVoiceModeChange={(v) => updateField('voiceMode', v)}
                  onBuiltinVoiceChange={(v) => updateField('builtinVoice', v)}
                  onVoiceDescriptionChange={(v) => updateField('voiceDescription', v)}
                  onVoiceCloneChange={(v) => updateField('voiceCloneBase64', v)}
                />
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Text Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StyleInput
                  value={formData.userMessage}
                  onChange={(v) => updateField('userMessage', v)}
                />
                <TextEditor
                  value={formData.assistantMessage}
                  onChange={(v) => updateField('assistantMessage', v)}
                />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <GenerateButton
              isLoading={generateMutation.isPending}
              disabled={!apiKey || !formData.assistantMessage || generateMutation.isPending}
              onClick={handleGenerate}
            />

            {/* Error Display */}
            {generateMutation.isError && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
                <p className="font-medium">Generation failed</p>
                <pre className="text-sm mt-1 whitespace-pre-wrap break-all font-mono">
                  {generateMutation.error?.message || JSON.stringify(generateMutation.error, null, 2)}
                </pre>
              </div>
            )}

            {/* Curl Command */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Test with curl</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommand)
                    }}
                  >
                    📋 Copy curl
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                  <code>{curlCommand}</code>
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output */}
          <div className="space-y-6">
            {/* Audio Player */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audio Output</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AudioPlayer
                  audioData={lastResult?.audioData}
                  format={lastResult?.format}
                  isPlaying={isPlaying}
                  onPlayPause={() => setIsPlaying(!isPlaying)}
                />
                <AudioActions
                  audioData={lastResult?.audioData}
                  format={lastResult?.format}
                />
              </CardContent>
            </Card>

            {/* JSON Viewer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Debug</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonViewer
                  requestBody={lastResult?.requestBody}
                  responseBody={lastResult?.responseBody}
                  error={generateMutation.error?.message}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
