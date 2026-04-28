# TTS API 调试台 - 技术方案

## 1. 目录结构设计

```
apps/tune-panel/src/
├── orpc/
│   ├── schema.ts                # Zod schemas
│   │   └── # 新增: TTS 相关 schemas
│   ├── router/
│   │   ├── index.ts             # 路由聚合
│   │   ├── todos.ts             # 示例路由（保留）
│   │   └── tts.ts               # ✨ 新增：TTS API 代理
│   └── client.ts                # oRPC 客户端
│
├── components/
│   ├── ui/                      # shadcn/ui 组件（已有）
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── label.tsx
│   │   ├── switch.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx             # ✨ 新增
│   │   ├── card.tsx             # ✨ 新增
│   │   ├── dropdown-menu.tsx    # ✨ 新增
│   │   ├── dialog.tsx           # ✨ 新增
│   │   └── sonner.tsx           # ✨ 新增（toast）
│   │
│   ├── tts/                     # ✨ TTS 业务组件
│   │   ├── ApiKeyInput.tsx      # API Key 配置
│   │   ├── ModelSelect.tsx      # 模型选择
│   │   ├── AudioConfig.tsx      # 音频格式 + 流式开关
│   │   ├── VoiceTabs.tsx        # 音色模式三 Tab
│   │   ├── BuiltinVoice.tsx     # 内置音色选择
│   │   ├── VoiceDesign.tsx      # 音色设计文本框
│   │   ├── VoiceClone.tsx       # 音色克隆上传
│   │   ├── StyleInput.tsx       # 风格指令 + 导演模板
│   │   ├── TextEditor.tsx       # 合成文本编辑器 + 标签高亮
│   │   ├── TagToolbar.tsx       # 标签插入工具栏
│   │   ├── GenerateButton.tsx   # 生成按钮
│   │   ├── JsonViewer.tsx       # 请求/响应 JSON 查看
│   │   ├── AudioPlayer.tsx      # 音频播放器 + 波形
│   │   └── AudioActions.tsx     # 下载/复制按钮
│   │
│   └── layout/
│       └── Panel.tsx            # 面板容器组件
│
├── hooks/                       # ✨ React Query hooks
│   ├── useTtsGenerate.ts        # TTS 生成 Mutation
│   ├── useAudioBuffer.ts        # 音频缓存 Query
│   └── useLocalStorage.ts       # localStorage 同步
│
├── lib/
│   ├── utils.ts                 # 已有工具函数
│   ├── tts-types.ts             # ✨ TTS 类型定义
│   ├── tag-parser.ts            # ✨ 标签语法解析器
│   └── audio-utils.ts           # ✨ 音频处理工具（base64 → Blob 等）
│
├── routes/
│   ├── __root.tsx
│   └── index.tsx                # 主页面：组装所有组件
│
└── styles.css                   # 全局样式 + 标签高亮 CSS
```

---

## 2. 核心组件划分和职责

### 数据流向设计

```
LocalStorage (apiKey, settings)
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                   TanStack Query                          │
│  ┌─────────────┐    ┌─────────────────────────────┐     │
│  │ useLocalStorage │    │ useTtsGenerateMutation    │     │
│  └─────────────┘    └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    oRPC Server                            │
│              (tts.generate 代理请求)                      │
└─────────────────────────────────────────────────────────┘
       │
       ▼
    Xiaomi MIMO API
```

### 组件职责分层

| 组件 | 职责 | 依赖 |
|------|------|------|
| `ApiKeyInput.tsx` | 输入、保存、显示 API Key | useLocalStorage |
| `ModelSelect.tsx` | 3 种模型下拉选择 | 无 |
| `AudioConfig.tsx` | 格式选择 + 流式开关，联动逻辑 | 无 |
| `VoiceTabs.tsx` | 三 Tab 切换容器，根据模型禁用 Tab | ModelSelect 值 |
| `BuiltinVoice.tsx` | 8 种音色下拉选择 | 仅 mimo-v2.5-tts 可用 |
| `VoiceDesign.tsx` | 音色描述文本框 + 示例按钮 | 仅 voicedesign 可用 |
| `VoiceClone.tsx` | 音频上传 + 预览 + Base64 转换 | 仅 voiceclone 可用 |
| `StyleInput.tsx` | 风格指令文本 + 导演模板插入 | 无 |
| `TagToolbar.tsx` | 分类标签插入按钮 | TextEditor |
| `TextEditor.tsx` | 多行编辑器 + 标签语法高亮 | TagToolbar |
| `GenerateButton.tsx` | 生成按钮 + 状态反馈 | useTtsGenerateMutation |
| `JsonViewer.tsx` | 请求/响应 JSON 展示 | useTtsGenerateMutation |
| `AudioPlayer.tsx` | 波形可视化播放器 | AudioActions |
| `AudioActions.tsx` | 下载 + 复制 base64 | useTtsGenerateMutation |

