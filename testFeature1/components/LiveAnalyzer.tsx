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
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
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

type SystemState = "idle" | "calibrating" | "monitoring" | "on_demand";

export function LiveAnalyzer() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const cameraRef = useRef<Camera>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false); // prevent overlapping Gemini calls
  const isOnDemandRef = useRef(false);   // stable ref guard for double-tap
  const baselineSummaryRef = useRef<string | null>(null);
  const frameCountRef = useRef(0);

  const [systemState, setSystemState] = useState<SystemState>("idle");
  const [lastResult, setLastResult] = useState<LiveAnalysisResult | null>(null);
  const [statusText, setStatusText] = useState("Starting live analysis...");

  // ─── Start Live Analysis Loop ──────────────────────────────────────────────

  const startLiveLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    frameCountRef.current = 0;
    baselineSummaryRef.current = null;
    setSystemState("calibrating");
    setStatusText("Calibrating environment...");
    speakCalm("Calibrating environment. Please hold still.");

    intervalRef.current = setInterval(async () => {
      if (isProcessingRef.current || !cameraRef.current) return;

      try {
        isProcessingRef.current = true;
        frameCountRef.current += 1;

        const photo = await cameraRef.current.takePhoto({ flash: 'off' });
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
            setStatusText("Live monitoring active");
            analysisCompletePattern();
            CameraAnnouncements.ready();
          }
        }

        setLastResult(result);

        if (result.has_change && result.spoken_narrative) {
          await speakNarrative(result.spoken_narrative, result.safety_level);
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

  // ─── On-Demand Full Scan (double tap) ─────────────────────────────────────

  const triggerOnDemandScan = useCallback(async () => {
    if (!cameraRef.current || isOnDemandRef.current) return;

    try {
      isOnDemandRef.current = true;
      setSystemState("on_demand");
      setStatusText("Full scan requested...");
      tapToRecordFeedback();
      speakCalm("Scanning full environment. Please wait.");

      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      if (!photo?.path) return;

      const base64 = await FileSystem.readAsStringAsync(photo.path, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await analyzeFrame(base64, "on_demand");

      if (result) {
        setLastResult(result);
        if (result.spoken_narrative) {
          await speakNarrative(result.spoken_narrative, result.safety_level);
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
      setStatusText("Live monitoring active");
    }
  }, []);

  // ─── Gestures ─────────────────────────────────────────────────────────────

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      triggerOnDemandScan();
    });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasPermission) {
      startLiveLoop();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAll();
    };
  }, [hasPermission, startLiveLoop]);

  // ─── Permission Gate ───────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  const safetyColor = {
    safe: "#4CAF50",
    caution: "#FFC107",
    warning: "#FF9800",
    danger: "#F44336",
  }[lastResult?.safety_level ?? "safe"];

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={doubleTap}>
        <View style={styles.container}>
          {/* Live Camera Preview */}
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
          />

          {/* Status Overlay */}
          <View style={styles.statusOverlay}>
            <View style={[styles.statusBadge, { borderColor: safetyColor }]}>
              <View style={[styles.statusDot, { backgroundColor: safetyColor }]} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
            {systemState === "calibrating" && (
              <ActivityIndicator color="#fff" style={styles.spinner} />
            )}
          </View>

          {/* Last Hazard Display */}
          {lastResult?.hazards && lastResult.hazards.length > 0 && (
            <View style={styles.hazardOverlay}>
              {lastResult.hazards.slice(0, 2).map((h, i) => (
                <View key={i} style={styles.hazardChip}>
                  <Text style={styles.hazardText}>
                    ⚠ {h.name} — {h.distance_estimate}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Double Tap Hint */}
          {systemState === "monitoring" && (
            <View style={styles.hintOverlay}>
              <Text style={styles.hintText}>Double tap for full scan</Text>
            </View>
          )}

          {/* On-Demand Scanning Indicator */}
          {systemState === "on_demand" && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.scanningText}>Full scan in progress...</Text>
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
  camera: {
    flex: 1,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  permissionButton: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "bold",
    padding: 12,
  },
  statusOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  spinner: {
    marginLeft: 4,
  },
  hazardOverlay: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    gap: 8,
  },
  hazardChip: {
    backgroundColor: "rgba(244, 67, 54, 0.85)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hazardText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  hintOverlay: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(33, 150, 243, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  scanningText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
