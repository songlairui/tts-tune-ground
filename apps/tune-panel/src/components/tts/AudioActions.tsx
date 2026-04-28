import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { downloadAudio, copyBase64 } from '#/lib/audio-utils'

interface AudioActionsProps {
  audioData?: string
  format?: string
}

export function AudioActions({ audioData, format }: AudioActionsProps) {
  const [copied, setCopied] = useState(false)

  if (!audioData || !format) {
    return null
  }

  const handleDownload = () => {
    downloadAudio(audioData, format)
  }

  const handleCopyBase64 = async () => {
    await copyBase64(audioData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleDownload}>
        ⬇️ Download {format.toUpperCase()}
      </Button>
      <Button variant="outline" onClick={handleCopyBase64}>
        {copied ? '✓ Copied!' : '📋 Copy Base64'}
      </Button>
    </div>
  )
}
