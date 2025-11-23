import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';

// Initialize Gemini API
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ Gemini API key not found. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiAnalysisResult {
  scene: string;
  objects: Array<{
    name: string;
    position: string;
    distance_category: string;
    distance_estimate: string;
    urgency: string;
    audio_description: string;
    confidence?: number;
  }>;
  recommendation?: string;
  safety_level?: string;
  timestamp?: string;
}

/**
 * Analyze a video file using Gemini
 * @param videoUri - Local file URI of the video
 * @returns JSON analysis result
 */
export async function analyzeVideoWithGemini(
  videoUri: string
): Promise<GeminiAnalysisResult> {
  try {
    console.log('📹 Starting video analysis...');
    console.log('Video URI:', videoUri);

    // Detect video format from URI
    const isMov = videoUri.toLowerCase().endsWith('.mov') || videoUri.includes('.mov?');
    const mimeType = isMov ? 'video/quicktime' : 'video/mp4';
    
    console.log('📄 Detected format:', mimeType);

    // Read video file as base64
    const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: 'base64',
    });

    console.log('✅ Video file read successfully');
    console.log('File size (base64):', videoBase64.length, 'characters');
    console.log('File size (KB):', Math.round(videoBase64.length * 0.75 / 1024));

    // Check file size (Gemini has limits)
    const fileSizeKB = Math.round(videoBase64.length * 0.75 / 1024);
    if (fileSizeKB > 20000) {
      throw new Error(`Video file too large (${fileSizeKB}KB). Please use a video under 20MB.`);
    }

    // Try different models in order of preference
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro', 
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash'
    ];

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });

        // Create the prompt for visually impaired assistance
        const prompt = `
You are an AI assistant helping visually impaired users navigate their environment safely.
Analyze this video and provide detailed object detection with distance estimation.

For each important object detected (vehicles, people, obstacles, signs, crosswalks, etc.), provide:

1. Object name and type
2. Position (left, center, right, above, below)
3. Distance category:
   - IMMEDIATE (0-5 feet): Within arm's reach, requires immediate attention
   - VERY CLOSE (5-15 feet): A few steps away, important for navigation
   - CLOSE (15-30 feet): Nearby, approaching soon
   - MEDIUM (30-50 feet): Across a typical street or room
   - FAR (50+ feet): In the distance

4. Distance estimate with familiar references (e.g., "2 car lengths", "3 steps")
5. Urgency level (critical, high, medium, low)
6. Clear audio description suitable for text-to-speech

Focus on safety-critical objects first.

Return ONLY valid JSON in this exact format:
{
  "scene": "brief description of the overall scene",
  "objects": [
    {
      "name": "object type",
      "position": "position description",
      "distance_category": "IMMEDIATE/VERY CLOSE/CLOSE/MEDIUM/FAR",
      "distance_estimate": "specific estimate with reference",
      "urgency": "critical/high/medium/low",
      "audio_description": "clear, concise verbal description",
      "confidence": 0.95
    }
  ],
  "recommendation": "immediate action recommendation if needed",
  "safety_level": "safe/caution/warning/danger",
  "timestamp": "${new Date().toISOString()}"
}
`;

        console.log('🚀 Sending video to Gemini API...');
        console.log('📊 Request details:', {
          model: modelName,
          mimeType: mimeType,
          videoSizeKB: fileSizeKB,
          promptLength: prompt.length
        });

        // Send video to Gemini with detected MIME type
        const startTime = Date.now();
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: videoBase64,
            },
          },
          { text: prompt },
        ]);
        const endTime = Date.now();

        console.log(`⏱️ API call took ${(endTime - startTime) / 1000} seconds`);
        console.log('📥 Response received from Gemini');

        const response = await result.response;
        const text = response.text();

        console.log('✅ Response text extracted');
        console.log('📏 Raw response length:', text.length);
        
        // Parse JSON response
        console.log('🔧 Attempting to parse JSON response...');
        
        // Remove markdown code blocks if present
        const cleanedText = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const analysisResult: GeminiAnalysisResult = JSON.parse(cleanedText);
        console.log('✅ JSON parsed successfully');
        console.log('📋 Number of objects detected:', analysisResult.objects?.length || 0);
        console.log(`✅ Analysis complete using ${modelName}`);
        return analysisResult;

      } catch (error) {
        console.error(`❌ Model ${modelName} failed:`, error instanceof Error ? error.message : 'Unknown error');
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // If this is the last model, throw the error
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
          throw lastError;
        }
        
        // Otherwise, try the next model
        console.log('⏭️ Trying next model...');
        continue;
      }
    }

    throw lastError || new Error('All models failed');
    
  } catch (error) {
    console.error('❌ Error analyzing video:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    
    // Check if it's a network/API error
    if (error && typeof error === 'object' && 'status' in error) {
      console.error('🌐 API Status Code:', (error as any).status);
      console.error('🌐 API Response:', (error as any).message);
    }
    
    // Provide more helpful error messages
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('500')) {
      errorMessage = 'Server error from Gemini API. The video format may not be fully supported. Try a shorter video or MP4 format.';
    } else if (errorMessage.includes('API key')) {
      errorMessage = 'Invalid API key. Please check your EXPO_PUBLIC_GEMINI_API_KEY in .env file.';
    } else if (errorMessage.includes('quota')) {
      errorMessage = 'API quota exceeded. Please check your Gemini API usage limits.';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Analyze a video with simplified output (for testing)
 */
export async function analyzeVideoSimple(videoUri: string): Promise<any> {
  try {
    console.log('🔍 Starting simple video analysis...');
    
    const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: 'base64',
    });

    const fileSizeKB = Math.round(videoBase64.length * 0.75 / 1024);
    console.log('📏 File size:', fileSizeKB, 'KB');

    // Try models in order
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Trying ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'video/mp4',
              data: videoBase64,
            },
          },
          {
            text: 'Describe what you see in this video in detail. Include any objects, people, and actions.',
          },
        ]);

        const response = await result.response;
        console.log(`✅ Success with ${modelName}`);
        return {
          description: response.text(),
          timestamp: new Date().toISOString(),
          model: modelName,
        };
      } catch (error) {
        console.error(`❌ ${modelName} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('All models failed for simple analysis');
  } catch (error) {
    console.error('Error in simple analysis:', error);
    throw error;
  }
}