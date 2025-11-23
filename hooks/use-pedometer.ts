import { useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

interface PedometerData {
  steps: number;
  distance: number;
  isAvailable: boolean;
}

/**
 * Custom hook to track steps and calculate distance
 * Assumes average step length of 0.762 meters (2.5 feet)
 */
export function usePedometer() {
  const [pedometerData, setPedometerData] = useState<PedometerData>({
    steps: 0,
    distance: 0,
    isAvailable: false,
  });

  const STEP_LENGTH_METERS = 0.762; // Average step length

  useEffect(() => {
    let subscription: any;

    const setupPedometer = async () => {
      // Check if pedometer is available
      const available = await Pedometer.isAvailableAsync();
      
      if (available) {
        setPedometerData(prev => ({ ...prev, isAvailable: true }));

        // Subscribe to pedometer updates
        subscription = Pedometer.watchStepCount((result) => {
          const steps = result.steps;
          const distance = steps * STEP_LENGTH_METERS;
          
          setPedometerData({
            steps,
            distance,
            isAvailable: true,
          });
        });
      } else {
        console.log('Pedometer not available on this device');
        setPedometerData(prev => ({ ...prev, isAvailable: false }));
      }
    };

    setupPedometer();

    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return pedometerData;
}
