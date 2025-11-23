/**
 * Speech Service - Text-to-Speech for Visually Impaired Users
 * 
 * Provides voice feedback and announcements for accessibility
 */

import * as Speech from 'expo-speech';

/**
 * Speech configuration for accessibility
 */
const SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.9, // Slightly slower for clarity
  volume: 1.0,
};

/**
 * Speak text aloud
 * @param text - Text to speak
 * @param options - Optional speech configuration
 */
export async function speak(
  text: string,
  options?: Partial<Speech.SpeechOptions>
): Promise<void> {
  try {
    // Stop any ongoing speech first
    await Speech.stop();
    
    // Speak the text
    Speech.speak(text, {
      ...SPEECH_OPTIONS,
      ...options,
    });
    
    console.log('🔊 Speaking:', text);
  } catch (error) {
    console.error('❌ Speech error:', error);
  }
}

/**
 * Stop current speech
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
    console.log('🔇 Speech stopped');
  } catch (error) {
    console.error('❌ Error stopping speech:', error);
  }
}

/**
 * Check if device is currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('❌ Error checking speech status:', error);
    return false;
  }
}

/**
 * Announce important information with high priority
 * (stops current speech to deliver urgent message)
 */
export async function announceUrgent(text: string): Promise<void> {
  await speak(text, {
    rate: 1.0, // Normal speed for urgent messages
    pitch: 1.1, // Slightly higher pitch for emphasis
  });
}

/**
 * Announce success message
 */
export async function announceSuccess(text: string): Promise<void> {
  await speak(text, {
    pitch: 1.05,
    rate: 0.95,
  });
}

/**
 * Announce error message
 */
export async function announceError(text: string): Promise<void> {
  await speak(text, {
    pitch: 0.9, // Lower pitch for errors
    rate: 0.85, // Slower for emphasis
  });
}

/**
 * Announce recording state changes
 */
export const RecordingAnnouncements = {
  startCountdown: () => speak('Recording will start in 3 seconds'),
  recording: () => speak('Recording'),
  stopped: () => speak('Recording stopped'),
  analyzing: () => speak('Analyzing video'),
  complete: () => announceSuccess('Analysis complete'),
  error: (message: string) => announceError(`Error: ${message}`),
};

/**
 * Announce camera state changes
 */
export const CameraAnnouncements = {
  permissionGranted: () => announceSuccess('Camera access granted'),
  permissionDenied: () => announceError('Camera permission denied'),
  flipped: (facing: 'front' | 'back') => 
    speak(`Camera switched to ${facing} facing`),
  ready: () => speak('Camera ready. Tap anywhere to record'),
};

/**
 * Announce analysis results
 */
export const AnalysisAnnouncements = {
  objectsDetected: (count: number) => 
    speak(`Detected ${count} ${count === 1 ? 'object' : 'objects'}`),
  safetyLevel: (level: string) => {
    const messages = {
      safe: 'Environment is safe',
      caution: 'Proceed with caution',
      warning: 'Warning: potential hazard detected',
      danger: 'Danger! Stop immediately',
    };
    announceUrgent(messages[level as keyof typeof messages] || level);
  },
  objectDetails: (name: string, distance: string, position: string) =>
    speak(`${name} detected ${distance}, ${position}`),
};
