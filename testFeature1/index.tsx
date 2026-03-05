import React, { useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LiveAnalyzer } from './components/LiveAnalyzer';
import { LoadingScreen } from './components/LoadingScreen';

export default function TestFeature1Screen() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <LiveAnalyzer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

