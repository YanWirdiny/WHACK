# Activity Tracker with Text-to-Speech

This is an [Expo](https://expo.dev) project that tracks your steps and distance, and announces them via text-to-speech.

## 🚀 Quick Start

See [QUICKSTART.md](QUICKSTART.md) for immediate usage instructions.

## ✨ Features

- 📱 Real-time step counting
- 📏 Automatic distance calculation (km & miles)
- 🔊 Text-to-speech announcements
- 🎯 Priority-based location tracking
- 📍 Find closest high-priority items
- 🎨 Clean, interactive UI

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Open the app:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR with Expo Go app for physical device

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Complete API reference and usage guide
- **[SOLUTION.md](SOLUTION.md)** - Project architecture and design decisions
- **[examples/usage-examples.tsx](examples/usage-examples.tsx)** - 7 code examples

## 💻 Usage Example

```typescript
import { usePedometer } from '@/hooks/use-pedometer';
import { TextToSpeechService } from '@/services/text-to-speech';

function MyComponent() {
  const { steps, distance, isAvailable } = usePedometer();
  
  const handleAnnounce = () => {
    TextToSpeechService.announceDistanceAndSteps(steps, distance);
  };
  
  return (
    <View>
      <Text>Steps: {steps}</Text>
      <Text>Distance: {(distance / 1000).toFixed(2)} km</Text>
      <Button title="Announce" onPress={handleAnnounce} />
    </View>
  );
}
```

## 🏗️ Project Structure

```
WHACK/
├── app/(tabs)/index.tsx          # Main screen
├── hooks/use-pedometer.ts        # Step tracking
├── services/text-to-speech.ts    # TTS functionality
├── types/priority-item.ts        # Priority system
└── examples/                     # Usage examples
```

## 📦 Dependencies

- `expo-sensors` - Pedometer functionality
- `expo-speech` - Text-to-speech
- React Native & Expo SDK

## 🔒 Security

✅ CodeQL security scan passed with 0 vulnerabilities

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
