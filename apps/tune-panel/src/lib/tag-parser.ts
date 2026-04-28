// Parse style tags and audio tags from synthesis text
export function parseTags(text: string): Array<{
  type: 'style' | 'audio' | 'text'
  content: string
  start: number
  end: number
}> {
  const segments: Array<{
    type: 'style' | 'audio' | 'text'
    content: string
    start: number
    end: number
  }> = []

  // Match style tags: (content) or （content） or [audio content]
  const tagRegex = /(\([^)]+\))|（[^）]+）|\[([^\]]+)\]/g

  let lastIndex = 0
  let match

  while ((match = tagRegex.exec(text)) !== null) {
    // Add text before this tag
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
        start: lastIndex,
        end: match.index,
      })
    }

    const tagContent = match[0]

    // Determine if it's audio tag or style tag
    const isAudio = tagContent.startsWith('[') && tagContent.endsWith(']')
    segments.push({
      type: isAudio ? 'audio' : 'style',
      content: tagContent,
      start: match.index,
      end: match.index + tagContent.length,
    })

    lastIndex = match.index + tagContent.length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
      start: lastIndex,
      end: text.length,
    })
  }

  return segments
}

// Convert segments to HTML for display
export function segmentsToHtml(segments: ReturnType<typeof parseTags>): string {
  return segments
    .map((seg) => {
      if (seg.type === 'style') {
        return `<span class="tag-style">${escapeHtml(seg.content)}</span>`
      }
      if (seg.type === 'audio') {
        return `<span class="tag-audio">${escapeHtml(seg.content)}</span>`
      }
      return escapeHtml(seg.content)
    })
    .join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
