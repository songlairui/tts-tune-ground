import { Textarea } from '#/components/ui/textarea'
import { Button } from '#/components/ui/button'
import { VOICE_DESIGN_EXAMPLES } from '#/lib/tts-types'

interface VoiceDesignProps {
  value: string
  onChange: (desc: string) => void
}

export function VoiceDesign({ value, onChange }: VoiceDesignProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the voice you want... (e.g., young female, gentle, ASMR style)"
        rows={4}
      />
      <div className="flex flex-wrap gap-1">
        {VOICE_DESIGN_EXAMPLES.map((example) => (
          <Button
            key={example.name}
            variant="outline"
            size="sm"
            onClick={() => onChange(example.description)}
          >
            {example.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
