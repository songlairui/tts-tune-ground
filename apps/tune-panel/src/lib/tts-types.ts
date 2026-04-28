// TTS Model Types
export type TtsModel =
  | 'mimo-v2.5-tts'
  | 'mimo-v2.5-tts-voicedesign'
  | 'mimo-v2.5-tts-voiceclone'

export type AudioFormat = 'wav' | 'pcm16'

export type VoiceMode = 'builtin' | 'design' | 'clone'

// Built-in Voice Definitions
export interface BuiltinVoice {
  id: string
  name: string
  language: string
  gender: string
}

export const BUILTIN_VOICES: BuiltinVoice[] = [
  { id: 'mimo_default', name: '默认', language: '中/英', gender: '-' },
  { id: '冰糖', name: '冰糖', language: '中文', gender: '女声' },
  { id: '茉莉', name: '茉莉', language: '中文', gender: '女声' },
  { id: '苏打', name: '苏打', language: '中文', gender: '男声' },
  { id: '白桦', name: '白桦', language: '中文', gender: '男声' },
  { id: 'Mia', name: 'Mia', language: '英文', gender: '女声' },
  { id: 'Chloe', name: 'Chloe', language: '英文', gender: '女声' },
  { id: 'Milo', name: 'Milo', language: '英文', gender: '男声' },
  { id: 'Dean', name: 'Dean', language: '英文', gender: '男声' },
]

// Style Tag Categories
export interface TagCategory {
  name: string
  icon: string
  tags: string[]
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    name: '基础情绪',
    icon: '😊',
    tags: ['开心', '悲伤', '愤怒', '恐惧', '兴奋', '平静'],
  },
  {
    name: '复杂情绪',
    icon: '🎭',
    tags: ['忧郁', '释然', '无助', '愧疚', '疲惫', '紧张'],
  },
  {
    name: '语气',
    icon: '🗣️',
    tags: ['温柔', '冷淡', '活泼', '严肃', '慵懒', '深沉', '甜美', '嘶哑', '优雅'],
  },
  {
    name: '音色',
    icon: '🎵',
    tags: ['磁性', '圆润', '清亮', '空灵', '稚嫩', '苍老'],
  },
  {
    name: '节奏',
    icon: '⏱️',
    tags: ['深吸一口气', '叹气', '喘息', '屏住呼吸', '停顿'],
  },
  {
    name: '声音特征',
    icon: '🔊',
    tags: ['颤抖', '破音', '鼻音', '气声', '沙哑'],
  },
  {
    name: '表情',
    icon: '😄',
    tags: ['微笑', '轻笑', '大笑', '冷笑', '抽泣', '哽咽'],
  },
  {
    name: '方言',
    icon: '🌏',
    tags: ['东北话', '四川话', '粤语', '河南话'],
  },
  {
    name: '唱歌',
    icon: '🎤',
    tags: ['唱歌'],
  },
]

// Director Mode Template
export const DIRECTOR_TEMPLATE = `人设：

场景：

表演指导：
  - 语速：
  - 呼吸：
  - 咬字：
  - 情绪变化：`

// Voice Design Examples
export const VOICE_DESIGN_EXAMPLES = [
  {
    name: 'ASMR 耳语',
    description: '年轻女性，极近距离耳语感，可听到呼吸声和轻微唇音，语速极慢，营造深度放松沉浸感',
  },
  {
    name: '播客主持',
    description: '中年男性，温暖自信，语速适中，像和老朋友聊天一样自然',
  },
  {
    name: '纪录片旁白',
    description: '成熟男声，低沉磁性，语速缓慢庄重，富有历史感和叙事感',
  },
  {
    name: '游戏角色',
    description: '年轻男性，热血中二，语速快，充满自信和斗志',
  },
  {
    name: '新闻主播',
    description: '女性，字正腔圆，吐字清晰，专业严肃，标准普通话',
  },
]