---

## 3. oRPC 路由设计

### 3.1 Schema 定义 (`orpc/schema.ts`)

```typescript
import { z } from 'zod'

export const TtsRequestSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  model: z.enum([
    'mimo-v2.5-tts',
    'mimo-v2.5-tts-voicedesign',
    'mimo-v2.5-tts-voiceclone',
  ]),
  userMessage: z.string().optional(),
  assistantMessage: z.string().min(1),
  audioFormat: z.enum(['wav', 'pcm16']),
  voice: z.string().optional(), // built-in voice name OR base64 data URI
  stream: z.boolean().default(false),
})

export const TtsResponseSchema = z.object({
  id: z.string(),
  audioData: z.string(), // base64
  format: z.string(),
  contentType: z.string(),
  requestBody: z.string(), // JSON string
  responseBody: z.string(), // JSON string
})

export type TtsRequest = z.infer<typeof TtsRequestSchema>
export type TtsResponse = z.infer<typeof TtsResponseSchema>
```

### 3.2 oRPC 路由 (`orpc/router/tts.ts`)

```typescript
import { procedure } from '../server'
import { TtsRequestSchema } from '../schema'

export const generateTts = procedure
  .input(TtsRequestSchema)
  .mutation(async ({ input }) => {
    const { apiKey, model, userMessage, assistantMessage, audioFormat, voice, stream } = input

    // 构造小米 MIMO API 请求
    const requestBody = {
      model,
      messages: [
        ...(userMessage ? [{ role: 'user', content: userMessage }] : []),
        { role: 'assistant', content: assistantMessage },
      ],
      audio: {
        format: audioFormat,
        ...(voice ? { voice } : {}),
      },
      stream,
    }

    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const audioData = data.choices?.[0]?.message?.audio?.data

    if (!audioData) {
      throw new Error('No audio data in response')
    }

    return {
      id: Date.now().toString(),
      audioData,
      format: audioFormat,
      contentType: audioFormat === 'wav' ? 'audio/wav' : 'audio/pcm',
      requestBody: JSON.stringify(requestBody, null, 2),
      responseBody: JSON.stringify(data, null, 2),
    }
  })
```

---

## 4. React Query Key 设计

### Query Keys (按 namespace 组织)

```typescript
// keys/query-keys.ts
export const queryKeys = {
  settings: {
    all: ['settings'] as const,
    apiKey: ['settings', 'apiKey'] as const,
  },
  audio: {
    buffer: (id: string) => ['audio', 'buffer', id] as const,
  },
  history: {
    all: ['history'] as const,
    item: (id: string) => ['history', id] as const,
  },
} as const
```

### Mutation Keys（隐式，使用 procedure path）

- `tts.generate` - oRPC 自动生成的 mutation key

---

## 5. 状态管理方案

### 5.1 表单状态（React Hook Form / TanStack Form）

```typescript
// hooks/useTtsForm.ts
export function useTtsForm() {
  return useForm({
    defaultValues: {
      model: 'mimo-v2.5-tts',
      audioFormat: 'wav',
      stream: false,
      voiceMode: 'builtin' as 'builtin' | 'design' | 'clone',
      builtinVoice: 'mimo_default',
      voiceDescription: '',
      voiceCloneBase64: '',
      userMessage: '',
      assistantMessage: '你好，欢迎使用 TTS 调试台！',
    },
  })
}
```

### 5.2 本地存储状态（useLocalStorage + React Query）

```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  return useQuery({
    queryKey: ['localStorage', key],
    queryFn: () => {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    },
    staleTime: Infinity,
    initialData: initialValue,
  })
}

export function useSetLocalStorage() {
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => {
      window.localStorage.setItem(key, JSON.stringify(value))
      return Promise.resolve()
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['localStorage', key] })
    },
  })
}
```

---

## 6. 依赖关系图

```
orpc/schema.ts
    │
    ├─→ orpc/router/tts.ts
    │     │
    │     └─→ orpc/client.ts ──→ orpc Tanstack utils
    │
    └─→ lib/tts-types.ts
          │
          ├─→ hooks/useTtsGenerate.ts
          │     └─→ GenerateButton.tsx, JsonViewer.tsx
          │
          └─→ components/tts/*
                │
                └─→ routes/index.tsx (主页面组装)
```

---

## 7. 任务分组与检查点

**Checkpoint 0:** 基础设施就绪（完成后验证 dev server 正常启动）

**Checkpoint 1:** oRPC 路由就绪（完成后用 curl 可以测试 TTS 代理）

**Checkpoint 2:** 表单区域完成（完成后所有输入控件可用，值可以正确获取）

**Checkpoint 3:** 生成流程打通（完成后点击生成按钮可以调用 API，获取响应）

**Checkpoint 4:** 结果展示完成（完成后音频可以播放，JSON 可以查看）

**Checkpoint 5:** 整体联调 + 样式 polish
