// Convert base64 to Blob
export function base64ToBlob(base64: string, format: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)

  const mimeType = format === 'wav' ? 'audio/wav' : 'audio/pcm'
  return new Blob([byteArray], { type: mimeType })
}

// Convert base64 to Object URL
export function base64ToObjectUrl(base64: string, format: string): string {
  const blob = base64ToBlob(base64, format)
  return URL.createObjectURL(blob)
}

// Download audio from base64
export function downloadAudio(base64: string, format: string, filename?: string) {
  const blob = base64ToBlob(base64, format)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `tts-output.${format === 'wav' ? 'wav' : 'pcm'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Copy base64 to clipboard
export async function copyBase64(base64: string): Promise<void> {
  await navigator.clipboard.writeText(base64)
}
