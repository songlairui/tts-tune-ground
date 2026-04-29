import { useState, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useLocalStorage } from '#/hooks/useLocalStorage'
import { useTtsForm } from '#/hooks/useTtsForm'
import { useTtsGenerate } from '#/hooks/useTtsGenerate'
import { useTtsStream } from '#/hooks/useTtsStream'
import type { TtsModel, AudioFormat } from '#/lib/tts-types'
import { BUILTIN_VOICES } from '#/lib/tts-types'

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
import { StreamChunks } from '#/components/tts/StreamChunks'
import { RequestPreview } from '#/components/tts/RequestPreview'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  // Form state with persistence
  const { formData, updateField, resetForm } = useTtsForm()

  // Audio state for non-streaming
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastResult, setLastResult] = useState<{
    audioData: string
    format: string
    requestBody: string
    responseBody: string
  } | null>(null)

  // Get API key
  const { data: apiKey } = useLocalStorage('tts-api-key', '')

  // Compute effective userMessage based on voice mode
  const effectiveUserMessage = useMemo(() => {
    if (formData.voiceMode === 'design') {
      const parts = [formData.voiceDescription, formData.userMessage].filter(Boolean)
      return parts.join('\n') || undefined
    }
    return formData.userMessage || undefined
  }, [formData.voiceMode, formData.voiceDescription, formData.userMessage])

  // Get current voice based on mode
  function getCurrentVoice(): string | undefined {
    switch (formData.voiceMode) {
      case 'builtin':
        return formData.builtinVoice
      case 'clone':
        return formData.voiceCloneBase64 || undefined
      default:
        return undefined
    }
  }

  // Get voice display name
  const voiceName = useMemo(() => {
    if (formData.voiceMode === 'builtin') {
      const v = BUILTIN_VOICES.find((b) => b.id === formData.builtinVoice)
      return v ? `${v.name} (${v.gender})` : undefined
    }
    return undefined
  }, [formData.voiceMode, formData.builtinVoice])

  // Non-streaming mutation (oRPC)
  const generateMutation = useTtsGenerate((data) => {
    setLastResult(data)
    setIsPlaying(false)
  })

  // Streaming hook
  const stream = useTtsStream()

  // Handle generate
  const handleGenerate = useCallback(() => {
    if (!apiKey) return

    if (formData.stream) {
      stream.startStream({
        model: formData.model,
        apiKey,
        text: formData.assistantMessage,
        userMessage: effectiveUserMessage,
        voice: getCurrentVoice(),
        format: formData.audioFormat,
      })
    } else {
      generateMutation.mutate({
        apiKey,
        model: formData.model,
        userMessage: effectiveUserMessage,
        assistantMessage: formData.assistantMessage,
        audioFormat: formData.audioFormat,
        voice: getCurrentVoice(),
        stream: false,
      })
    }
  }, [apiKey, formData, generateMutation, stream, effectiveUserMessage])

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (formData.stream) {
      stream.stop()
    }
  }, [formData.stream, stream])

  // Loading state
  const isLoading = formData.stream
    ? stream.isStreaming
    : generateMutation.isPending

  // Error state
  const error = formData.stream
    ? stream.error
    : generateMutation.error?.message

  // Audio data (unified for both paths)
  const audioData = formData.stream ? stream.audioData : lastResult?.audioData
  const audioFormat = formData.stream ? (formData.audioFormat === 'pcm16' ? 'pcm' : 'wav') : lastResult?.format

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
                    onVoiceModeChange={(v) => updateField('voiceMode', v)}
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
                  voiceMode={formData.voiceMode}
                  builtinVoice={formData.builtinVoice}
                  voiceDescription={formData.voiceDescription}
                  voiceCloneBase64={formData.voiceCloneBase64}
                  onVoiceModeChange={(v) => updateField('voiceMode', v)}
                  onBuiltinVoiceChange={(v) => updateField('builtinVoice', v)}
                  onVoiceDescriptionChange={(v) => updateField('voiceDescription', v)}
                  onVoiceCloneChange={(v) => updateField('voiceCloneBase64', v)}
                  onModelChange={(v) => updateField('model', v)}
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
              isLoading={isLoading}
              disabled={!apiKey || !formData.assistantMessage || isLoading}
              onClick={handleGenerate}
              onCancel={handleCancel}
              voiceMode={formData.voiceMode}
              voiceName={voiceName}
              isStream={formData.stream}
            />

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
                <p className="font-medium">Generation failed</p>
                <pre className="text-sm mt-1 whitespace-pre-wrap break-all font-mono">
                  {error}
                </pre>
              </div>
            )}

            {/* Request Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">请求预览</CardTitle>
              </CardHeader>
              <CardContent>
                <RequestPreview
                  model={formData.model}
                  voiceMode={formData.voiceMode}
                  builtinVoice={formData.builtinVoice}
                  voiceDescription={formData.voiceDescription}
                  voiceCloneBase64={formData.voiceCloneBase64}
                  userMessage={formData.userMessage}
                  assistantMessage={formData.assistantMessage}
                  audioFormat={formData.audioFormat}
                  apiKey={apiKey || ''}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output */}
          <div className="space-y-6">
            {/* Stream Chunks (streaming mode only) */}
            {formData.stream && stream.chunks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stream Chunks</CardTitle>
                </CardHeader>
                <CardContent>
                  <StreamChunks
                    chunks={stream.chunks}
                    audioBytes={stream.audioBytes}
                    isStreaming={stream.isStreaming}
                  />
                </CardContent>
              </Card>
            )}

            {/* Audio Player */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audio Output</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AudioPlayer
                  chunks={formData.stream ? stream.chunks : undefined}
                  audioData={formData.stream ? undefined : (lastResult?.audioData ?? undefined)}
                  format={audioFormat}
                  isStreaming={formData.stream ? stream.isStreaming : undefined}
                  isPlaying={isPlaying}
                  onPlayPause={() => setIsPlaying(!isPlaying)}
                />
                <AudioActions
                  audioData={audioData ?? undefined}
                  format={audioFormat}
                />
              </CardContent>
            </Card>

            {/* JSON Viewer (non-streaming) */}
            {!formData.stream && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">API Debug</CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonViewer
                    requestBody={lastResult?.requestBody}
                    responseBody={lastResult?.responseBody}
                    error={error ?? undefined}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
