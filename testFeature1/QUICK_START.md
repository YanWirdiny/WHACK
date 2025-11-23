# 🚀 Quick Reference - TestFeature1

## ⚡ 30-Second Setup

```bash
# 1. Get API key from: https://aistudio.google.com/app/apikey

# 2. Create .env file
echo "EXPO_PUBLIC_GEMINI_API_KEY=your_key_here" > .env

# 3. Run app
npm start

# 4. Go to "Test" tab → Select video → Analyze
```

## 📁 File Locations

| What | Where |
|------|-------|
| **Add API Key** | `.env` (root folder) |
| **Test Videos** | `testFeature1/test-videos/` |
| **Test Screen** | App → "Test" tab |
| **Main Code** | `testFeature1/services/geminiService.ts` |

## 🎯 How It Works

```
Video (.mp4) 
  → Upload to Gemini 2.0 Flash
    → AI Analysis
      → JSON Response with objects, distances, safety info
        → Display on screen
```

## 🔧 Key Functions

### Analyze Video
```typescript
import { analyzeVideoWithGemini } from './services/geminiService';

const result = await analyzeVideoWithGemini(videoUri);
// Returns: { scene, objects[], recommendation, safety_level }
```

### Object Structure
```typescript
{
  name: "car",
  position: "left side",
  distance_category: "VERY CLOSE",
  distance_estimate: "15 feet",
  urgency: "high",
  audio_description: "Car approaching from left"
}
```

## 📊 Distance Categories

| Category | Real Distance | Meaning |
|----------|---------------|---------|
| IMMEDIATE | 0-5 ft | Within reach |
| VERY CLOSE | 5-15 ft | Few steps away |
| CLOSE | 15-30 ft | Across street |
| MEDIUM | 30-50 ft | Down the block |
| FAR | 50+ ft | In distance |

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "API key not found" | Add to `.env`, restart server |
| Slow analysis | Use shorter videos (< 10 sec) |
| Upload fails | Check MP4 format, < 20MB |
| No results | Check console logs, verify API key |

## 📱 Testing Tips

✅ **Good Test Videos:**
- Street crossing scenes
- Indoor hallways
- People walking
- 5-10 seconds long
- 720p or 1080p
- < 20MB file size

❌ **Avoid:**
- Very long videos (> 30 sec)
- Very large files (> 50MB)
- Low quality videos
- Non-MP4 formats

## 🎨 Customization

### Change What AI Detects
Edit: `testFeature1/services/geminiService.ts`
Line: ~50 (the prompt variable)

### Change UI Colors
Edit: `testFeature1/components/VideoAnalyzer.tsx`
Section: StyleSheet at bottom

### Add New Features
- Audio playback: `expo-speech`
- Haptic alerts: `expo-haptics` (already installed)
- Camera: `expo-camera`

## 📞 Get Help

- Console logs: Check Expo terminal
- Full docs: `testFeature1/SETUP.md`
- Summary: `testFeature1/SUMMARY.md`

---

**Ready to test!** Just add your API key and select a video. 🎥
