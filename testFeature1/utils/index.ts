/**
 * Accessibility Utils - Speech and Haptics for Visually Impaired Users
 */

export * from './hapticsService';
// export * from './speechService'; // Removed - switching to ElevenLabs
export * from './elevenLabsService';

// Re-export commonly used functions
export { errorPattern, successPattern, tapFeedback } from './hapticsService';
// export { speak, stopSpeaking } from './speechService'; // Removed - switching to ElevenLabs
export { CameraAnnouncements, RecordingAnnouncements, speak, speakCalm, speakNarrative, speakUrgent } from './elevenLabsService';

