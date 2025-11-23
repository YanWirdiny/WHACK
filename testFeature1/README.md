# TestFeature1 - Gemini 2.0 Flash Video Analysis

This folder contains a test implementation for analyzing MP4 videos using Gemini 2.0 Flash API.

## Structure

```
testFeature1/
├── components/
│   ├── VideoAnalyzer.tsx      # Main component for video upload and analysis
│   └── JsonDisplay.tsx         # Component to display JSON response
├── services/
│   └── geminiService.ts        # Gemini API integration
├── test-videos/                # Place your test MP4 files here
└── index.tsx                   # Main test screen
```

## Setup

1. Add your Gemini API key to `.env` file:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Place test MP4 videos in the `test-videos/` folder

4. Run the app and navigate to the test screen

## Usage

1. Tap "Select Video" to choose an MP4 file
2. The video will be sent to Gemini 2.0 Flash
3. JSON response will be displayed below
4. Response includes object detection and scene analysis
