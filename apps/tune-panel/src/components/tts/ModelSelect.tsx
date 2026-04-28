import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Label } from '#/components/ui/label'

interface ModelSelectProps {
  value: string
  onChange: (value: string) => void
}

const MODELS = [
  {
    id: 'mimo-v2.5-tts',
    name: 'MiMo V2.5 TTS',
    desc: 'Built-in voices',
  },
  {
    id: 'mimo-v2.5-tts-voicedesign',
    name: 'Voice Design',
    desc: 'Custom voice from text',
  },
  {
    id: 'mimo-v2.5-tts-voiceclone',
    name: 'Voice Clone',
    desc: 'Clone from audio sample',
  },
]

export function ModelSelect({ value, onChange }: ModelSelectProps) {
  return (
    <div className="flex-1">
      <Label className="text-xs text-muted-foreground">Model</Label>
      <Select value={value} onValueChange={onChange}>
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
