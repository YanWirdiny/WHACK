# 🚀 Quick Start Guide - TestFeature1

## ✅ What's Been Set Up

Your `testFeature1` folder is ready with:
- ✅ Gemini 2.0 Flash API integration
- ✅ Video upload component
- ✅ JSON response display
- ✅ Required dependencies installed

## 📋 Next Steps

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cd /Users/adage-131/Buddy
cp .env.example .env
```

Then edit `.env` and add your API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Add Test Videos

Place your MP4 test videos in:
```
testFeature1/test-videos/
```

**Recommended video specs:**
- Format: MP4 (H.264)
- Duration: 5-10 seconds
- Resolution: 720p or 1080p
- Size: Under 20MB

### 4. Add Test Screen to Your App

Update `app/(tabs)/_layout.tsx` to add a test tab:

```tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      {/* ... existing tabs ... */}
      <Tabs.Screen
        name="test"
        options={{
          title: 'Test',
          tabBarIcon: ({ color }) => <Text>🧪</Text>,
        }}
      />
    </Tabs>
  );
}
```

Create `app/(tabs)/test.tsx`:

```tsx
import TestFeature1Screen from '@/testFeature1';

export default TestFeature1Screen;
```

### 5. Run the App

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app

## 🎯 How to Use

1. Open the app and navigate to the **Test** tab
2. Tap **"Select Video (MP4)"**
3. Choose an MP4 file from your device
4. Tap **"Analyze with Gemini"**
5. Wait for the analysis (may take 5-30 seconds)
6. View the JSON response with:
   - Scene description
   - Objects detected
   - Distance estimates
   - Safety recommendations

## 📁 Project Structure

```
testFeature1/
├── index.tsx                    # Main screen export
├── components/
│   ├── VideoAnalyzer.tsx        # Video upload & analysis UI
│   └── JsonDisplay.tsx          # JSON formatter component
├── services/
│   └── geminiService.ts         # Gemini API integration
└── test-videos/                 # Place your MP4 files here
    └── README.md
```

## 🔧 Troubleshooting

### "API key not found" error
- Check that `.env` file exists in root directory
- Verify `EXPO_PUBLIC_GEMINI_API_KEY` is set correctly
- Restart the Expo dev server after adding `.env`

### "Failed to analyze video" error
- Check internet connection
- Ensure video is MP4 format
- Try a smaller video file (< 20MB)
- Check API key is valid

### Video picker not working
- On iOS: Need to run in simulator or physical device (not Expo Go for some features)
- On Android: Grant storage permissions

### Slow analysis
- Large videos take longer to upload
- Gemini API response time varies (5-30 seconds typical)
- Consider using shorter video clips

## 📊 Example Output

```json
{
  "scene": "Pedestrian crossing at urban intersection",
  "objects": [
    {
      "name": "car",
      "position": "left side of frame",
      "distance_category": "VERY CLOSE",
      "distance_estimate": "approximately 15 feet, about 2 car lengths",
      "urgency": "high",
      "audio_description": "Red sedan approaching from left, very close",
      "confidence": 0.95
    },
    {
      "name": "crosswalk",
      "position": "center, at ground level",
      "distance_category": "IMMEDIATE",
      "distance_estimate": "directly at your feet",
      "urgency": "medium",
      "audio_description": "Crosswalk markings visible ahead",
      "confidence": 0.92
    }
  ],
  "recommendation": "Wait for car to pass before crossing",
  "safety_level": "caution"
}
```

## 🎨 Customization

### Modify the Analysis Prompt

Edit `testFeature1/services/geminiService.ts` to change what Gemini focuses on:

```typescript
const prompt = `
Your custom prompt here...
Focus on: [specific objects]
Return format: [your desired JSON structure]
`;
```

### Adjust Distance Categories

Change the distance ranges in the prompt to match your needs.

### Add Audio Playback

Install `expo-speech`:
```bash
npx expo install expo-speech
```

Then add text-to-speech for the audio descriptions.

## 🔐 Security Notes

- **Never commit `.env` file** to git (already in .gitignore)
- API keys are sensitive - don't share them
- Consider rate limiting for production use
- Gemini API has usage quotas - monitor your usage

## 📚 Additional Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [Expo File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo Document Picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)

## 🆘 Need Help?

Check the console logs for detailed debugging information. All API calls and responses are logged with emojis for easy identification:
- 📹 Video operations
- 🚀 API requests
- ✅ Successful operations
- ❌ Errors
