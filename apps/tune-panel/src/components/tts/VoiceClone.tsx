import { useCallback, useRef } from 'react'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'

interface VoiceCloneProps {
  value: string
  onChange: (base64: string) => void
}

export function VoiceClone({ value, onChange }: VoiceCloneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      // Check file type
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav']
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
        alert('Only mp3 and wav files are supported')
        return
      }

      // Convert to base64
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      )

      const mimeType = file.type === 'audio/wav' ? 'audio/wav' : 'audio/mpeg'
      onChange(`data:${mimeType};base64,${base64}`)
    },
    [onChange]
  )

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Audio file loaded</span>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            Remove
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Size: {(value.length * 3) / 4 / 1024 / 1024} MB (base64)
        </div>
      </div>
    )
  }

  return (
    <div
      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="text-2xl mb-2">🎙️</div>
      <Label className="cursor-pointer">Click to upload audio sample</Label>
      <p className="text-xs text-muted-foreground mt-1">
        MP3 or WAV, max 10MB
      </p>
    </div>
  )
}
