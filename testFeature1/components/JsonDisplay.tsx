import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GeminiAnalysisResult } from '../services/geminiService';

interface JsonDisplayProps {
  data: GeminiAnalysisResult | any;
  title?: string;
}

export function JsonDisplay({ data, title = 'Analysis Result' }: JsonDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.json}>{JSON.stringify(data, null, 2)}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
    maxHeight: 400,
  },
  json: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#e0e0e0',
    lineHeight: 18,
  },
});
