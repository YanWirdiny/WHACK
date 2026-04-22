/**
 * Movement Guidance Service
 *
 * Reads gyroscope + accelerometer to coach the user on phone posture:
 *   - Too shaky           → "Hold still"
 *   - Pointed at floor    → "Tilt up a little"
 *   - Pointed at sky      → "Tilt down a little"
 *   - Flat / in pocket    → pause analysis entirely
 *
 * Exposes query helpers (isStable, isAngleGood, isActive) so the live
 * analysis loop can skip Gemini calls on bad frames, and a subscribe()
 * channel that fires spoken hints with throttling.
 */

import { Accelerometer, Gyroscope } from "expo-sensors";
import { speakCalm } from "./elevenLabsService";

// ─── Tuning ──────────────────────────────────────────────────────────────────

const SENSOR_INTERVAL_MS = 200;          // 5 Hz — plenty for posture
const SHAKE_THRESHOLD = 2.5;              // rad/s — above this = shaking
const HINT_COOLDOWN_MS = 4000;            // min gap between spoken hints
const SAME_HINT_COOLDOWN_MS = 8000;       // same hint repeat gap
const POSTURE_SETTLE_MS = 600;            // bad posture must persist this long

// Accelerometer uses g-units (1 = gravity). When phone is upright and
// camera faces forward, gravity pulls Y ≈ -1. When camera points down
// at the floor, Z ≈ -1. When flat face-up on a table, Z ≈ -1 too.
// We distinguish by checking whether the phone is held (some shake)
// vs. truly stationary (no gyro activity at all = flat/pocketed).

// ─── State ───────────────────────────────────────────────────────────────────

export type PostureHint =
  | "stable"
  | "shaking"
  | "tilted_down"
  | "tilted_up"
  | "flat"
  | "covered";

let gyroSub: ReturnType<typeof Gyroscope.addListener> | null = null;
let accelSub: ReturnType<typeof Accelerometer.addListener> | null = null;

let lastGyroMagnitude = 0;
let lastAccel = { x: 0, y: -1, z: 0 };
let stationaryFrames = 0;

let currentHint: PostureHint = "stable";
let hintStartedAt = 0;
let lastSpokenAt = 0;
let lastSpokenHint: PostureHint | null = null;

type Listener = (hint: PostureHint) => void;
const listeners = new Set<Listener>();

// ─── Core Logic ──────────────────────────────────────────────────────────────

function classifyPosture(): PostureHint {
  // Shaking dominates everything — hazard to analysis quality
  if (lastGyroMagnitude > SHAKE_THRESHOLD) {
    return "shaking";
  }

  // No gyro movement at all for many frames → phone is lying still,
  // likely on a table, face-down, or in a pocket.
  if (stationaryFrames > 15 && Math.abs(lastAccel.z) > 0.85) {
    return "flat";
  }

  // Tilt analysis via gravity vector on Y axis.
  // Phone held upright, camera forward: y ≈ -1, z ≈ 0
  // Phone tilted down (camera at floor):  y ≈ -0.5, z ≈ -0.8
  // Phone tilted up (camera at sky):      y ≈ -0.5, z ≈ 0.8
  if (lastAccel.z < -0.55) return "tilted_down";
  if (lastAccel.z > 0.55) return "tilted_up";

  return "stable";
}

function maybeSpeak(hint: PostureHint) {
  if (hint === "stable") return;

  const now = Date.now();
  const sinceLast = now - lastSpokenAt;
  const isSameHint = hint === lastSpokenHint;

  if (sinceLast < HINT_COOLDOWN_MS) return;
  if (isSameHint && sinceLast < SAME_HINT_COOLDOWN_MS) return;

  const phrase: Record<PostureHint, string> = {
    shaking: "Hold still.",
    tilted_down: "Tilt up a little.",
    tilted_up: "Tilt down a little.",
    flat: "Pick up the phone.",
    covered: "Camera is covered.",
    stable: "",
  };

  const text = phrase[hint];
  if (!text) return;

  lastSpokenAt = now;
  lastSpokenHint = hint;
  speakCalm(text);
}

function updateHint(newHint: PostureHint) {
  const now = Date.now();

  if (newHint !== currentHint) {
    hintStartedAt = now;
    currentHint = newHint;
    return;
  }

  // Hint has held steady long enough → commit it
  if (now - hintStartedAt >= POSTURE_SETTLE_MS) {
    listeners.forEach((fn) => fn(newHint));
    maybeSpeak(newHint);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function startMovementGuidance() {
  if (gyroSub || accelSub) return;

  Gyroscope.setUpdateInterval(SENSOR_INTERVAL_MS);
  Accelerometer.setUpdateInterval(SENSOR_INTERVAL_MS);

  gyroSub = Gyroscope.addListener(({ x, y, z }) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    lastGyroMagnitude = magnitude;
    if (magnitude < 0.05) {
      stationaryFrames += 1;
    } else {
      stationaryFrames = 0;
    }
    updateHint(classifyPosture());
  });

  accelSub = Accelerometer.addListener(({ x, y, z }) => {
    lastAccel = { x, y, z };
    updateHint(classifyPosture());
  });
}

export function stopMovementGuidance() {
  gyroSub?.remove();
  accelSub?.remove();
  gyroSub = null;
  accelSub = null;
  listeners.clear();
  currentHint = "stable";
  lastSpokenHint = null;
}

export function subscribeMovementHints(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** True when the frame is worth sending to Gemini. */
export function isFrameWorthAnalyzing(): boolean {
  return currentHint === "stable";
}

export function getCurrentHint(): PostureHint {
  return currentHint;
}
