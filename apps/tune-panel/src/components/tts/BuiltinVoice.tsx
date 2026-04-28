import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { BUILTIN_VOICES } from '#/lib/tts-types'

interface BuiltinVoiceProps {
  value: string
  onChange: (voice: string) => void
}

export function BuiltinVoice({ value, onChange }: BuiltinVoiceProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select voice" />
      </SelectTrigger>
      <SelectContent>
        {BUILTIN_VOICES.map((voice) => (
          <SelectItem key={voice.id} value={voice.id}>
            <span className="font-medium">{voice.name}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              {voice.language} · {voice.gender}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
