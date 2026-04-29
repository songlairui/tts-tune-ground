import { Button } from '#/components/ui/button'
import type { VoiceMode } from '#/lib/tts-types'

interface GenerateButtonProps {
  isLoading: boolean
  disabled: boolean
  onClick: () => void
  onCancel?: () => void
  voiceMode?: VoiceMode
  voiceName?: string
  isStream?: boolean
}

export function GenerateButton({
  isLoading,
  disabled,
  onClick,
  onCancel,
  voiceMode,
  voiceName,
  isStream,
}: GenerateButtonProps) {
  const modeLabel = voiceMode === 'design'
    ? '音色设计'
    : voiceMode === 'clone'
      ? '音色克隆'
      : voiceName || '默认'

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground text-center">
          {isStream ? '流式生成中...' : '生成中...'} · {modeLabel}
        </div>
        <Button
          onClick={onCancel}
          variant="destructive"
          size="lg"
          className="w-full"
        >
          ⏹️ 取消生成
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground text-center">
        {isStream && '⚡ 流式 · '}{modeLabel}
      </div>
      <Button
        onClick={onClick}
        disabled={disabled}
        size="lg"
        className="w-full"
      >
        🎙️ 生成语音
      </Button>
    </div>
  )
}
