# Xiaomi MiMo TTS API Research

Research Date: 2026-04-29

## API Endpoint

**Base URL:** `https://api.xiaomimimo.com/v1/chat/completions`

**Authentication:** API Key passed via `api-key` header (not `Authorization: Bearer`)

**Important:** This API follows OpenAI-compatible format but with audio-specific extensions.

---

## Supported Models

| Model ID | Capability | Voice Support |
|----------|------------|---------------|
| `mimo-v2.5-tts` | Built-in voices + singing | Use built-in voice list |
| `mimo-v2.5-tts-voicedesign` | Voice design via text description | Auto-generated from text |
| `mimo-v2.5-tts-voiceclone` | Voice cloning via audio sample | Base64 audio data URI |

**Context Limit:** All three models have 8K context window.

**Pricing:** Currently free for limited time.

---

## Built-in Voices

For `mimo-v2.5-tts` model only.

| Voice Name | Language | Gender |
|------------|----------|--------|
| `mimo_default` | Varies by cluster | - |
| `冰糖` (Bingtang) | Chinese | Female |
| `茉莉` (Moli) | Chinese | Female |
| `苏打` (Suda) | Chinese | Male |
| `白桦` (Baihua) | Chinese | Male |
| `Mia` | English | Female |
| `Chloe` | English | Female |
| `Milo` | English | Male |
| `Dean` | English | Male |

---

## API Request Format

### Core Structure

```json
{
  "model": "mimo-v2.5-tts",
  "messages": [
    {
      "role": "user",
      "content": "Natural language style instructions (optional)"
    },
    {
      "role": "assistant",
      "content": "(style tag)Text to synthesize with [audio tags]"
    }
  ],
  "audio": {
    "format": "wav",
    "voice": "Chloe"
  },
  "stream": false
}
```

### Key Fields

#### `messages` Array

- **`user` role (optional for tts/voiceclone, required for voicedesign):** Contains natural language style control instructions
- **`assistant` role (required):** Contains the actual text to be synthesized, with optional style tags

#### `audio` Object

| Field | Values | Description |
|-------|--------|-------------|
| `format` | `wav`, `pcm16` | Audio output format. Use `pcm16` for streaming. |
| `voice` | See voice list | For built-in voices: voice name string<br>For voiceclone: `data:{MIME_TYPE};base64,$BASE64_AUDIO` |

#### Streaming

- **Important:** True low-latency streaming is NOT YET AVAILABLE.
- Current behavior: Streaming mode returns results all-at-once after inference completes (compatibility mode).
- Use `format: "pcm16"` when `stream: true`.
- Audio is 24kHz PCM16LE mono.

---

## Style Control Methods

### Method 1: Natural Language Control (in `user` message)

Place style instructions in the `user` role's `content`.

**Simple example:**
```
Brisk, upbeat tone, slightly faster pace, uncontrollable excitement with pride.
```

**Director Mode (3 dimensions):**
```
[Character] The current head of a century-old noble family...
[Scene] In the shadows of the ancestral hall, watching someone...
[Guidance] Cold, languid yet imposing deep voice. Very slow speaking...
```

### Method 2: Audio Tag Control (in `assistant` message)

Embed style tags directly in the text.

**Overall style tag at beginning:**
```
(Style1 Style2)Content to be synthesized
```

**Fine-grained inline tags:**
```
(nervously, takes a deep breath) Hoo... Calm down... (speaking faster)
```

**Supported bracket formats:** `()`, `（）`, `[]`

#### Recommended Styles

| Category | Examples |
|----------|----------|
| Basic Emotions | Happy, Sad, Angry, Fearful, Excited, Calm |
| Complex Emotions | Melancholy, Relieved, Helpless, Guilty, Tired |
| Tone | Gentle, Cold, Lively, Serious, Lazy, Deep |
| Timbre | Magnetic, Mellow, Clear, Ethereal, Hoarse |
| Character | Clamp voice, Big Sister, Shota, Uncle |
| Dialect | Northeast dialect, Sichuan dialect, Cantonese |
| Role-play | Sun Wukong, Lin Daiyu |
| Singing | `唱歌`, `sing`, `singing` |

**Singing Mode Requirement:** Must add `(唱歌)` tag at very beginning.

#### Inline Audio Tags

| Category | Examples |
|----------|----------|
| Rhythm | Inhale, Deep breath, Sigh, Pant, Hold breath |
| Emotion | Nervous, Scared, Excited, Tired, Coquettish |
| Features | Trembling, Pitch change, Cracked voice, Nasal, Breathiness |
| Expression | Smile, Chuckle, Laugh out loud, Sneer, Sob, Choke |

---

## Voice Design (voicedesign model)

The `user` message contains the voice description. No `voice` field needed in `audio` object.

**Best practices for voice description:**
1. Gender and age: "young woman in her mid-20s"
2. Voice texture: "deep and gravelly", "silky, mellow, and magnetic"
3. Mood/tone: "warm and confident", "gentle but weary"
4. Speed/rhythm: "slow and deliberate", "extremely fast pace"
5. Optionally add: Role, Speaking style, Scene, Era reference

**What to avoid:**
- Contradictory characteristics ("innocent childish voice + CEO aura")
- Post-processing terms: reverb, echo, EQ, compression
- Vague words: "ordinary", "normal", "foreign"

---

## Voice Cloning (voiceclone model)

Pass Base64 audio in the `voice` field:

```json
{
  "audio": {
    "format": "wav",
    "voice": "data:audio/mpeg;base64,SUQzBAAAAAA..."
  }
}
```

**Constraints:**
- Supported formats: mp3, wav
- Base64 + prefix cannot exceed 10 MB
- MIME types: `audio/mpeg`, `audio/mp3`, `audio/wav`

---

## Response Format

### Non-streaming

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "...",
        "audio": {
          "data": "base64 encoded audio data",
          "expires_at": 1234567890
        }
      }
    }
  ]
}
```

### Streaming

Each chunk contains partial audio data. Audio format is 24kHz PCM16LE mono.

---

## Design Implications for the Debug Console

Based on this API research, here are the killer features we can build:

### 1. Dual-Input Editor

The API has two distinct text inputs:
- **Style instruction** (user message): Natural language or director mode
- **Synthesis text** (assistant message): Text with inline tags

→ Design a split editor with clear visual distinction, or a single editor that highlights `(style tags)` and `[audio tags]` with syntax coloring.

### 2. Voice Preview Panel

8 built-in voices + voice design + voice cloning = 3 modes.
- For built-in voices: Hover-to-preview (cached 2-second sample)
- For voice design: Prompt library with examples
- For voice cloning: Audio file upload with visual waveform

### 3. Tag Palette

Since inline audio tags are a key feature, provide:
- Click-to-insert tag library organized by category
- Auto-complete when typing `(` or `[`
- Preview examples for each tag

### 4. Director Mode Template

Provide a structured form for the 3-dimension director mode:
- Character identity field
- Scene description field
- Guidance field with sub-fields (speed, breathiness, articulation)

### 5. Style Library

Save and reuse style prompts:
- Built-in library of common styles ("podcast host", "ASMR", "news anchor")
- User-saved styles

### 6. Audio Format Options

Expose the `format` option:
- wav for regular use
- pcm16 for streaming experiments (even though currently it's compatibility mode)

---

## Open Questions for User

1. **Rate Limits:** The docs don't specify rate limits. Have you encountered any in practice?
2. **Maximum Text Length:** 8K context is mentioned, but what's the practical limit for synthesis text?
3. **Error Cases:** What error codes/messages have you seen?
4. **Streaming Future:** Do you know if/when true low-latency streaming will be available?
