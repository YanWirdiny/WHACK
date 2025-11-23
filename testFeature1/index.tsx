import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { VideoAnalyzer } from './components/VideoAnalyzer';

export default function TestFeature1Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <VideoAnalyzer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
