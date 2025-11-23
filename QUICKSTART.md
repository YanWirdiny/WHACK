# Quick Start Guide

This guide will help you get started with the distance/steps extraction and text-to-speech features immediately.

## Installation

1. **Install dependencies** (already done):
```bash
npm install
```

2. **Run the app**:
```bash
npm start
```

3. **Choose your platform**:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## Immediate Usage

Once the app loads, you'll see:

### 1. Your Activity Section
- **Steps**: Live count of your steps
- **Distance**: Calculated distance in km and miles
- **Button**: "🔊 Announce Activity" - Tap to hear your stats

### 2. Nearby Locations Section
- Shows sample priority items with distances
- **Button**: "🔊 Announce Closest Priority Item" - Tap to hear nearest high-priority location

### 3. How It Works Section
- Instructions and notes about the app

## Code Integration

### Extract Steps and Distance
```typescript
import { usePedometer } from '@/hooks/use-pedometer';

function MyComponent() {
  const { steps, distance, isAvailable } = usePedometer();
  
  return (
    <Text>Steps: {steps}, Distance: {distance}m</Text>
  );
}
```

### Text-to-Speech
```typescript
import { TextToSpeechService } from '@/services/text-to-speech';

// Simple announcement
TextToSpeechService.speak("Hello world");

// Announce activity
TextToSpeechService.announceDistanceAndSteps(steps, distance);

// Custom options
TextToSpeechService.speak("Hello", {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0
});
```

### Priority Items
```typescript
import { Priority, PriorityItem, getClosestHighPriorityItem } from '@/types/priority-item';

const items: PriorityItem[] = [
  {
    id: '1',
    name: 'Store',
    priority: Priority.HIGH,
    location: { latitude: 37.7749, longitude: -122.4194 },
    distance: 250,
  },
];

const closest = getClosestHighPriorityItem(items);
console.log(closest.name); // "Store"
```

## File Structure

```
WHACK/
├── app/(tabs)/index.tsx          ← Main screen (start here)
├── hooks/use-pedometer.ts        ← Step tracking
├── services/text-to-speech.ts    ← TTS functionality
├── types/priority-item.ts        ← Priority system
├── examples/usage-examples.tsx   ← Code examples
├── IMPLEMENTATION.md             ← Full documentation
├── SOLUTION.md                   ← Project summary
└── QUICKSTART.md                 ← This file
```

## Common Tasks

### Add New Priority Item
```typescript
const newItem: PriorityItem = {
  id: '4',
  name: 'Hospital',
  priority: Priority.HIGH,
  location: { latitude: 37.7749, longitude: -122.4194 },
  distance: 500, // meters
};
```

### Change Step Length
Edit `hooks/use-pedometer.ts`:
```typescript
const STEP_LENGTH_METERS = 0.762; // Change this value
```

### Customize Speech Voice
```typescript
TextToSpeechService.speak("Custom voice", {
  pitch: 1.5,  // Higher pitch
  rate: 0.8,   // Slower speed
});
```

## Testing on Physical Device

1. Install Expo Go app on your phone
2. Run `npm start` on your computer
3. Scan the QR code with Expo Go
4. Grant motion permissions when prompted
5. Walk around to see steps increase
6. Tap buttons to hear announcements

## Troubleshooting

**Pedometer shows 0 steps:**
- Make sure you're on a physical device (doesn't work in simulators)
- Grant motion/activity permissions
- Walk a few steps to trigger the sensor

**No sound from TTS:**
- Check device volume
- Ensure device is not in silent mode
- Try tapping the button again

**Permission errors:**
- Go to Settings > Your App > Permissions
- Enable Motion & Fitness permissions

## Next Steps

1. ✅ Run the app and test basic functionality
2. ✅ Try tapping the announcement buttons
3. ✅ Check `examples/usage-examples.tsx` for more code samples
4. ✅ Read `IMPLEMENTATION.md` for detailed API documentation
5. ✅ Customize the priority items for your use case

## Getting Help

- **Full Documentation**: See `IMPLEMENTATION.md`
- **Code Examples**: See `examples/usage-examples.tsx`
- **Project Summary**: See `SOLUTION.md`
- **Main Screen Code**: See `app/(tabs)/index.tsx`

## What You Get

✅ Real-time step and distance tracking
✅ Text-to-speech announcements
✅ Priority-based location tracking
✅ Clean UI with interactive buttons
✅ Full TypeScript support
✅ Comprehensive documentation
✅ Working examples

Everything is ready to use. Just run `npm start` and start testing!
