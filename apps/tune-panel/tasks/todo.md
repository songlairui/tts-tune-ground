# TTS API 调试台 - 任务清单

---

## Checkpoint 0: 基础设施

### Task 0.1: 安装 shadcn/ui 缺失组件
- [x] 安装 `tabs`, `card`, `dropdown-menu`, `dialog`, `sonner` 组件
- [x] 验证所有导入正常
- **验收:** `npx shadcn@latest add tabs card dropdown-menu dialog sonner` 成功

### Task 0.2: 验证开发环境
- [x] 运行 `pnpm dev` 确认项目正常启动
- [x] 访问 http://localhost:3000 确认页面正常
- [x] 验证热更新正常工作
- **验收:** 开发服务器稳定运行，无控制台错误

---

## Checkpoint 1: oRPC 后端路由

### Task 1.1: 定义 TTS Zod Schema
- [x] 在 `orpc/schema.ts` 中添加 `TtsRequestSchema` 和 `TtsResponseSchema`
- [x] 导出 TypeScript 类型 `TtsRequest`, `TtsResponse`
- **验收:** TypeScript 类型检查通过，schema 包含所有字段

### Task 1.2: 实现 TTS oRPC 路由
- [x] 创建 `orpc/router/tts.ts`，实现 `generateTts` procedure
- [x] 在 `orpc/router/index.ts` 中聚合 tts 路由
- [x] 处理 API 错误转发
- **验收:** 可以通过 oRPC 客户端调用 tts.generate

### Task 1.3: 创建 React Query hooks
- [x] 创建 `hooks/useTtsGenerate.ts` 封装 mutation
- [x] 创建 `hooks/useLocalStorage.ts` 封装本地存储
- **验收:** useMutation 正确返回 loading/error/data 状态

---

## Checkpoint 2: 表单组件 - 基础配置区

### Task 2.1: API Key 输入组件
- [x] 创建 `components/tts/ApiKeyInput.tsx`
- [x] 输入框 + 掩码显示（只显示首尾）
- [x] 自动保存到 localStorage
- **验收:** 输入 API Key，刷新页面后值依然存在

### Task 2.2: 模型选择 + 音频配置组件
- [x] 创建 `components/tts/ModelSelect.tsx` (3 种模型下拉)
- [x] 创建 `components/tts/AudioConfig.tsx` (格式选择 + 流式开关)
- [x] 实现联动：选 pcm16 自动勾选流式
- **验收:** 模型和格式可以切换，联动逻辑正确

### Task 2.3: 音色模式 Tab 容器
- [x] 创建 `components/tts/VoiceTabs.tsx`
- [x] 三 Tab：内置音色 / 音色设计 / 音色克隆
- [x] 根据当前模型自动禁用不支持的 Tab
- **验收:** 选 mimo-v2.5-tts-voicedesign 时，内置音色和克隆 Tab 禁用

---

## Checkpoint 2b: 表单组件 - 音色模式详情

### Task 2.4: 内置音色选择
- [x] 创建 `components/tts/BuiltinVoice.tsx`
- [x] 8 种音色下拉选择，显示语言和性别
- **验收:** 可以选择全部 8 种音色

### Task 2.5: 音色设计文本框
- [x] 创建 `components/tts/VoiceDesign.tsx`
- [x] 多行文本输入 + 示例 prompt 快速填入按钮
- **验收:** 点击示例按钮可以填入预设文本

### Task 2.6: 音色克隆上传
- [x] 创建 `components/tts/VoiceClone.tsx`
- [x] 拖拽上传 mp3/wav，10MB 限制
- [x] 前端转 base64 data URI
- **验收:** 上传音频后正确生成 data URL

---

## Checkpoint 2c: 表单组件 - 文本编辑区

### Task 2.7: 风格指令输入
- [x] 创建 `components/tts/StyleInput.tsx`
- [x] 多行文本框 + "插入导演模板" 按钮
- **验收:** 点击模板按钮插入三段式模板

### Task 2.8: 标签工具栏
- [x] 创建 `components/tts/TagToolbar.tsx`
- [x] 按分类组织所有标签（情绪/节奏/特征/表情/方言/唱歌）
- [x] 按钮点击即在光标位置插入标签
- **验收:** 可以插入所有类型的标签

### Task 2.9: 合成文本编辑器
- [x] 创建 `components/tts/TextEditor.tsx`
- [x] 多行 textarea，底部显示字数统计
- [x] 标签语法高亮正则：`/(...)/g` 和 `/\[...\]/g` 分别着色
- **验收:** 输入带标签的文本，标签正确高亮

---

## Checkpoint 3: 生成流程打通

### Task 3.1: 生成按钮
- [x] 创建 `components/tts/GenerateButton.tsx`
- [x] 显示 loading 状态，支持取消
- [x] Cmd+Enter 快捷键触发生成
- [x] 错误时显示错误信息
- **验收:** 点击生成按钮，显示 loading 状态，成功后有反馈

### Task 3.2: 请求/响应 JSON 查看器
- [x] 创建 `components/tts/JsonViewer.tsx`
- [x] Tab 切换：请求体 / 响应体 / 错误
- [x] 语法高亮，一键复制
- **验收:** 生成后可以看到完整的请求和响应 JSON

---

## Checkpoint 4: 结果展示区

### Task 4.1: 音频工具函数
- [x] 创建 `lib/audio-utils.ts`
- [x] base64 → Blob 转换
- [x] 触发下载
- [x] 复制 base64 到剪贴板
- **验收:** 可以正确解码 base64 音频

### Task 4.2: 音频播放器
- [x] 创建 `components/tts/AudioPlayer.tsx`
- [x] 原生 audio 元素 + 基础波形
- [x] 播放/暂停控制
- **验收:** 生成的音频可以正常播放

### Task 4.3: 音频操作按钮
- [x] 创建 `components/tts/AudioActions.tsx`
- [x] 下载按钮（wav 文件）
- [x] 复制 base64 按钮
- **验收:** 下载功能正常，复制到剪贴板

---

## Checkpoint 5: 整体组装与样式

### Task 5.1: 主页面布局
- [x] 修改 `routes/index.tsx`
- [x] 上下两栏布局：表单区 + 结果区
- [x] 引入所有组件，组装成完整界面
- **验收:** 所有组件正确显示，无布局错位

### Task 5.2: 整体样式 polish
- [ ] 统一间距、圆角、阴影
- [ ] 添加 hover/active 状态
- [ ] 响应式适配（最小宽度 1200px）
- **验收:** 界面美观，交互反馈流畅

### Task 5.3: 错误处理完善
- [ ] API Key 缺失提示
- [ ] 合成文本为空提示
- [ ] 网络错误提示
- [ ] 解析音频失败提示
- **验收:** 各种错误场景都有友好提示

---

## Checkpoint 6: 最终验证

### Task 6.1: 端到端测试
- [ ] 输入 API Key
- [ ] 选择模型 + 音色
- [ ] 输入风格指令和合成文本
- [ ] 点击生成
- [ ] 播放音频
- [ ] 查看请求/响应 JSON
- [ ] 下载音频文件
- **验收:** 完整流程可以走通

### Task 6.2: 构建验证
- [x] 运行 `pnpm build`
- [x] 确保无 TypeScript 错误
- [x] 确保构建产物正常
- **验收:** 构建成功
