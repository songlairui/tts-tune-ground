import { useState, useMemo, useCallback } from 'react'
import { Button } from '#/components/ui/button'
import type { TtsModel, VoiceMode } from '#/lib/tts-types'

interface RequestPreviewProps {
  model: TtsModel
  voiceMode: VoiceMode
  builtinVoice: string
  voiceDescription: string
  voiceCloneBase64: string
  userMessage: string
  assistantMessage: string
  audioFormat: string
  apiKey: string
}

export function RequestPreview({
  model,
  voiceMode,
  builtinVoice,
  voiceDescription,
  voiceCloneBase64,
  userMessage,
  assistantMessage,
  audioFormat,
  apiKey,
}: RequestPreviewProps) {
  const [directResult, setDirectResult] = useState<{
    status: number
    body: string
    elapsed: number
  } | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Build the exact request body that would be sent to MIMO
  const requestBody = useMemo(() => {
    const messages: Array<{ role: string; content: string }> = []

    // Voice design: description goes in user message
    // Voice clone: description (if any) goes in user message
    // Built-in: style instructions (if any) go in user message
    let effectiveUserMessage = ''
    if (voiceMode === 'design') {
      const parts = [voiceDescription, userMessage].filter(Boolean)
      effectiveUserMessage = parts.join('\n')
    } else {
      effectiveUserMessage = userMessage
    }

    if (effectiveUserMessage) {
      messages.push({ role: 'user', content: effectiveUserMessage })
    }
    messages.push({ role: 'assistant', content: assistantMessage })

    const body: Record<string, unknown> = {
      model,
      messages,
      audio: { format: audioFormat === 'pcm16' ? 'pcm16' : 'wav' },
      stream: false,
    }

    // Voice for non-voicedesign models
    if (model !== 'mimo-v2.5-tts-voicedesign') {
      if (voiceMode === 'builtin') {
        ;(body.audio as Record<string, unknown>).voice = builtinVoice
      } else if (voiceMode === 'clone' && voiceCloneBase64) {
        ;(body.audio as Record<string, unknown>).voice = voiceCloneBase64
      }
    }

    return body
  }, [model, voiceMode, builtinVoice, voiceDescription, voiceCloneBase64, userMessage, assistantMessage, audioFormat])

  const jsonString = useMemo(() => JSON.stringify(requestBody, null, 2), [requestBody])

  // Send directly from browser
  const handleDirectSend = useCallback(async () => {
    if (!apiKey) return
    setIsSending(true)
    setDirectResult(null)

    const start = Date.now()
    try {
      const res = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: jsonString,
      })
      const body = await res.text()
      setDirectResult({
        status: res.status,
        body: body.length > 2000 ? body.slice(0, 2000) + '\n...(truncated)' : body,
        elapsed: Date.now() - start,
      })
    } catch (err) {
      setDirectResult({
        status: 0,
        body: `Error: ${err instanceof Error ? err.message : String(err)}`,
        elapsed: Date.now() - start,
      })
    } finally {
      setIsSending(false)
    }
  }, [apiKey, jsonString])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonString)
  }, [jsonString])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          发送到 <code className="bg-muted px-1 rounded">/v1/chat/completions</code> 的完整请求
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            📋 Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDirectSend}
            disabled={!apiKey || isSending}
          >
            {isSending ? '⏳ Sending...' : '🌐 浏览器直发'}
          </Button>
        </div>
      </div>

      {/* Request body */}
      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap break-all font-mono">
        <code>{jsonString}</code>
      </pre>

      {/* Key indicators */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Model</span>
          <div className="font-mono mt-0.5">{model}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Voice</span>
          <div className="font-mono mt-0.5">
            {model === 'mimo-v2.5-tts-voicedesign'
              ? '(text-described)'
              : voiceMode === 'builtin'
                ? builtinVoice
                : voiceMode === 'clone'
                  ? '(base64 audio)'
                  : '-'}
          </div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Messages</span>
          <div className="font-mono mt-0.5">
            {(requestBody.messages as Array<unknown>)?.length || 0} msg(s)
          </div>
        </div>
      </div>

      {/* Direct send result */}
      {directResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className={directResult.status === 200 ? 'text-green-600' : 'text-destructive'}>
              {directResult.status === 200 ? '✓' : '✗'} HTTP {directResult.status}
            </span>
            <span className="text-muted-foreground">{directResult.elapsed}ms</span>
          </div>
          <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-[200px] whitespace-pre-wrap break-all font-mono">
            <code>{directResult.body}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
