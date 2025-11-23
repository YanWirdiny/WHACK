// Example Usage File - Complete Implementation Guide

/**
 * EXAMPLE 1: Basic Pedometer Usage
 * 
 * This example shows how to extract steps and distance data
 */

import { usePedometer } from '@/hooks/use-pedometer';

function ExamplePedometer() {
  const pedometerData = usePedometer();
  
  // Extract the data
  const steps = pedometerData.steps;
  const distanceMeters = pedometerData.distance;
  const distanceKm = distanceMeters / 1000;
  const distanceMiles = distanceMeters / 1609.34;
  
  console.log(`Steps: ${steps}`);
  console.log(`Distance: ${distanceKm.toFixed(2)} km (${distanceMiles.toFixed(2)} miles)`);
  
  return { steps, distanceMeters, distanceKm, distanceMiles };
}

/**
 * EXAMPLE 2: Text-to-Speech for Distance/Steps
 * 
 * This example shows how to convert extracted data to speech
 */

import { TextToSpeechService } from '@/services/text-to-speech';

function ExampleTTS() {
  const pedometerData = usePedometer();
  
  // Method 1: Use the built-in announcer
  const announceActivity = () => {
    TextToSpeechService.announceDistanceAndSteps(
      pedometerData.steps,
      pedometerData.distance
    );
    // Speaks: "You have walked X steps, covering Y kilometers or Z miles."
  };
  
  // Method 2: Create custom announcement
  const customAnnounce = () => {
    const distanceKm = (pedometerData.distance / 1000).toFixed(2);
    const text = `Current progress: ${pedometerData.steps} steps, ${distanceKm} kilometers`;
    TextToSpeechService.speak(text);
  };
  
  // Method 3: Customize speech options
  const customizedSpeech = () => {
    TextToSpeechService.speak("Your current stats", {
      language: 'en-US',
      pitch: 1.2,    // Higher pitch
      rate: 0.9,     // Slightly slower
    });
  };
  
  return { announceActivity, customAnnounce, customizedSpeech };
}

/**
 * EXAMPLE 3: Priority-Based Item System
 * 
 * This example shows how to work with priority items and find closest ones
 */

import { 
  Priority, 
  PriorityItem, 
  getClosestHighPriorityItem,
  calculateDistance,
  sortItemsByPriorityAndDistance
} from '@/types/priority-item';

function ExamplePriorityItems() {
  // Define your items
  const items: PriorityItem[] = [
    {
      id: '1',
      name: 'Hospital',
      priority: Priority.HIGH,
      location: { latitude: 37.7749, longitude: -122.4194 },
      distance: 500, // 500 meters away
    },
    {
      id: '2',
      name: 'Pharmacy',
      priority: Priority.HIGH,
      location: { latitude: 37.7750, longitude: -122.4195 },
      distance: 300, // 300 meters away
    },
    {
      id: '3',
      name: 'Restaurant',
      priority: Priority.MEDIUM,
      location: { latitude: 37.7751, longitude: -122.4196 },
      distance: 150, // 150 meters away
    },
    {
      id: '4',
      name: 'Park',
      priority: Priority.LOW,
      location: { latitude: 37.7752, longitude: -122.4197 },
      distance: 100, // 100 meters away
    },
  ];
  
  // Find closest high-priority item
  // Will return Pharmacy (HIGH priority, 300m) over Hospital (HIGH priority, 500m)
  // Will NOT return Restaurant (MEDIUM) or Park (LOW) even though they're closer
  const closestHighPriority = getClosestHighPriorityItem(items);
  
  if (closestHighPriority) {
    console.log(`Closest high-priority item: ${closestHighPriority.name}`);
    console.log(`Distance: ${closestHighPriority.distance}m`);
    
    // Announce it via TTS
    const announcement = `${closestHighPriority.name}, priority ${closestHighPriority.priority}, ${closestHighPriority.distance} meters away`;
    TextToSpeechService.speak(announcement);
  }
  
  // Sort all items by priority and distance
  const sorted = sortItemsByPriorityAndDistance(items);
  // Result order: Pharmacy (HIGH, 300m), Hospital (HIGH, 500m), 
  //               Restaurant (MEDIUM, 150m), Park (LOW, 100m)
  
  return { closestHighPriority, sorted };
}

/**
 * EXAMPLE 4: Calculate Distance Between Coordinates
 */

function ExampleDistanceCalculation() {
  const userLocation = { lat: 37.7749, lon: -122.4194 }; // San Francisco
  const targetLocation = { lat: 37.7750, lon: -122.4195 }; // Nearby location
  
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lon,
    targetLocation.lat,
    targetLocation.lon
  );
  
  console.log(`Distance: ${distance.toFixed(2)} meters`);
  
  return distance;
}

