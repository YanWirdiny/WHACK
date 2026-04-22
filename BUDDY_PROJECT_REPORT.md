# Buddy — Full Project Report
> Last updated: 2026-03-29
> Status: Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [What We Have Implemented](#4-what-we-have-implemented)
   - 4.1 [Entry Point & Navigation](#41-entry-point--navigation)
   - 4.2 [Loading Screen](#42-loading-screen)
   - 4.3 [Live Analyzer](#43-live-analyzer)
   - 4.4 [Live Gemini Service](#44-live-gemini-service)
   - 4.5 [ElevenLabs TTS Service](#45-elevenlabs-tts-service)
   - 4.6 [Haptics Service](#46-haptics-service)
   - 4.7 [Legacy: Video Analyzer & Gemini Video Service](#47-legacy-video-analyzer--gemini-video-service)
5. [What We Are Currently Working On](#5-what-we-are-currently-working-on)
   - 5.1 [UI Polish — Loading Screen Redesign](#51-ui-polish--loading-screen-redesign)
   - 5.2 [Accessibility / Audio-First Interaction Research](#52-accessibility--audio-first-interaction-research)
6. [Identified Issues (Pending Fixes)](#6-identified-issues-pending-fixes)
7. [What We Planned To Do Next](#7-what-we-planned-to-do-next)
   - 7.1 [MediaPipe Object Detection](#71-mediapipe-object-detection)
   - 7.2 [Audio UX Improvements](#72-audio-ux-improvements)
8. [Development Environment Notes](#8-development-environment-notes)
9. [API Keys & Configuration](#9-api-keys--configuration)

---

## 1. Project Overview

**Buddy** is an assistive mobile application built for **visually impaired users**.

The core idea is simple: the user holds their phone and the app continuously watches the world through the camera, speaks what it sees, and vibrates to warn of danger — all without the user needing to look at the screen.

### Core Principles
- **Audio-first** — every important event must be spoken or sonified, never just visual
- **Real-time** — continuous analysis, not on-demand only
- **Minimal token usage** — differential (change-only) analysis to avoid burning Gemini API quota on static scenes
- **Safety-prioritized output** — hazards always reported first, decorative content ignored

### Target User
A blind or visually impaired person walking in a real-world environment (street, indoors, public space) who needs instant, concise audio feedback about their surroundings.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Routing | Expo Router (file-based) |
| Camera | `react-native-vision-camera` v4 |
| AI / Scene Analysis | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Text-to-Speech | ElevenLabs REST API via `expo-av` |
| Haptics | `expo-haptics` |
| Animations | `react-native-reanimated` v4 |
| Gestures | `react-native-gesture-handler` |
| File System | `expo-file-system` (legacy) |
| Fonts | `expo-font` — Cormorant Garamond (loaded in `_layout.tsx`) |
| Language | TypeScript |

---

## 3. Project Structure

```
Buddy/
├── app/
│   ├── _layout.tsx              ← Root layout, loads fonts, navigation shell
│   └── (tabs)/
│       ├── _layout.tsx          ← Tab bar config
│       └── index.tsx            ← Entry tab → delegates to testFeature1/
│
├── testFeature1/
│   ├── index.tsx                ← Screen: shows LoadingScreen → then LiveAnalyzer
│   │
│   ├── components/
│   │   ├── LoadingScreen.tsx    ← Splash/loading screen (recently redesigned)
│   │   ├── LiveAnalyzer.tsx     ← CORE: continuous live camera analysis
│   │   ├── CameraRecorder.tsx   ← Legacy: manual video recording UI
│   │   ├── videoAnalyzer.tsx    ← Legacy: video analysis display
│   │   └── JsonDisplay.tsx      ← Legacy: debug JSON viewer
│   │
│   ├── services/
│   │   ├── liveGeminiService.ts ← Differential frame analysis (main AI engine)
│   │   ├── geminiService.ts     ← Legacy: full video analysis
│   │   └── VideoConversion.ts   ← Legacy: video format utilities
│   │
│   └── utils/
│       ├── elevenLabsService.ts ← TTS: voices, speak functions, audio playback
│       ├── hapticsService.ts    ← Vibration patterns for all app states
│       ├── speechService.ts     ← (utility, supporting speech helpers)
│       └── index.ts             ← Barrel export
│
└── assets/
    ├── logo.png                 ← App logo used in LoadingScreen + LiveAnalyzer
    └── fonts/
        ├── CormorantGaramond-Regular.ttf
        └── CormorantGaramond-Light.ttf
```

---

## 4. What We Have Implemented

### 4.1 Entry Point & Navigation

**File:** `testFeature1/index.tsx`

The app entry point manages a simple two-state flow:

```
App opens
  └── isLoading = true  →  show <LoadingScreen>
        └── onLoadingComplete()  →  isLoading = false  →  show <LiveAnalyzer>
```

No complex navigation needed at this stage. The entire app is a single screen experience post-load.

---

### 4.2 Loading Screen

**File:** `testFeature1/components/LoadingScreen.tsx`

Recently redesigned to match a warm, elegant visual identity. The design was based on a custom HTML prototype and translated to React Native.

#### Visual Elements
| Element | Description |
|---|---|
| Background | Warm parchment (`#FAF3F0`) |
| Glow | Blush-colored radial circle behind logo, breathing animation |
| Logo | `assets/logo.png`, 185×185, with drop shadow |
| Wordmark | "Buddy" in **Cormorant Garamond** serif, 62px, wide letter spacing, indigo |
| Subtitle | "Vision Assistance AI" — 10px uppercase, 50% opacity |
| Divider | `line · dot · line` decorative separator |
| Progress bar | 2px thin track, blush-to-red fill, animated 0%→100% over 2.8s |
| Progress label | "Initializing" — blinking uppercase text |
| Version | `v1.0 · beta` — bottom, very faint |
| Home bar | Decorative iPhone-style home indicator pill at bottom |

#### Animation System (Reanimated)
All animations use `useSharedValue` + `useAnimatedStyle`:

| Value | Animation |
|---|---|
| `contentOpacity` + `contentY` | Fade in + slide up 14px on mount (700ms) |
| `glowScale` + `glowOpacity` | Infinite breathing: scale 1↔1.08, opacity 1↔0.8, period 5s |
| `progressWidth` | 0%→100% over 2800ms with bezier easing |
| `labelOpacity` | Infinite blink: 0.4↔0.85, period 2s |

After **4 seconds**, fades out and calls `onLoadingComplete()`.

#### Custom Font
`CormorantGaramond-Regular.ttf` and `CormorantGaramond-Light.ttf` are stored in `assets/fonts/` and loaded in `app/_layout.tsx` using `useFonts`.

---

### 4.3 Live Analyzer

**File:** `testFeature1/components/LiveAnalyzer.tsx`

This is the **core of the entire app**. It runs continuously in the background, watching the camera and speaking what changes.

#### System States

```
idle  →  calibrating  →  monitoring  ⇄  on_demand
```

| State | Meaning |
|---|---|
| `idle` | Before camera permission granted |
| `calibrating` | First 3 frames being analyzed to build a baseline |
| `monitoring` | Continuous differential analysis running |
| `on_demand` | User double-tapped — full deep scan in progress |

#### Live Analysis Loop (every 1500ms)
1. Take a photo silently via `cameraRef.takePhoto()`
2. Read it as base64 from the file system
3. First 3 frames → `baseline` mode → builds `baselineSummaryRef`
4. After baseline → `differential` mode → only reports what changed vs. baseline
5. If `result.has_change === true` → speak `result.spoken_narrative` via ElevenLabs
6. If `result.safety_level === 'danger'` → trigger `hazardPattern()` haptics

#### Double Tap — On-Demand Full Scan
- User double-taps anywhere on screen
- Fires `triggerOnDemandScan()`
- Sends frame in `on_demand` mode → gets a thorough 3–5 sentence full description
- Returns to `monitoring` when done

#### Visual UI (for sighted companions / developer reference)
| Element | Position | Purpose |
|---|---|---|
| Full-screen camera feed | Background | Shows what the camera sees |
| Danger/Warning banner | Top | Red/orange/yellow banner when hazard detected |
| Status badge | Top center | Shows current state (Calibrating / Live / Full scan…) |
| Siri-style wave bars | Bottom center | Animated — active when speaking or scanning |
| App logo | Above wave | Always visible |
| "Double tap" hint | Very bottom | Text hint for sighted users only |

#### Safety Level → Wave Color
| Safety Level | Wave Color |
|---|---|
| `safe` | Parchment white |
| `caution` | Amber `#FFC107` |
| `warning` | Orange `#FF9800` |
| `danger` | Red `#FF4143` |

---

### 4.4 Live Gemini Service

**File:** `testFeature1/services/liveGeminiService.ts`
**Model:** `gemini-2.5-flash`

This service is the AI brain. It takes a camera frame (base64 JPEG) and returns structured JSON analysis.

#### Three Analysis Modes

**1. Baseline mode**
- Called on the first 3 frames at startup
- Builds a full spatial map of the environment
- Returns `scene_summary` which is stored and used for all future differential comparisons

**2. Differential mode**
- Called every 1.5s after baseline
- Compares current frame against the stored `baselineSummaryRef`
- Returns `has_change: false` if nothing meaningful changed (stays silent)
- Only speaks when something actually changed — avoids noise

**3. On-demand mode**
- Triggered by user double-tap
- Returns a thorough 3–5 sentence description of the full scene
- No baseline comparison, always speaks

#### Response Schema
```typescript
interface LiveAnalysisResult {
  mode: 'baseline' | 'differential' | 'on_demand';
  has_change: boolean;
  safety_level: 'safe' | 'caution' | 'warning' | 'danger';
  spoken_narrative: string;   // what ElevenLabs will speak
  hazards: LiveHazard[];
  scene_summary?: string;     // baseline only
}

interface LiveHazard {
  name: string;
  position: 'left' | 'center' | 'right';
  distance_estimate: string;  // e.g. "3 steps ahead"
  urgency: 'critical' | 'high' | 'medium' | 'low';
  action: string;             // e.g. "move left"
}
```

#### Prompt Design Philosophy
- Hazard-first output (never decorative descriptions)
- Instructs Gemini to stay silent (`has_change: false`) when nothing relevant changed
- Differential prompt passes the stored `baselineSummary` string for comparison
- "Silence is better than noise" — the model is explicitly instructed to not alert unless it matters

---

### 4.5 ElevenLabs TTS Service

**File:** `testFeature1/utils/elevenLabsService.ts`

Handles all text-to-speech output. Uses ElevenLabs REST API, downloads audio as base64, plays via `expo-av`.

#### Voice Roster
| Key | Voice Name | Character | Used For |
|---|---|---|---|
| `default` | Rachel | Warm, friendly female | General / safe |
| `male` | Adam | Deep, confident | Warnings |
| `calm` | Antoni | Well-rounded | Calibrating, state transitions |
| `female` | Bella | Soft, gentle | (available) |

#### Key Functions
| Function | What It Does |
|---|---|
| `speak(text, options)` | Core function — calls API, plays audio, waits for completion |
| `speakUrgent(text)` | High stability male voice — for danger alerts |
| `speakCalm(text)` | Calm voice, expressive — for state announcements |
| `speakNarrative(text, safetyLevel)` | Adaptive — picks voice based on danger level |
| `stopAll()` | Stops and unloads any currently playing audio |

#### Audio Flow
```
text → ElevenLabs API (eleven_turbo_v2_5 model)
     → ArrayBuffer response
     → base64 encode
     → expo-av Sound.createAsync()
     → play + await completion
     → unload
```

#### Announcement Presets
```typescript
CameraAnnouncements.ready()           // "Camera ready. Tap anywhere to record"
RecordingAnnouncements.recording()    // "Recording"
RecordingAnnouncements.analyzing()    // "Analyzing video"
```

---

### 4.6 Haptics Service

**File:** `testFeature1/utils/hapticsService.ts`

Provides tactile feedback for all app events using `expo-haptics`.

#### Haptic Patterns
| Function | Pattern | Used When |
|---|---|---|
| `tapFeedback()` | Light single pulse | Button taps |
| `mediumFeedback()` | Medium single pulse | State changes |
| `heavyFeedback()` | Heavy single pulse | Important actions |
| `successPattern()` | System success notification | Analysis complete |
| `warningPattern()` | System warning notification | Warning level hazard |
| `errorPattern()` | System error notification | App error |
| `countdownPattern(n)` | Light/medium/heavy for 3/2/1 | Countdown timer |
| `recordingStartPattern()` | Double heavy pulse (100ms apart) | Recording starts |
| `recordingStopPattern()` | Triple medium pulse (80ms apart) | Recording stops |
| `analysisCompletePattern()` | Success + light pulse | Scan done |
| `hazardPattern()` | 4× heavy pulses (150ms apart) | Danger detected |
| `tapToRecordFeedback()` | Heavy single | Double tap registered |

---

### 4.7 Legacy: Video Analyzer & Gemini Video Service

**Files:** `testFeature1/components/CameraRecorder.tsx`, `videoAnalyzer.tsx`, `services/geminiService.ts`

These are the **original version** of Buddy before live analysis was built. They implement a manual record-then-analyze flow:

1. User taps to record a short video clip
2. Video is read as base64 and sent to Gemini (`gemini-2.5-flash`)
3. Results shown in a JSON display

**Status:** Still in the codebase but no longer used in the main app flow. Kept as reference. The `liveGeminiService.ts` + `LiveAnalyzer.tsx` replaced this approach entirely.

The video Gemini prompt is highly detailed — it defines 5 distance categories (IMMEDIATE, VERY CLOSE, CLOSE, MEDIUM, FAR), explicit hazard types to report, and instructs Gemini to use past tense due to processing latency.

---

## 5. What We Are Currently Working On

### 5.1 UI Polish — Loading Screen Redesign

**Status: Just completed.**

The LoadingScreen was redesigned from a dark-themed placeholder to a warm, elegant splash screen matching a custom HTML prototype. Work done:

- [x] Rebuilt all visual elements (background, glow, wordmark, divider, progress bar, home bar)
- [x] Replaced dark theme with warm parchment palette
- [x] Implemented breathing glow animation
- [x] Downloaded and integrated Cormorant Garamond serif font (TTF)
- [x] Loaded font in `app/_layout.tsx` with `useFonts`
- [x] Applied `fontFamily: "CormorantGaramond-Regular"` to the "Buddy" wordmark

---

### 5.2 Accessibility / Audio-First Interaction Research

**Status: Research complete, implementation pending.**

We did a deep analysis of the current `LiveAnalyzer.tsx` interaction model and identified 5 critical gaps for visually impaired users in real-world conditions.

#### Identified Gaps

| # | Issue | Current Behavior | Impact |
|---|---|---|---|
| 1 | **Silent gesture gap** | Double tap registered, but nothing plays until ElevenLabs TTS finishes loading | User doesn't know if tap registered |
| 2 | **Silent state transitions** | `on_demand → monitoring` has no audio announcement | User doesn't know scan ended |
| 3 | **Visual-only hint** | "Double tap for full scan" is a `<Text>` element — never spoken | Blind users never learn this gesture |
| 4 | **Error silence** | `catch` blocks only `console.error()` | User hears nothing when something fails |
| 5 | **No speech interruption** | Danger alerts wait for current speech to finish | In an emergency, old content delays the alert |

---

## 6. Identified Issues (Pending Fixes)

These are prioritized fixes ready to implement, in order of user safety impact:

### Priority 1 — Earcon for gesture confirmation
**Problem:** Double tap → silent gap (300–800ms) → TTS starts
**Fix:** Play a short non-speech sound (earcon) via `expo-av` immediately on double tap register — before ElevenLabs fires
**Target latency:** < 50ms
**Tool:** `expo-av` (already installed)

### Priority 2 — Speak all state transitions
**Problem:** State changes are silent
**Fix:** Add spoken announcements for every state transition:

```
calibrating → monitoring   →  "Ready. Monitoring."
monitoring  → on_demand    →  "Scanning now."
on_demand   → monitoring   →  "Done. Back to monitoring."
any error                  →  "Error. Try again."
```

Also: speak the double-tap hint **once** after first calibration completes:
> "Ready. Double tap anytime for a full description."

### Priority 3 — Interrupt logic for danger
**Problem:** Danger alert waits for current speech to finish
**Fix:** Call `stopAll()` before speaking any `danger`-level narrative — it must preempt everything

### Priority 4 — Shorten spoken narratives
**Problem:** Gemini prompts may produce long sentences not suited for a walking user in a noisy environment
**Fix:** Tighten the prompt constraints. Target format:
- Bad: *"I have detected a vehicle approaching from the left side of the frame at approximately eight steps distance."*
- Good: *"Car on left, close."* / *"Step down ahead."*

### Priority 5 — Urgency speech queue
**Problem:** All speech queued equally
**Fix:** Implement 3-tier queue:

| Level | Behavior |
|---|---|
| `danger` | Interrupt immediately — call `stopAll()` then speak |
| `warning` | Wait for current sentence to finish, then speak |
| `caution` | Queue — speak only when idle |

---

## 7. What We Planned To Do Next

### 7.1 MediaPipe Object Detection

**Status: Deferred — implement after UI updates are complete.**

#### What it is
Real-time on-device object detection with bounding boxes drawn on the live camera feed. Each detected object gets a labeled rectangle that moves with it in real time.

#### Why MediaPipe
- Runs **100% on-device** — no API calls, no tokens consumed
- Designed for mobile real-time use — very fast
- Complementary to Gemini (Gemini does scene understanding, MediaPipe does object tracking)

#### What it would add to Buddy
- Visual overlay of detected objects for sighted companions
- Could power audio cues: "3 objects detected ahead" without a Gemini call
- Potential to replace or reduce Gemini differential calls for common objects

#### Implementation Plan (when ready)
```
1. Install: @mediapipe/tasks-vision (or React Native equivalent)
2. Hook into Vision Camera frame processor
3. Draw bounding boxes + labels as an overlay View on top of camera
4. Optionally: trigger haptic/audio on objects in center-path bounding box
```

#### Stack Options Evaluated

| Option | Setup | Speed | Object Types |
|---|---|---|---|
| **MediaPipe Tasks** | Easy | Fast | Configurable |
| TensorFlow.js COCO-SSD | Medium | OK | 80 common types |
| ONNX Runtime | Hard | Fastest | Anything (custom model) |

**Chosen:** MediaPipe Tasks — best balance of ease and performance for React Native mobile.

---

### 7.2 Audio UX Improvements

All 5 issues listed in section 6 need implementation. In addition, longer-term audio improvements to research:

- **Spatial audio cues** — left/right panning to indicate hazard position
- **Variable speech rate** — faster speech for danger, slower for safe
- **Earcon library** — distinct sounds for: gesture confirm, scan start, scan end, danger, all-clear
- **Offline TTS fallback** — `expo-speech` as fallback if ElevenLabs is unreachable

---

## 8. Development Environment Notes

### Running the App

```bash
# Standard (same WiFi required)
npx expo start

# Cross-network (phone and Mac on different WiFi)
npx expo start --tunnel

# USB cable (most reliable, no network needed)
npx expo run:ios --device

# Clear Metro cache if issues
npx expo start --clear
```

### Known Dev Issues

| Issue | Cause | Solution |
|---|---|---|
| `No script URL provided` | Phone and Mac on different WiFi | Use `--tunnel` or USB |
| `TurboModuleManager: Timed out` | Native module (camera/audio) slow to teardown on hot reload | Normal in dev, use full rebuild |
| Font not applying | `useFonts` hasn't resolved yet | Fonts load async — brief system font flash is normal |

### Environment Variables Required

```
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_ELEVENLABS_API_KEY=...
```

---

## 9. API Keys & Configuration

| Service | Variable | Where Used |
|---|---|---|
| Google Gemini | `EXPO_PUBLIC_GEMINI_API_KEY` | `liveGeminiService.ts`, `geminiService.ts` |
| ElevenLabs | `EXPO_PUBLIC_ELEVENLABS_API_KEY` | `elevenLabsService.ts` |

Both keys are read via `process.env.EXPO_PUBLIC_*` which Expo exposes to the JS bundle at build time.

The Gemini service currently uses **`gemini-2.5-flash`** — the fastest and most cost-efficient model in the Gemini 2.5 family. Differential mode minimizes token usage by only sending a frame + baseline summary string rather than full re-analysis every 1.5 seconds.

ElevenLabs uses the **`eleven_turbo_v2_5`** model — optimized for low-latency TTS, which is critical for real-time safety use.

---

*Report generated from codebase reading + session memory — 2026-03-29*
