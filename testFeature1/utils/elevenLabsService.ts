/**
 * ElevenLabs Text-to-Speech Service
 * 
 * Provides natural voice synthesis for visually impaired users
 * Uses ElevenLabs REST API for text-to-speech
 */

import { Audio } from 'expo-av';

// Initialize ElevenLabs API key
const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';

if (!ELEVENLABS_API_KEY) {
  console.warn('⚠️ ElevenLabs API key not found in environment variables');
}

/**
 * Voice IDs - You can customize these with your preferred voices
 * Get voice IDs from: https://elevenlabs.io/app/voice-library
 */
export const VOICES = {
  // Rachel - warm, friendly female voice (default)
  default: 'EXAVITQu4vr4xnSDxMaL',
  // Adam - deep, confident male voice
  male: 'pNInz6obpgDQGcFmaJgB',
  // Bella - soft, gentle female voice
  female: 'ErXwobaYiN019PkySvjV',
  // Antoni - well-rounded male voice
  calm: 'flq6f7yk4E4fJM5XTYuZ',
};

// Track current playing sound
let currentSound: Audio.Sound | null = null;

/**
 * Play text using ElevenLabs TTS
 */
export async function speak(
  text: string,
  options?: {
    voiceId?: string;
    stability?: number; // 0-1, how stable/consistent the voice is
    similarityBoost?: number; // 0-1, how close to original voice
    modelId?: string;
  }
): Promise<void> {
  try {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ ElevenLabs: Empty text provided');
      return;
    }

    if (!ELEVENLABS_API_KEY) {
      console.error('❌ ElevenLabs API key not configured');
      return;
    }

    console.log('🔊 ElevenLabs speaking:', text.substring(0, 50) + '...');

    // Stop any currently playing audio
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    const voiceId = options?.voiceId || VOICES.default;
    const modelId = options?.modelId || 'eleven_turbo_v2_5'; // Fast, high-quality model

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: options?.stability ?? 0.5,
            similarity_boost: options?.similarityBoost ?? 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    // Get audio as base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = arrayBufferToBase64(arrayBuffer);
    const audioUri = `data:audio/mpeg;base64,${base64Audio}`;

    // Play audio using expo-av
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true }
    );

    currentSound = sound;

    // Wait for playback to finish
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          resolve();
        }
      });
    });

    // Cleanup
    await sound.unloadAsync();
    currentSound = null;
    
    console.log('✅ ElevenLabs playback complete');
  } catch (error) {
    console.error('❌ ElevenLabs error:', error);
    // Don't throw - fail gracefully
  }
}

/**
 * Helper function to convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Speak with urgent tone (higher stability for clarity)
 */
export async function speakUrgent(text: string): Promise<void> {
  return speak(text, {
    voiceId: VOICES.male, // Use male voice for urgency
    stability: 0.7, // More stable for clarity
    similarityBoost: 0.8,
  });
}

/**
 * Speak with calm, reassuring tone
 */
export async function speakCalm(text: string): Promise<void> {
  return speak(text, {
    voiceId: VOICES.calm,
    stability: 0.4, // More expressive
    similarityBoost: 0.75,
  });
}

/**
 * Recording state announcements
 */
export const RecordingAnnouncements = {
  startCountdown: () => speakCalm('Recording will start in 3 seconds'),
  recording: () => speakCalm('Recording'),
  stopped: () => speakCalm('Recording stopped'),
  analyzing: () => speakCalm('Analyzing video'),
  complete: () => speakCalm('Analysis complete'),
  error: (message: string) => speakUrgent(`Error: ${message}`),
};

/**
 * Camera state announcements
 */
export const CameraAnnouncements = {
  permissionGranted: () => speakCalm('Camera access granted'),
  permissionDenied: () => speakUrgent('Camera permission denied'),
  flipped: (facing: 'front' | 'back') => 
    speakCalm(`Camera switched to ${facing} facing`),
  ready: () => speakCalm('Camera ready. Tap anywhere to record'),
};

/**
 * Speak narrative with adaptive tone based on safety level
 */
export async function speakNarrative(
  narrative: string,
  safetyLevel?: string
): Promise<void> {
  if (!narrative) return;

  try {
    switch (safetyLevel) {
      case 'danger':
        // Use urgent voice for danger
        await speakUrgent(narrative);
        break;
      case 'warning':
        // Use default voice with higher stability
        await speak(narrative, {
          voiceId: VOICES.male,
          stability: 0.6,
        });
        break;
      case 'caution':
        // Use default voice
        await speak(narrative, {
          stability: 0.5,
        });
        break;
      case 'safe':
      default:
        // Use calm voice for safe environments
        await speakCalm(narrative);
        break;
    }
  } catch (error) {
    console.error('❌ Failed to speak narrative:', error);
  }
}

/**
 * Stop all currently playing audio
 */
export async function stopAll(): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
      console.log('🔇 Stopped all audio playback');
    }
  } catch (error) {
    console.error('❌ Error stopping audio:', error);
  }
}
