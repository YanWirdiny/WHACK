# Distance & Steps Extraction with Text-to-Speech

## Overview
This implementation provides a complete solution for extracting distance and step data from device sensors and converting it to speech based on priority-based item tracking.

## Features

### 1. Pedometer Integration
- **Hook**: `hooks/use-pedometer.ts`
- Tracks steps in real-time using expo-sensors
- Automatically calculates distance based on average step length (0.762 meters)
- Returns current steps, distance, and availability status

### 2. Text-to-Speech Service
- **Service**: `services/text-to-speech.ts`
- Converts text to speech using expo-speech
- Provides methods for:
  - Generic text-to-speech with customizable options (language, pitch, rate)
  - Specialized distance/steps announcements
  - Speech control (start, stop, status)

### 3. Priority-Based Item Tracking
- **Types**: `types/priority-item.ts`
- Defines priority levels: HIGH, MEDIUM, LOW
- Calculates distances using Haversine formula
- Sorts items by priority and distance
- Finds closest high-priority item

## Structure

```
WHACK/
├── hooks/
│   └── use-pedometer.ts          # React hook for pedometer functionality
├── services/
│   └── text-to-speech.ts         # TTS service for announcements
├── types/
│   └── priority-item.ts          # Priority item types and utilities
└── app/(tabs)/
    └── index.tsx                 # Main screen with integrated features
```

## Usage

### In the Main Screen (app/(tabs)/index.tsx)

```typescript
import { usePedometer } from '@/hooks/use-pedometer';
import { TextToSpeechService } from '@/services/text-to-speech';

// Track steps and distance
const pedometerData = usePedometer();

// Access data
console.log(pedometerData.steps);      // Number of steps
console.log(pedometerData.distance);   // Distance in meters
console.log(pedometerData.isAvailable); // Pedometer availability

// Announce activity
TextToSpeechService.announceDistanceAndSteps(
  pedometerData.steps, 
  pedometerData.distance
);

// Announce custom text
TextToSpeechService.speak("Custom announcement", {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0
});
```

### Priority Item Tracking

```typescript
import { Priority, PriorityItem, getClosestHighPriorityItem } from '@/types/priority-item';

const items: PriorityItem[] = [
  {
    id: '1',
    name: 'Grocery Store',
    priority: Priority.HIGH,
    location: { latitude: 37.7749, longitude: -122.4194 },
    distance: 250,
  },
  // ... more items
];

// Get closest high-priority item
const closestItem = getClosestHighPriorityItem(items);
if (closestItem) {
  TextToSpeechService.speak(`${closestItem.name} is ${closestItem.distance} meters away`);
}
```

## API Reference

### usePedometer Hook
Returns an object with:
- `steps: number` - Current step count
- `distance: number` - Distance in meters
- `isAvailable: boolean` - Whether pedometer is available

### TextToSpeechService
Methods:
- `speak(text: string, options?: SpeechOptions): Promise<void>` - Speak text
- `stop(): Promise<void>` - Stop current speech
- `getSpeakingStatus(): boolean` - Check if currently speaking
- `announceDistanceAndSteps(steps: number, distance: number): void` - Announce activity

### Priority Item Utilities
- `calculateDistance(lat1, lon1, lat2, lon2): number` - Calculate distance between coordinates
- `sortItemsByPriorityAndDistance(items): PriorityItem[]` - Sort items by priority and distance
- `getClosestHighPriorityItem(items): PriorityItem | null` - Get closest high-priority item

## Dependencies
- `expo-sensors` - For pedometer functionality
- `expo-speech` - For text-to-speech functionality

## Important Notes

1. **Permissions**: Pedometer requires motion/activity permissions on physical devices
2. **Simulator Limitations**: Pedometer may not work in iOS/Android simulators
3. **Step Length**: Uses average step length of 0.762 meters (can be customized)
4. **Distance Calculation**: Haversine formula for geographic distance between coordinates

## Testing

On a physical device:
1. Grant motion/activity permissions when prompted
2. Walk around to see step count increase
3. Tap "Announce Activity" to hear your stats
4. Tap "Announce Closest Priority Item" to hear about nearby locations

## Customization

### Adjust Step Length
In `hooks/use-pedometer.ts`, modify:
```typescript
const STEP_LENGTH_METERS = 0.762; // Change this value
```

### Add Custom Priority Items
In the main screen, update the `sampleItems` array with your own locations and priorities.

### Customize Speech
Pass options to `TextToSpeechService.speak()`:
```typescript
TextToSpeechService.speak("Hello", {
  language: 'en-GB',  // British English
  pitch: 1.2,         // Higher pitch
  rate: 0.8,          // Slower rate
});
```
