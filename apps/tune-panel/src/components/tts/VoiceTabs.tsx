import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Label } from '#/components/ui/label'
import type { TtsModel, VoiceMode } from '#/lib/tts-types'
import { BuiltinVoice } from './BuiltinVoice'
import { VoiceDesign } from './VoiceDesign'
import { VoiceClone } from './VoiceClone'

interface VoiceTabsProps {
  model: TtsModel
  voiceMode: VoiceMode
  builtinVoice: string
  voiceDescription: string
  voiceCloneBase64: string
  onVoiceModeChange: (mode: VoiceMode) => void
  onBuiltinVoiceChange: (voice: string) => void
  onVoiceDescriptionChange: (desc: string) => void
  onVoiceCloneChange: (base64: string) => void
}

export function VoiceTabs({
  model,
  voiceMode,
  builtinVoice,
  voiceDescription,
  voiceCloneBase64,
  onVoiceModeChange,
  onBuiltinVoiceChange,
  onVoiceDescriptionChange,
  onVoiceCloneChange,
}: VoiceTabsProps) {
  // Determine which tabs are enabled based on model
  const isBuiltinEnabled = model === 'mimo-v2.5-tts'
  const isDesignEnabled = model === 'mimo-v2.5-tts-voicedesign'
  const isCloneEnabled = model === 'mimo-v2.5-tts-voiceclone'

  // Auto-select voice mode based on model
  const handleModelTabChange = (tab: string) => {
    onVoiceModeChange(tab as VoiceMode)
  }

  return (
    <div>
      <Label className="text-xs text-muted-foreground">Voice Mode</Label>
      <Tabs
        value={voiceMode}
        onValueChange={handleModelTabChange}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="builtin"
            disabled={!isBuiltinEnabled}
          >
            内置音色
          </TabsTrigger>
          <TabsTrigger
            value="design"
            disabled={!isDesignEnabled}
          >
            音色设计
          </TabsTrigger>
          <TabsTrigger
            value="clone"
            disabled={!isCloneEnabled}
          >
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
