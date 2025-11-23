# Buddy - Accessibility Features Documentation

## Overview
Buddy is an AI-powered vision assistance app designed for visually impaired users. It provides multimodal feedback through visual, audio, and tactile channels.

## Spoken Narrative System

### How It Works
When Gemini analyzes a video, it generates:
1. **Structured JSON data** - Technical analysis (objects, distances, positions)
2. **Spoken Narrative** - Natural language paragraph optimized for text-to-speech

### Adaptive Tone Based on Safety Level

The spoken narrative adapts its tone and urgency based on the detected safety level:

#### 🟢 SAFE
- **Tone:** Calm, descriptive, encouraging
- **Example:** "You are in a safe environment. The area ahead is clear with a sidewalk visible. There is a bench on your left about 5 feet away. Continue forward safely."
- **Haptics:** Success pattern (gentle confirmation)

#### 🟡 CAUTION
- **Tone:** Alert but reassuring
- **Example:** "Please be aware that there are pedestrians nearby. Two people are walking about 10 feet ahead of you. The sidewalk narrows slightly on your right. Proceed with awareness."
- **Haptics:** Success pattern + medium feedback

#### 🟠 WARNING
- **Tone:** Urgent, directive
- **Example:** "Caution! There is an obstacle directly in your path. A bicycle is parked 3 feet ahead. Move slightly to your left to navigate around it safely."
- **Haptics:** Success pattern + medium feedback

#### 🔴 DANGER
- **Tone:** Immediate, critical, commanding
- **Example:** "STOP! Immediate hazard detected. A car is approaching rapidly from your left. Do not proceed forward. Wait for the vehicle to pass before continuing."
- **Haptics:** Success pattern + **hazard pattern** (urgent pulsing - 4x heavy vibrations)

## User Experience Flow

### Camera Recording Flow
1. **Tap screen** → Tap feedback (light vibration)
2. **Countdown starts** → "Recording will start in 3 seconds" (TTS)
3. **3... 2... 1...** → Countdown haptic pattern (Light → Medium → Heavy)
4. **Recording starts** → "Recording" (TTS) + Double tap vibration
5. **5 seconds pass** → Auto-stop
6. **Recording stops** → "Recording stopped" (TTS) + Triple tap vibration
7. **Analysis begins** → "Analyzing video" (TTS)
8. **Analysis complete** → "Analysis complete" (TTS) + Success pattern
9. **Narrative plays** → Spoken narrative via TTS (1 second delay)
10. **Danger haptics** → If danger detected, additional hazard pattern (2 second delay)

### UI Display
The results screen shows:

1. **Spoken Narrative Card** (Top Priority)
   - Blue card with speaker icon 🔊
   - Large, readable text (18px, line height 26)
   - "Repeat Audio" button for re-listening
   - Shadow effect for prominence

2. **Scene Overview**
   - Brief scene description
   - White card with blue accent

3. **Safety Level Badge**
   - Color-coded background:
     - Green = Safe
     - Yellow = Caution
     - Orange = Warning
     - Red = Danger
   - Large, bold text

4. **Object Details**
   - List of detected objects
   - Position, distance, urgency
   - Audio descriptions

5. **Recommendations**
   - Action suggestions
   - Orange card

## Haptic Patterns

### Basic Feedback
- **Tap Feedback:** Light impact (button presses)
- **Medium Feedback:** Medium impact (state changes)
- **Heavy Feedback:** Heavy impact (important events)

### Pattern Sequences
- **Success Pattern:** Notification success feedback
- **Error Pattern:** Notification error feedback
- **Warning Pattern:** Notification warning feedback

### Custom Patterns
- **Countdown (3-2-1):** Light → Medium → Heavy
- **Recording Start:** Heavy double tap (100ms gap)
- **Recording Stop:** Medium triple tap (80ms gaps)
- **Analysis Complete:** Success + Light tap
- **Hazard Pattern:** 4x Heavy impacts (150ms gaps) - URGENT

## Speech Service Functions

### Basic Functions
- `speak(text, options?)` - Standard TTS
- `announceUrgent(text)` - High priority (stops current speech)
- `announceSuccess(text)` - Positive feedback
- `announceError(text)` - Error notifications
- `stopAll()` - Stop all speech

### Recording Announcements
- `RecordingAnnouncements.startCountdown()` - "Recording will start in 3 seconds"
- `RecordingAnnouncements.recording()` - "Recording"
- `RecordingAnnouncements.stopped()` - "Recording stopped"
- `RecordingAnnouncements.analyzing()` - "Analyzing video"
- `RecordingAnnouncements.complete()` - "Analysis complete"
- `RecordingAnnouncements.error(message)` - Error notification

### Camera Announcements
- `CameraAnnouncements.ready()` - "Camera ready. Tap anywhere to record"
- `CameraAnnouncements.flipped(facing)` - "Camera switched to front/back facing"

## Technical Details

### Gemini Prompt Integration
The Gemini API prompt has been updated to generate both:
1. Standard JSON response with structured data
2. `spoken_narrative` field with natural language paragraph

The prompt instructs Gemini to:
- Adapt tone based on `safety_level`
- Prioritize hazards in the narrative
- Use natural, flowing language (2-4 sentences)
- Format for text-to-speech (no special symbols)
- Provide clear, actionable guidance

### Code Structure
```
testFeature1/
├── components/
│   ├── CameraRecorder.tsx    # Main camera + TTS integration
│   └── VideoAnalyzer.tsx     # File picker + TTS integration
├── services/
│   └── geminiService.ts      # AI analysis + spoken_narrative generation
└── utils/
    ├── speechService.ts      # Text-to-speech wrapper
    ├── hapticsService.ts     # Vibration patterns
    └── index.ts              # Utility exports
```

## Usage Tips

### For Users
- **Full Screen Tap:** Tap anywhere on camera screen to start recording
- **Red Overlay:** Shows when camera is ready (disappears on touch)
- **Listen Carefully:** Different tones indicate different urgency levels
- **Feel the Vibrations:** Haptic patterns provide important context
- **Replay Button:** Press "🔁 Repeat Audio" to hear the narrative again

### For Developers
- All speech functions are in `utils/speechService.ts`
- All haptic patterns are in `utils/hapticsService.ts`
- Gemini integration is in `services/geminiService.ts`
- Both CameraRecorder and VideoAnalyzer support spoken narratives
- expo-speech works in Expo Go (no development build needed)

## Future Enhancements
- [ ] Voice commands for starting/stopping recording
- [ ] Customizable speech rate and voice
- [ ] Multiple language support
- [ ] Custom haptic intensity settings
- [ ] Offline mode with cached narratives
- [ ] Audio beacons for spatial awareness
