import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePedometer } from '@/hooks/use-pedometer';
import { TextToSpeechService } from '@/services/text-to-speech';
import { Priority, PriorityItem, getClosestHighPriorityItem } from '@/types/priority-item';

export default function HomeScreen() {
  const pedometerData = usePedometer();
  const [sampleItems] = useState<PriorityItem[]>([
    {
      id: '1',
      name: 'Grocery Store',
      priority: Priority.HIGH,
      location: { latitude: 37.7749, longitude: -122.4194 },
      distance: 250,
    },
    {
      id: '2',
      name: 'Pharmacy',
      priority: Priority.HIGH,
      location: { latitude: 37.7750, longitude: -122.4195 },
      distance: 350,
    },
    {
      id: '3',
      name: 'Coffee Shop',
      priority: Priority.MEDIUM,
      location: { latitude: 37.7751, longitude: -122.4196 },
      distance: 150,
    },
  ]);

  // Announce closest high priority item
  const handleAnnounceClosest = () => {
    const closestItem = getClosestHighPriorityItem(sampleItems);
    if (closestItem) {
      const distanceText = closestItem.distance 
        ? `${closestItem.distance} meters away` 
        : 'unknown distance';
      const announcement = `${closestItem.name}, priority ${closestItem.priority}, ${distanceText}.`;
      TextToSpeechService.speak(announcement);
    } else {
      TextToSpeechService.speak('No items found.');
    }
  };

  // Announce steps and distance
  const handleAnnounceSteps = () => {
    if (pedometerData.isAvailable) {
      TextToSpeechService.announceDistanceAndSteps(pedometerData.steps, pedometerData.distance);
    } else {
      TextToSpeechService.speak('Pedometer is not available on this device.');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Activity Tracker</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Pedometer Data Display */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Your Activity</ThemedText>
        {pedometerData.isAvailable ? (
          <View>
            <ThemedText style={styles.dataText}>
              Steps: <ThemedText type="defaultSemiBold">{pedometerData.steps}</ThemedText>
            </ThemedText>
            <ThemedText style={styles.dataText}>
              Distance: <ThemedText type="defaultSemiBold">
                {(pedometerData.distance / 1000).toFixed(2)} km
              </ThemedText> ({(pedometerData.distance / 1609.34).toFixed(2)} miles)
            </ThemedText>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleAnnounceSteps}
            >
              <ThemedText style={styles.buttonText}>🔊 Announce Activity</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <ThemedText>Pedometer not available on this device.</ThemedText>
        )}
      </ThemedView>

      {/* Priority Items Display */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Nearby Locations</ThemedText>
        {sampleItems.map((item: PriorityItem) => (
          <View key={item.id} style={styles.itemCard}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <ThemedText style={styles.itemDetails}>
              Priority: {item.priority.toUpperCase()} | Distance: {item.distance}m
            </ThemedText>
          </View>
        ))}
        <TouchableOpacity 
          style={styles.button}
          onPress={handleAnnounceClosest}
        >
          <ThemedText style={styles.buttonText}>🔊 Announce Closest Priority Item</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Instructions */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">How It Works</ThemedText>
        <ThemedText>
          • The app tracks your steps and calculates distance walked
        </ThemedText>
        <ThemedText>
          • Tap &quot;Announce Activity&quot; to hear your stats via text-to-speech
        </ThemedText>
        <ThemedText>
          • Tap &quot;Announce Closest Priority Item&quot; to hear about the nearest high-priority location
        </ThemedText>
        <ThemedText style={styles.noteText}>
          Note: Pedometer requires device permissions and may not work in simulators.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  dataText: {
    fontSize: 16,
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemCard: {
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    marginVertical: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  noteText: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
