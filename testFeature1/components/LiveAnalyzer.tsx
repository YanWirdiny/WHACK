/**
 * LiveAnalyzer
 *
 * Continuous live environment analysis for visually impaired users.
 *
 * Modes:
 *  - Always-on: snapshots camera every 1.5s, sends differential frames to Gemini
 *  - Double tap: triggers full on-demand scene description
 *
 * Flow:
 *  1. Camera live preview (react-native-vision-camera)
 *  2. Snapshot every 1.5s via ref
 *  3. First 3 frames → baseline calibration
 *  4. After baseline → differential analysis (report only changes)
 *  5. Double tap anywhere → full on-demand scan
 */

import * as FileSystem from "expo-file-system/legacy";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  analyzeFrame,
  LiveAnalysisResult,
} from "../services/liveGeminiService";
import {
  CameraAnnouncements,
  speakCalm,
  speakNarrative,
  speakUrgent,
  stopAll,
} from "../utils/elevenLabsService";
import {
  analysisCompletePattern,
  hazardPattern,
  tapToRecordFeedback,
} from "../utils/hapticsService";
import {
  isFrameWorthAnalyzing,
  PostureHint,
  startMovementGuidance,
  stopMovementGuidance,
  subscribeMovementHints,
} from "../utils/movementGuidanceService";

type SystemState = "idle" | "calibrating" | "monitoring" | "on_demand";

// ─── Siri Wave Bar ────────────────────────────────────────────────────────────

