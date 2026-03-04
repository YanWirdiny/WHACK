# FIXED.md — Bug Fixes Log

A running log of bugs found, diagnosed, and resolved in the Buddy project.

---

## [001] ElevenLabs Audio Race Condition

**Date:** 2026-03-03
**File:** `testFeature1/utils/elevenLabsService.ts`

### Description
When a recording/analysis error occurred, the `catch` block in `CameraRecorder.tsx` triggered `RecordingAnnouncements.error()` to speak the error aloud via ElevenLabs. This called `speak()`, which attempted to stop the previously playing `currentSound` before starting a new one. However, the sound object had already been unloaded by the OS (particularly when the phone was on an active call, which interrupts the app's audio session). Calling `stopAsync()` on an already-unloaded sound threw a second error, causing a cascading crash.

```
Error: Cannot complete operation because sound is not loaded.
  at speak (elevenLabsService.ts:62)
  at speakUrgent (elevenLabsService.ts:144)
  at RecordingAnnouncements.error (elevenLabsService.ts:171)
  at startRecording (CameraRecorder.tsx:133)
```

### Root Cause
The `currentSound` variable held a stale reference to a sound object that had been forcibly unloaded by the iOS audio session (triggered by an active phone call). The cleanup block had no guard against this state.

### Solution
Wrapped `stopAsync()` and `unloadAsync()` calls in a `try/catch` in both `speak()` and `stopAll()`. The stale reference is now safely cleared regardless of the sound's load state.

```ts
if (currentSound) {
  try {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
  } catch {
    // Sound may already be unloaded by OS — ignore
  }
  currentSound = null;
}
```

### Notes
- This bug is reproducible by testing while on an active phone call
- iOS audio session ownership transfers to the call, unloading app audio resources
- A permanent fix for in-call usage would require configuring `Audio.setAudioModeAsync` with `interruptionModeIOS: InterruptionModeIOS.DuckOthers`

**Docs:** https://docs.expo.dev/versions/latest/sdk/audio-av/

---

## [002] LiveAnalyzer — Wrong Camera Permission Hook

**Date:** 2026-03-03
**File:** `testFeature1/components/LiveAnalyzer.tsx`

### Description
`react-native-vision-camera` v4 exports `useCameraPermission` (singular), not `useCameraPermissions` (plural) as used in `expo-camera`. The component was importing the wrong hook name, causing a TypeScript error and a runtime crash on mount.

```
Cannot find name 'useCameraPermissions'. Did you mean 'useCameraPermission'?
```

### Solution
Replaced `useCameraPermissions()` (expo-camera style) with `useCameraPermission()` (vision-camera v4 style), and updated the destructuring from an array to an object:

```ts
// Before (wrong)
const [permission, requestPermission] = useCameraPermissions();

// After (correct)
const { hasPermission, requestPermission } = useCameraPermission();
```

**Docs:** https://react-native-vision-camera.com/docs/api/functions/useCameraPermission

---

## [003] LiveAnalyzer — Dynamic Import Inside Interval

**Date:** 2026-03-03
**File:** `testFeature1/components/LiveAnalyzer.tsx`

### Description
`expo-file-system` was being dynamically imported inside `setInterval` on every tick (every 1.5 seconds). This caused repeated module resolution overhead and potential memory pressure over time.

```ts
// Running every 1.5s — wrong
const { FileSystem } = await import('expo-file-system');
```

Additionally, the destructuring `{ FileSystem }` from the module was incorrect — the module's namespace export does not have a nested `FileSystem` property.

### Solution
Moved to a static top-level import using the `legacy` subpath (consistent with `geminiService.ts`):

```ts
import * as FileSystem from 'expo-file-system/legacy';
```

**Docs:** https://docs.expo.dev/versions/latest/sdk/filesystem/

---

## [004] LiveAnalyzer — Stale Closure in Double-Tap Gesture Guard

**Date:** 2026-03-03
**File:** `testFeature1/components/LiveAnalyzer.tsx`

### Description
`triggerOnDemandScan` used `systemState === 'on_demand'` to guard against duplicate scans. Because `systemState` is a React state value captured in a `useCallback` closure, the gesture handler could read a stale value from a previous render, allowing the scan to be triggered multiple times simultaneously.

### Solution
Replaced the `systemState` closure check with a `useRef` boolean (`isOnDemandRef`) that is always current regardless of render cycle:

```ts
const isOnDemandRef = useRef(false);

const triggerOnDemandScan = useCallback(async () => {
  if (!cameraRef.current || isOnDemandRef.current) return;
  try {
    isOnDemandRef.current = true;
    // ... scan logic
  } finally {
    isOnDemandRef.current = false;
  }
}, []); // no dependencies needed
```

**Docs:** https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents

---

## [005] Dev Build — iOS Code Signing Failure

**Date:** 2026-03-04
**Context:** First-time `npx expo run:ios --device` build

### Description
Build failed with:

```
error: No profiles for 'com.anonymous.Buddy' were found
Automatic signing is disabled and unable to generate a profile.
```

### Root Cause
The default bundle identifier `com.anonymous.Buddy` is a placeholder Expo sets on new projects. Xcode had automatic signing disabled and no provisioning profile existed for this identifier.

### Solution
1. Opened `ios/Buddy.xcworkspace` in Xcode
2. Selected **Buddy** target → **Signing & Capabilities**
3. Enabled **Automatically manage signing**
4. Selected Apple ID under **Team**
5. Changed bundle identifier from `com.anonymous.Buddy` to `com.yanwirdiny.Buddy`

---

## [006] Dev Build — Developer Mode Disabled on iPhone

**Date:** 2026-03-04
**Context:** `npx expo run:ios --device` after signing fix

### Description
Build succeeded but device was rejected as a target:

```
error: Developer Mode disabled
To use iPhone (2) for development, enable Developer Mode in
Settings → Privacy & Security.
```

### Root Cause
iOS 16+ requires Developer Mode to be explicitly enabled before a device can receive development builds. It is OFF by default.

### Solution
On the iPhone:
- **Settings → Privacy & Security → Developer Mode → Toggle ON → Restart**
- After restart tap **Turn On** on the confirmation prompt

One-time setup — persists until phone is reset.

---

## [007] Dev Build — App Launch Blocked (Invalid Code Signature)

**Date:** 2026-03-04
**Context:** After Developer Mode enabled, app installed but failed to launch

### Description
```
The request to open "com.yanwirdiny.Buddy" failed.
Unable to launch because it has an invalid code signature,
inadequate entitlements or its profile has not been explicitly
trusted by the user.
```

### Root Cause
iOS requires the user to manually trust a developer certificate the first time an app signed with a free Apple ID is installed.

### Solution
On the iPhone:
- **Settings → General → VPN & Device Management**
- Tap Apple ID email under Developer App
- Tap **Trust** → confirm

One-time per Apple ID per device.

---

## [008] Metro Connection — unsanitizedScriptUrlString = null / TurboModuleManager Timeout

**Date:** 2026-03-04
**Context:** App launched but crashed immediately after install

### Description
Two related errors appeared in sequence:

```
signaling unsanitizedScriptUrlString = null
TurboModuleManager: Timed out waiting for modules to be invalidated
```

### Root Cause
The app launched but could not reach the Metro JS bundler on the Mac. The JS bundle URL was null because:
1. Metro was not running, or
2. The phone and Mac were not on the same network, or
3. The ngrok tunnel binary was missing

React Native's TurboModuleManager initialized native modules, waited for JS to respond, timed out, and crashed.

### Solution
Installed ngrok and used tunnel mode:

```bash
brew install ngrok
npx expo start --dev-client --tunnel
```

Scanned the QR code from the terminal with the iPhone Camera app. The tunnel bypasses WiFi/IP configuration entirely and routes the JS bundle through a public URL.

**Docs:** https://docs.expo.dev/more/expo-cli/#--tunnel
