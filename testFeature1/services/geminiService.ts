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
  spoken_narrative: string; // NEW: Natural paragraph for text-to-speech
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
      'gemini-2.5-flash'
    ];

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });

        // Create the prompt for visually impaired assistance
        const prompt = `

You are an AI assistant helping visually impaired users understand potential hazards and obstacles in their environment.


Your goal is to prioritize safety risks only — do not describe decorative, harmless, or irrelevant surroundings.


IMPORTANT CONTEXT:
- There is a processing delay between video capture and analysis (several seconds)
- The situation may have changed since the video was recorded
- Your role is to INFORM about what was observed, NOT to give movement/navigation instructions


CRITICAL INSTRUCTIONS:
1. MUTE the audio/sound first - do NOT process or listen to any audio
2. Analyze ONLY the visual content (frames/images) of the video
3. Completely ignore, discard, and do not consider any audio, sound, music, or voice in the video
Your ONLY job is to detect dangerous or obstructive elements that could cause:
Collision


Tripping


Falling


Being struck by moving objects


You must ignore everything else, even if visible.
ABSOLUTELY DO NOT DESCRIBE
If an object cannot realistically harm or obstruct a blind person, it should not appear in your output at all.

Do NOT mention the following if it cannot realistically harm or obstruct.
Buildings


Trees



Parked cars that are not in the walking path


Stationary background items


lighting, sky 


Decorative objects or long fancy descriptions


“Surroundings” or environmental descriptions



ONLY DETECT THESE HAZARD TYPES
You may describe ONLY:
Moving vehicles


Vehicles in crossing path


People directly in the user’s path


Crowds blocking movement


Bicycles, scooters, skateboards in motion or in path


Sudden elevation changes (curbs, stairs, drop-offs)


Poles in direct path or benches


Cones, barricades, construction zones in direct path


Open doors/glass walls in direct path


Low-hanging obstacles at head/chest height


If none of these exist: treat the scene as safe.
1. Object name and type
2. Position (left, center, right, above, below)
3. Distance category:
  - IMMEDIATE (0-2 steps): Within arm's reach, requires immediate attention and urgency
  - VERY CLOSE (3-6 steps): A few steps away, important for navigation and urgency
  - CLOSE (7-12 steps): Nearby, approaching soon
  - MEDIUM (13-20 steps): Across a typical street or room
  - FAR (20+ steps): In the distance


4. Distance estimate with familiar references (e.g., "2 car lengths", "5 steps away")
5. Urgency level (critical, high, medium, low)
6. Clear audio description suitable for text-to-speech


Focus on safety-critical objects ONLY.


IMPORTANT: Generate a "spoken_narrative" field - a natural, conversational paragraph (2-4 sentences) that describes obstacles and safety hazards observed in the scene.
DO NOT say "safe to proceed", "you can move forward", or give movement instructions.


CRITICAL NARRATIVE RULES:
1. ALWAYS and ONLY mention hazards and obstacles with their precise location and distance
2. For SAFE scenes with no hazards: Keep it brief and simple - just confirm clear/safe area. Say “clear and safe area, no hazards detected.”
3. For scenes with hazards: Prioritize dangers by urgency, be very specific about location


The narrative structure should be:
- HAZARDS FIRST: "[Hazard type] detected [position], [distance]"
- NO detailed description of safe/neutral surroundings


Examples:
- SAFE: "Clear path detected."
- CAUTION: "Vehicle observed on the left side, approximately 8 steps away."
- WARNING: "Person walking directly ahead, very close at 4 steps away. Bicycle on the right, 6 steps away."
- DANGER: "Car approaching rapidly from the right, less than 2 steps away. Immediate hazard detected."


REMINDER: Due to processing latency, always frame observations in past tense ("was observed", "detected") to acknowledge the time delay.
Focus on INFORMING the user about HAZARDS and OBSTACLES, NOT directing their movement.
Safe areas = say “area is safe. No hazards detected” Hazards = precise location and distance.

Return ONLY valid JSON in this exact format:
{
 "scene": "brief description of the overall scene",
 "spoken_narrative": "Natural 2-4 sentence description with appropriate urgency for text-to-speech",
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