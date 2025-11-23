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
  private static speakQueue: Array<{ text: string; options: SpeechOptions }> = [];
  private static isProcessing = false;

  /**
   * Speak the given text
   */
  static async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    try {
      // Add to queue
      this.speakQueue.push({ text, options });
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        await this.processQueue();
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      this.isSpeaking = false;
      this.isProcessing = false;
    }
  }

  /**
   * Process the speech queue
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.speakQueue.length > 0) {
      const item = this.speakQueue.shift();
      if (!item) continue;
      
      this.isSpeaking = true;
      
      await new Promise<void>((resolve) => {
        Speech.speak(item.text, {
          language: item.options.language || 'en-US',
          pitch: item.options.pitch || 1.0,
          rate: item.options.rate || 1.0,
          onDone: () => {
            this.isSpeaking = false;
            resolve();
          },
          onError: () => {
            this.isSpeaking = false;
            resolve();
          },
        });
      });
    }
    
    this.isProcessing = false;
  }

  /**
   * Stop any ongoing speech and clear queue
   */
  static async stop(): Promise<void> {
    try {
      this.speakQueue = []; // Clear queue
      await Speech.stop();
      this.isSpeaking = false;
      this.isProcessing = false;
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
