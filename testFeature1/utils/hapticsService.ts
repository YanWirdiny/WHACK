/**
 * Haptics Service - Vibration Feedback for Visually Impaired Users
 * 
 * Provides tactile feedback for different app states and actions
 */

import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback for button taps
 */
export function tapFeedback(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Medium haptic feedback for state changes
 */
export function mediumFeedback(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Heavy haptic feedback for important events
 */
export function heavyFeedback(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Success haptic pattern
 */
export async function successPattern(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Warning haptic pattern
 */
export async function warningPattern(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Error haptic pattern
 */
export async function errorPattern(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Custom haptic pattern for countdown (3-2-1)
 */
export async function countdownPattern(count: number): Promise<void> {
  try {
    // Different intensity for each count
    if (count === 3) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (count === 2) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (count === 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Recording started haptic pattern (double tap)
 */
export async function recordingStartPattern(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 100);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Recording stopped haptic pattern (triple tap)
 */
export async function recordingStopPattern(): Promise<void> {
  try {
    for (let i = 0; i < 3; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Analysis complete haptic pattern
 */
export async function analysisCompletePattern(): Promise<void> {
  try {
    await successPattern();
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Danger/hazard detected haptic pattern (urgent)
 */
export async function hazardPattern(): Promise<void> {
  try {
    // Strong pulsing pattern
    for (let i = 0; i < 4; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  } catch (error) {
    console.error('❌ Haptics error:', error);
  }
}

/**
 * Camera flip haptic feedback
 */
export function cameraFlipFeedback(): void {
  mediumFeedback();
}

/**
 * Tap to record feedback
 */
export function tapToRecordFeedback(): void {
  heavyFeedback();
}