function WaveBar({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  const height = useSharedValue(6);

  useEffect(() => {
    if (active) {
      height.value = withRepeat(
        withSequence(
          withTiming(6 + Math.random() * 34, {
            duration: 300 + Math.random() * 300,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(6, {
            duration: 300 + Math.random() * 300,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(6, { duration: 400 });
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.waveBar,
        animStyle,
        { backgroundColor: color, marginHorizontal: 2 },
      ]}
    />
  );
}

// ─── Siri Wave Logo ───────────────────────────────────────────────────────────

function SiriWaveLogo({ active, safetyLevel }: { active: boolean; safetyLevel?: string }) {
  const BAR_COUNT = 24;
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  // Color shifts with safety level
  const waveColor =
    safetyLevel === "danger"
      ? "#FF4143"
      : safetyLevel === "warning"
      ? "#FF9800"
      : safetyLevel === "caution"
      ? "#FFC107"
      : "#FAF3F0";

  const accentColor = safetyLevel === "danger" ? "#FF4143" : "#2D3861";

  return (
    <Animated.View style={[styles.siriContainer, containerStyle]}>
      {/* Logo above wave */}
      <Image
        source={require("/Users/adage-131/Buddy/assets/logo.png")}
        style={styles.siriLogo}
        resizeMode="contain"
      />

      {/* Wave bars */}
      <View style={styles.waveRow}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <WaveBar
            key={i}
            active={active}
            color={i % 3 === 0 ? accentColor : waveColor}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Danger Banner ────────────────────────────────────────────────────────────

function DangerBanner({ result }: { result: LiveAnalysisResult | null }) {
  if (!result?.safety_level || result.safety_level === "safe") return null;

  const config = {
    danger: {
      bg: "rgba(244, 67, 54, 0.95)",
      border: "#FF1744",
      label: "⛔  DANGER",
    },
    warning: {
      bg: "rgba(255, 152, 0, 0.92)",
      border: "#FF6D00",
      label: "⚠️  WARNING",
    },
    caution: {
      bg: "rgba(255, 193, 7, 0.88)",
      border: "#FFD600",
      label: "⚡  CAUTION",
    },
  }[result.safety_level];

  if (!config) return null;

  const topHazard = result.hazards?.[0];

  return (
    <View
      style={[
        styles.dangerBanner,
        { backgroundColor: config.bg, borderBottomColor: config.border },
      ]}
    >
      <Text style={styles.dangerLabel}>{config.label}</Text>
      {topHazard && (
        <Text style={styles.dangerDetail}>
          {topHazard.name}
          {topHazard.distance_estimate ? `  ·  ${topHazard.distance_estimate}` : ""}
        </Text>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LiveAnalyzer() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const cameraRef = useRef<Camera>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);
  const isOnDemandRef = useRef(false);
  const baselineSummaryRef = useRef<string | null>(null);
  const frameCountRef = useRef(0);

  const [systemState, setSystemState] = useState<SystemState>("idle");
  const [lastResult, setLastResult] = useState<LiveAnalysisResult | null>(null);
  const [statusText, setStatusText] = useState("Starting live analysis...");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [postureHint, setPostureHint] = useState<PostureHint>("stable");

  // ─── Start Live Analysis Loop ────────────────────────────────────────────

  const startLiveLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    frameCountRef.current = 0;
    baselineSummaryRef.current = null;
    setSystemState("calibrating");
    setStatusText("Calibrating...");
    speakCalm("Calibrating environment. Please hold still.");

    intervalRef.current = setInterval(async () => {
      if (isProcessingRef.current || !cameraRef.current) return;

      // Skip if the user's posture would produce a bad frame.
      // Calibration still runs so the first 3 baseline frames can gather
      // data even if the phone wobbles a bit during handoff.
      if (frameCountRef.current > 3 && !isFrameWorthAnalyzing()) return;

      try {
        isProcessingRef.current = true;
        frameCountRef.current += 1;

        const photo = await cameraRef.current.takePhoto({ flash: "off" });
        if (!photo?.path) return;

        const base64 = await FileSystem.readAsStringAsync(photo.path, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const isBaseline = frameCountRef.current <= 3;
        const mode = isBaseline ? "baseline" : "differential";

        const result = await analyzeFrame(
          base64,
          mode,
          baselineSummaryRef.current ?? undefined
        );

        if (!result) return;

        if (isBaseline && result.scene_summary) {
          baselineSummaryRef.current = result.scene_summary;

          if (frameCountRef.current === 3) {
            setSystemState("monitoring");
            setStatusText("Live");
            analysisCompletePattern();
            CameraAnnouncements.ready();
          }
        }

        setLastResult(result);

        if (result.has_change && result.spoken_narrative) {
          setIsSpeaking(true);
          await speakNarrative(result.spoken_narrative, result.safety_level);
          setIsSpeaking(false);
          if (result.safety_level === "danger") {
            hazardPattern();
          }
        }
      } catch (error) {
        console.error("❌ Live analysis frame error:", error);
      } finally {
        isProcessingRef.current = false;
      }
    }, 1500);
  }, []);

  // ─── On-Demand Full Scan (double tap) ──────────────────────────────────

  const triggerOnDemandScan = useCallback(async () => {
    if (!cameraRef.current || isOnDemandRef.current) return;

    try {
      isOnDemandRef.current = true;
      setSystemState("on_demand");
      setStatusText("Full scan...");
      tapToRecordFeedback();
      speakCalm("Scanning full environment. Please wait.");

      const photo = await cameraRef.current.takePhoto({ flash: "off" });
      if (!photo?.path) return;

      const base64 = await FileSystem.readAsStringAsync(photo.path, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await analyzeFrame(base64, "on_demand");

      if (result) {
        setLastResult(result);
        if (result.spoken_narrative) {
          setIsSpeaking(true);
          await speakNarrative(result.spoken_narrative, result.safety_level);
          setIsSpeaking(false);
        }
        if (result.safety_level === "danger") {
          hazardPattern();
        }
      }
    } catch (error) {
      console.error("❌ On-demand scan error:", error);
      speakUrgent("Scan failed. Please try again.");
    } finally {
      isOnDemandRef.current = false;
      setSystemState("monitoring");
      setStatusText("Live");
    }
  }, []);

  // ─── Gestures ──────────────────────────────────────────────────────────

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      triggerOnDemandScan();
    });

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasPermission) {
      startLiveLoop();
      startMovementGuidance();
      const unsub = subscribeMovementHints(setPostureHint);

      return () => {
        unsub();
        stopMovementGuidance();
        if (intervalRef.current) clearInterval(intervalRef.current);
        stopAll();
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAll();
    };
  }, [hasPermission, startLiveLoop]);

  // ─── Permission Gate ───────────────────────────────────────────────────

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access required</Text>
        <Text style={styles.permissionButton} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  const waveActive =
    isSpeaking ||
    systemState === "calibrating" ||
    systemState === "on_demand";

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={doubleTap}>
        <View style={styles.container}>

          {/* ── Full-screen camera ── */}
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
          />

          {/* ── Danger / Warning banner (top) ── */}
          <DangerBanner result={lastResult} />

          {/* ── Status badge (top-right) ── */}
          <View style={styles.statusOverlay}>
            <View
              style={[
                styles.statusBadge,
                systemState === "calibrating" && styles.statusCalibrating,
                systemState === "on_demand" && styles.statusOnDemand,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      systemState === "monitoring" ? "#4CAF50" :
                      systemState === "on_demand" ? "#FF4143" :
                      "#FFC107",
                  },
                ]}
              />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          {/* ── Posture hint (under status badge) ── */}
          {postureHint !== "stable" && systemState !== "on_demand" && (
            <View style={styles.postureOverlay}>
              <View style={styles.postureBadge}>
                <Text style={styles.postureText}>
                  {postureHint === "shaking" && "Hold still"}
                  {postureHint === "tilted_down" && "Tilt up"}
                  {postureHint === "tilted_up" && "Tilt down"}
                  {postureHint === "flat" && "Pick up the phone"}
                  {postureHint === "covered" && "Camera covered"}
                </Text>
              </View>
            </View>
          )}

          {/* ── Siri wave logo (bottom center) ── */}
          <SiriWaveLogo
            active={waveActive}
            safetyLevel={lastResult?.safety_level}
          />

          {/* ── Hint ── */}
          {systemState === "monitoring" && (
            <View style={styles.hintOverlay}>
              <Text style={styles.hintText}>Double tap for full scan</Text>
            </View>
          )}

        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  permissionButton: {
    color: "#FF4143",
    fontSize: 16,
    fontWeight: "bold",
    padding: 12,
  },

  // ── Danger banner ──
  dangerBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    zIndex: 20,
  },
  dangerLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },
  dangerDetail: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Status badge ──
  statusOverlay: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 15,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statusCalibrating: {
    borderColor: "#FFC107",
  },
  statusOnDemand: {
    borderColor: "#FF4143",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Siri wave ──
  siriContainer: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  siriLogo: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },

  // ── Posture hint ──
  postureOverlay: {
    position: "absolute",
    top: 108,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 14,
  },
  postureBadge: {
    backgroundColor: "rgba(255, 193, 7, 0.92)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  postureText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Hint ──
  hintOverlay: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  hintText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});