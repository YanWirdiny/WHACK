import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

// Professional Color Palette for Vision Assistance App
const COLORS = {
  // Primary - Trust & Reliability
  primary: '#2563EB', // Deep blue
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',
  
  // Secondary - Vision & Clarity
  secondary: '#10B981', // Green (success, vision)
  secondaryLight: '#34D399',
  
  // Accent - Energy & Innovation
  accent: '#F59E0B', // Amber
  
  // Neutrals
  dark: '#1F2937',
  darkLight: '#374151',
  light: '#F3F4F6',
  white: '#FFFFFF',
  
  // Gradients
  gradientStart: '#1E3A8A', // Navy blue
  gradientEnd: '#2563EB', // Electric blue
};

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Logo entrance animation
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
    
    opacity.value = withTiming(1, { duration: 600 });

    // Progress bar animation
    progressWidth.value = withTiming(100, { duration: 2300 });

    // Subtle pulse animation for logo
    const pulseTimer = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
    }, 800);

    // Auto-complete after 2.5 seconds
    const completeTimer = setTimeout(() => {
      // Fade out
      opacity.value = withTiming(0, { duration: 400 });
      
      // Call completion after fade completes
      setTimeout(() => {
        onLoadingComplete();
      }, 500);
    }, 2500);

    return () => {
      clearTimeout(pulseTimer);
      clearTimeout(completeTimer);
    };
  }, [onLoadingComplete]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Gradient Background Effect */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      <Animated.View style={[styles.content, logoAnimatedStyle]}>
        {/* Professional Logo Design */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <View style={styles.logoCenter} />
            </View>
          </View>
        </View>
        
        {/* Brand Name with Professional Typography */}
        <Text style={styles.brandName}>BUDDY</Text>
        <View style={styles.taglineContainer}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>Vision Assistance AI</Text>
          <View style={styles.taglineLine} />
        </View>
      </Animated.View>

      {/* Modern Loading Indicator */}
      <View style={styles.loadingSection}>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
        </View>
        <Text style={styles.loadingText}>Initializing Neural Vision</Text>
      </View>

      {/* Version or Beta Badge (optional) */}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.0 BETA</Text>
      </View>
    </View>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: COLORS.gradientStart,
    opacity: 0.6,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: COLORS.primary,
    opacity: 0.4,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logoCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  brandName: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 8,
    marginBottom: 20,
    textShadowColor: 'rgba(37, 99, 235, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  taglineLine: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.secondary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.light,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  loadingSection: {
    position: 'absolute',
    bottom: 100,
    width: '70%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  loadingText: {
    color: COLORS.light,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  version: {
    color: COLORS.light,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    opacity: 0.5,
  },
});
