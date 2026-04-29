import { useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Label } from '#/components/ui/label'
import type { TtsModel, VoiceMode } from '#/lib/tts-types'
import { BuiltinVoice } from './BuiltinVoice'
import { VoiceDesign } from './VoiceDesign'
import { VoiceClone } from './VoiceClone'

interface VoiceTabsProps {
  voiceMode: VoiceMode
  builtinVoice: string
  voiceDescription: string
  voiceCloneBase64: string
  onVoiceModeChange: (mode: VoiceMode) => void
  onBuiltinVoiceChange: (voice: string) => void
  onVoiceDescriptionChange: (desc: string) => void
  onVoiceCloneChange: (base64: string) => void
  onModelChange?: (model: TtsModel) => void
}

const VOICE_MODE_TO_MODEL: Record<VoiceMode, TtsModel> = {
  builtin: 'mimo-v2.5-tts',
  design: 'mimo-v2.5-tts-voicedesign',
  clone: 'mimo-v2.5-tts-voiceclone',
}

export function VoiceTabs({
  voiceMode,
  builtinVoice,
  voiceDescription,
  voiceCloneBase64,
  onVoiceModeChange,
  onBuiltinVoiceChange,
  onVoiceDescriptionChange,
  onVoiceCloneChange,
  onModelChange,
}: VoiceTabsProps) {
  const handleTabChange = useCallback(
    (tab: string) => {
      const mode = tab as VoiceMode
      onVoiceModeChange(mode)
      // Auto-switch model to match voice mode
      onModelChange?.(VOICE_MODE_TO_MODEL[mode])
    },
    [onVoiceModeChange, onModelChange],
  )

  return (
    <div>
      <Label className="text-xs text-muted-foreground">Voice Mode</Label>
      <Tabs
        value={voiceMode}
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builtin">
            内置音色
          </TabsTrigger>
          <TabsTrigger value="design">
            音色设计
          </TabsTrigger>
          <TabsTrigger value="clone">
            音色克隆
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builtin">
          <BuiltinVoice
            value={builtinVoice}
            onChange={onBuiltinVoiceChange}
          />
        </TabsContent>

        <TabsContent value="design">
          <VoiceDesign
            value={voiceDescription}
            onChange={onVoiceDescriptionChange}
          />
        </TabsContent>

        <TabsContent value="clone">
          <VoiceClone
            value={voiceCloneBase64}
            onChange={onVoiceCloneChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
