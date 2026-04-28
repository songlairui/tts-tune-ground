import { useRef, useCallback } from 'react'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import { TagToolbar } from './TagToolbar'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function TextEditor({ value, onChange }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInsertTag = useCallback(
    (tag: string) => {
      const textarea = textareaRef.current
      if (!textarea) {
        onChange(value + tag)
        return
      }

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = value.slice(0, start)
      const after = value.slice(end)

      const newValue = before + tag + after
      onChange(newValue)

      // Restore cursor position after tag
      requestAnimationFrame(() => {
        textarea.focus()
        const newPos = start + tag.length
        textarea.setSelectionRange(newPos, newPos)
      })
    },
    [value, onChange]
  )

  const wordCount = value.length
  const estimatedDuration = Math.max(1, Math.ceil(wordCount / 5))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          Synthesis Text (assistant message)
        </Label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{wordCount} chars</span>
          <span>~{estimatedDuration}s</span>
        </div>
      </div>

      <TagToolbar onInsert={handleInsertTag} />

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter text to synthesize... Use (style tags) for emotion, [audio tags] for sounds"
        rows={6}
        className="font-mono"
      />

      {/* Tag syntax guide */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <span className="text-green-600 font-medium">(style)</span> - Overall style at beginning
        </p>
        <p>
          <span className="text-orange-600 font-medium">[audio tag]</span> - Inline audio effects
        </p>
      </div>
    </div>
  )
}
