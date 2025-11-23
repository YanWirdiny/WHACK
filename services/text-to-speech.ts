import * as Speech from 'expo-speech';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
}

/**
 * Text-to-Speech service for announcing information
 */
export class TextToSpeechService {
  private static isSpeaking = false;

  /**
   * Speak the given text
   */
  static async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    try {
      // Stop any ongoing speech
      if (this.isSpeaking) {
        await Speech.stop();
      }

      this.isSpeaking = true;

      await Speech.speak(text, {
        language: options.language || 'en-US',
        pitch: options.pitch || 1.0,
        rate: options.rate || 1.0,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      this.isSpeaking = false;
    }
  }

  /**
   * Stop any ongoing speech
   */
  static async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  /**
   * Check if speech is currently active
   */
  static getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  /**
   * Announce distance and steps information
   */
  static announceDistanceAndSteps(steps: number, distance: number): void {
    const distanceInKm = (distance / 1000).toFixed(2);
    const distanceInMiles = (distance / 1609.34).toFixed(2);
    
    const announcement = `You have walked ${steps} steps, covering ${distanceInKm} kilometers or ${distanceInMiles} miles.`;
    this.speak(announcement);
  }
}
