import { useState, useEffect } from 'react'
import { useLocalStorage, useSetLocalStorage } from '#/hooks/useLocalStorage'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'

const API_KEY_STORAGE_KEY = 'tts-api-key'

export function ApiKeyInput() {
  const { data: apiKey } = useLocalStorage(API_KEY_STORAGE_KEY, '')
  const setApiKey = useSetLocalStorage()
  const [localValue, setLocalValue] = useState(apiKey || '')
  const [showKey, setShowKey] = useState(false)

  // Sync from localStorage on mount
  useEffect(() => {
    if (apiKey) {
      setLocalValue(apiKey)
    }
  }, [apiKey])

  // Auto-save when value changes (debounced)
  useEffect(() => {
    if (!localValue || localValue === apiKey) return

    const timer = setTimeout(() => {
      setApiKey.mutate({ key: API_KEY_STORAGE_KEY, value: localValue })
    }, 500)

    return () => clearTimeout(timer)
  }, [localValue, apiKey, setApiKey])

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
    : 'Not set'

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">API Key</Label>
        <div className="flex gap-2">
          <Input
            type={showKey ? 'text' : 'password'}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder="Enter your MIMO API Key"
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? '🙈' : '👁️'}
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground self-center min-w-[100px]">
        {apiKey ? `✓ ${maskedKey}` : '❌ Not set'}
      </div>
    </div>
  )
}
