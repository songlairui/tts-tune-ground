import { useState } from 'react'
import { Button } from '#/components/ui/button'

interface JsonViewerProps {
  requestBody?: string
  responseBody?: string
  error?: string
}

export function JsonViewer({ requestBody, responseBody, error }: JsonViewerProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'error'>(
    'request'
  )
  const [copied, setCopied] = useState(false)

  const content =
    activeTab === 'request'
      ? requestBody
      : activeTab === 'response'
        ? responseBody
        : error

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!requestBody && !responseBody && !error) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/50 px-2">
        <div className="flex gap-1">
          {requestBody && (
            <Button
              variant={activeTab === 'request' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('request')}
            >
              Request
            </Button>
          )}
          {responseBody && (
            <Button
              variant={activeTab === 'response' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('response')}
            >
              Response
            </Button>
          )}
          {error && (
            <Button
              variant={activeTab === 'error' ? 'destructive' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('error')}
            >
              Error
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? '✓ Copied' : '📋 Copy'}
        </Button>
      </div>
      <pre className="p-4 text-xs overflow-auto max-h-[300px] bg-muted/30">
        <code>{content || 'No data'}</code>
      </pre>
    </div>
  )
}
