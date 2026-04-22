import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const C = {
  parchment: "#FAF3F0",
  almond:    "#F9D0C6",
  blush:     "#F7A29F",
  red:       "#FF4143",
  indigo:    "#2D3861",
};

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const contentOpacity = useSharedValue(0);
  const contentY      = useSharedValue(14);
  const glowScale     = useSharedValue(1);
  const glowOpacity   = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const labelOpacity  = useSharedValue(0.4);

  useEffect(() => {
    // Fade + slide content in
    contentOpacity.value = withTiming(1, { duration: 700 });
    contentY.value       = withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) });

    // Breathing glow
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,    { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2500 }),
        withTiming(1,   { duration: 2500 }),
      ),
      -1,
      true,
    );

    // Progress bar: 0 → 70% → 88% → 100%
    progressWidth.value = withTiming(100, {
      duration: 2800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    // Blinking label
    labelOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1000 }),
        withTiming(0.4,  { duration: 1000 }),
      ),
      -1,
      true,
    );

    // Complete after ~4 s
    const completeTimer = setTimeout(() => {
      contentOpacity.value = withTiming(0, { duration: 400 });
      setTimeout(() => onLoadingComplete(), 450);
    }, 4000);

    return () => clearTimeout(completeTimer);
  }, [onLoadingComplete]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <View style={styles.container}>

      {/* Breathing blush glow */}
      <Animated.View style={[styles.glow, glowStyle]} />

      <Animated.View style={[styles.content, contentStyle]}>

        {/* Logo */}
        <Image
          source={require("/Users/adage-131/Buddy/assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Wordmark */}
        <View style={styles.wordmark}>
          <Text style={styles.wordmarkName}>Buddy</Text>
          <Text style={styles.wordmarkSub}>Vision Assistance AI</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.divLine} />
          <View style={styles.divDot} />
          <View style={[styles.divLine, styles.divLineReverse]} />
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Animated.Text style={[styles.progressLabel, labelStyle]}>
            Initializing
          </Animated.Text>
        </View>

      </Animated.View>

      {/* Version */}
      <Text style={styles.version}>v1.0 · beta</Text>

      {/* Home bar */}
      <View style={styles.homeBar} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.parchment,
    alignItems: "center",
    justifyContent: "center",
  },

  // Radial glow behind illustration
  glow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: C.almond,
    opacity: 0.35,
    // Soften with large shadow instead of radial-gradient
    shadowColor: C.blush,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 0,
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 36,
    width: "100%",
  },

  // Logo
  logo: {
    width: 185,
    height: 185,
    marginBottom: 26,
    // drop shadow
    shadowColor: C.indigo,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },

  // Wordmark
  wordmark: {
    alignItems: "center",
    marginBottom: 8,
  },
  wordmarkName: {
    fontFamily: "CormorantGaramond-Regular",
    fontSize: 62,
    fontWeight: "400",
    color: C.indigo,
    letterSpacing: 18,
    paddingLeft: 18,
    lineHeight: 72,
  },
  wordmarkSub: {
    fontSize: 10,
    letterSpacing: 4,
    color: C.indigo,
    opacity: 0.5,
    textTransform: "uppercase",
    marginTop: 9,
    paddingLeft: 4,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
    marginBottom: 46,
  },
  divLine: {
    width: 44,
    height: 1,
    backgroundColor: `rgba(45,56,97,0.2)`,
  },
  divLineReverse: {
    // same style, second line
  },
  divDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.blush,
  },

  // Progress
  progressWrap: {
    width: "100%",
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 2,
    backgroundColor: `rgba(45,56,97,0.1)`,
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.blush,
    borderRadius: 99,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  progressLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: C.indigo,
    textTransform: "uppercase",
    opacity: 0.4,
  },

  // Footer
  version: {
    position: "absolute",
    bottom: 50,
    fontSize: 10,
    letterSpacing: 2,
    color: C.indigo,
    opacity: 0.25,
    textTransform: "uppercase",
  },
  homeBar: {
    position: "absolute",
    bottom: 12,
    width: 128,
    height: 5,
    backgroundColor: `rgba(45,56,97,0.15)`,
    borderRadius: 99,
  },
});
