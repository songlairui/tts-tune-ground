import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Label } from '#/components/ui/label'
import type { VoiceMode } from '#/lib/tts-types'

interface ModelSelectProps {
  value: string
  onChange: (value: string) => void
  onVoiceModeChange?: (mode: VoiceMode) => void
}

const MODELS = [
  {
    id: 'mimo-v2.5-tts',
    name: 'MiMo V2.5 TTS',
    desc: 'Built-in voices',
    voiceMode: 'builtin' as VoiceMode,
  },
  {
    id: 'mimo-v2.5-tts-voicedesign',
    name: 'Voice Design',
    desc: 'Custom voice from text',
    voiceMode: 'design' as VoiceMode,
  },
  {
    id: 'mimo-v2.5-tts-voiceclone',
    name: 'Voice Clone',
    desc: 'Clone from audio sample',
    voiceMode: 'clone' as VoiceMode,
  },
]

export function ModelSelect({ value, onChange, onVoiceModeChange }: ModelSelectProps) {
  const handleChange = useCallback(
    (modelId: string) => {
      onChange(modelId)
      // Auto-switch voice mode to match model
      const model = MODELS.find((m) => m.id === modelId)
      if (model) {
        onVoiceModeChange?.(model.voiceMode)
      }
    },
    [onChange, onVoiceModeChange],
  )

  return (
    <div className="flex-1">
      <Label className="text-xs text-muted-foreground">Model</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <span className="font-medium">{model.name}</span>
              <span className="text-muted-foreground ml-2 text-xs">
                {model.desc}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
