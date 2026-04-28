import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'

interface AudioConfigProps {
  format: string
  stream: boolean
  onFormatChange: (value: string) => void
  onStreamChange: (value: boolean) => void
}

export function AudioConfig({
  format,
  stream,
  onFormatChange,
  onStreamChange,
}: AudioConfigProps) {
  const handleFormatChange = (value: string) => {
    onFormatChange(value)
    // Auto-enable stream when pcm16 is selected
    if (value === 'pcm16') {
      onStreamChange(true)
    }
  }

  return (
    <div className="flex items-end gap-4">
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">Audio Format</Label>
        <Select value={format} onValueChange={handleFormatChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wav">WAV</SelectItem>
            <SelectItem value="pcm16">PCM16</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 pb-0.5">
        <Label className="text-xs text-muted-foreground">Stream</Label>
        <Switch
          checked={stream}
          onCheckedChange={onStreamChange}
          disabled={format === 'pcm16'}
        />
        <span className="text-xs text-muted-foreground">
          {stream ? 'On' : 'Off'}
        </span>
      </div>
    </div>
  )
}