/**
 * EXAMPLE 5: Complete Integration - React Component
 * 
 * This shows the complete flow of extracting data and announcing via TTS
 */

import { useState, useEffect } from 'react';
import { View, Button, Text } from 'react-native';

function CompleteExample() {
  const pedometerData = usePedometer();
  const [priorityItems] = useState<PriorityItem[]>([
    {
      id: '1',
      name: 'Grocery Store',
      priority: Priority.HIGH,
      location: { latitude: 37.7749, longitude: -122.4194 },
      distance: 250,
    },
    // ... more items
  ]);
  
  // Auto-announce when step milestone reached
  useEffect(() => {
    if (pedometerData.steps > 0 && pedometerData.steps % 100 === 0) {
      TextToSpeechService.speak(`Milestone reached: ${pedometerData.steps} steps!`);
    }
  }, [pedometerData.steps]);
  
  // Handler for manual announcement
  const handleAnnounceAll = () => {
    const closestItem = getClosestHighPriorityItem(priorityItems);
    
    if (closestItem && pedometerData.isAvailable) {
      const stepsText = `You have walked ${pedometerData.steps} steps, covering ${(pedometerData.distance / 1000).toFixed(2)} kilometers.`;
      const itemText = `The closest high-priority location is ${closestItem.name}, ${closestItem.distance} meters away.`;
      const announcement = `${stepsText} ${itemText}`;
      TextToSpeechService.speak(announcement);
    }
  };
  
  return (
    <View>
      <Text>Steps: {pedometerData.steps}</Text>
      <Text>Distance: {(pedometerData.distance / 1000).toFixed(2)} km</Text>
      <Button title="Announce Stats" onPress={handleAnnounceAll} />
    </View>
  );
}

/**
 * EXAMPLE 6: Real-time Location Updates
 * 
 * This shows how to update item distances based on user location
 * Note: Requires 'expo-location' package to be installed
 */

// Commented out to avoid compilation errors if expo-location is not installed
// import * as Location from 'expo-location';

async function ExampleRealTimeUpdates() {
  const items: PriorityItem[] = [
    {
      id: '1',
      name: 'Store',
      priority: Priority.HIGH,
      location: { latitude: 37.7749, longitude: -122.4194 },
    },
  ];

  // Uncomment if using expo-location:
  /*
  // Get user's current location
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Location permission denied');
    return;
  }
  
  const location = await Location.getCurrentPositionAsync({});
  const userLat = location.coords.latitude;
  const userLon = location.coords.longitude;
  
  // Update distances for all items
  const itemsWithUpdatedDistances = items.map(item => ({
    ...item,
    distance: calculateDistance(
      userLat,
      userLon,
      item.location.latitude,
      item.location.longitude
    )
  }));
  
  // Find and announce closest
  const closest = getClosestHighPriorityItem(itemsWithUpdatedDistances);
  if (closest && closest.distance) {
    TextToSpeechService.speak(
      `Nearest priority location: ${closest.name}, ${closest.distance.toFixed(0)} meters away`
    );
  }
  */
  
  return items;
}

/**
 * EXAMPLE 7: Stop Speech
 */

function ExampleStopSpeech() {
  const handleStop = async () => {
    await TextToSpeechService.stop();
  };
  
  const checkIfSpeaking = () => {
    const isSpeaking = TextToSpeechService.getSpeakingStatus();
    console.log(`Currently speaking: ${isSpeaking}`);
  };
  
  return { handleStop, checkIfSpeaking };
}

/**
 * KEY POINTS:
 * 
 * 1. Pedometer Data Extraction:
 *    - Use usePedometer() hook
 *    - Access: steps (number), distance (meters), isAvailable (boolean)
 * 
 * 2. Text-to-Speech:
 *    - TextToSpeechService.speak(text, options?) for custom announcements
 *    - TextToSpeechService.announceDistanceAndSteps(steps, distance) for activity
 *    - TextToSpeechService.stop() to stop speech
 * 
 * 3. Priority System:
 *    - Items sorted first by priority (HIGH > MEDIUM > LOW)
 *    - Then by distance (closer first)
 *    - getClosestHighPriorityItem() returns the best match
 * 
 * 4. Distance Calculation:
 *    - Uses Haversine formula for accurate geographic distance
 *    - Returns distance in meters
 * 
 * 5. Integration:
 *    - All components work together seamlessly
 *    - Real-time updates from pedometer
 *    - Immediate TTS feedback
 */

export {
  ExamplePedometer,
  ExampleTTS,
  ExamplePriorityItems,
  ExampleDistanceCalculation,
  CompleteExample,
  ExampleRealTimeUpdates,
  ExampleStopSpeech,
};
