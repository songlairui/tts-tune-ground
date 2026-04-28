import { Textarea } from '#/components/ui/textarea'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { DIRECTOR_TEMPLATE } from '#/lib/tts-types'

interface StyleInputProps {
  value: string
  onChange: (value: string) => void
}

export function StyleInput({ value, onChange }: StyleInputProps) {
  const handleInsertTemplate = () => {
    if (value) {
      onChange(value + '\n\n' + DIRECTOR_TEMPLATE)
    } else {
      onChange(DIRECTOR_TEMPLATE)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          Style Instructions (user message)
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInsertTemplate}
        >
          📝 Insert Director Template
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the voice style, emotion, pacing... (optional)"
        rows={4}
      />
    </div>
  )
}
