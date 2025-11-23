import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { analyzeVideoWithGemini, GeminiAnalysisResult } from '../services/geminiService';
import { convertAndCompressToMp4 } from '../services/VideoConversion';
import { speakNarrative } from '../utils/elevenLabsService';
import { hazardPattern, successPattern } from '../utils/hapticsService';

export function VideoAnalyzer() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<string>('');
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime'], // Support both MP4 and MOV (iPhone default)
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        setVideoUri(video.uri);
        setError(null);
        setResult(null);
        setConversionProgress('');
        console.log('✅ Video selected:', video.uri);
      }
    } catch (err) {
      console.error('Error picking video:', err);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const analyzeVideo = async () => {
    if (!videoUri) {
      Alert.alert('No Video', 'Please select a video first');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let processedVideoUri = videoUri;

      // Check if video is MOV format and needs conversion
      const isMov = videoUri.toLowerCase().endsWith('.mov') || videoUri.includes('.mov?');
      
      if (isMov) {
        console.log('🎬 MOV format detected, converting to MP4...');
        setConverting(true);
        setConversionProgress('Uploading video to CloudConvert...');
        
        try {
          processedVideoUri = await convertAndCompressToMp4(videoUri);
          console.log('✅ Conversion complete:', processedVideoUri);
          setConversionProgress('Conversion complete!');
        } catch (conversionError) {
          console.error('❌ Conversion failed:', conversionError);
          
          // Ask user if they want to try with original file
          Alert.alert(
            'Conversion Failed',
            'Video conversion failed. Would you like to try analyzing the original MOV file instead? (This may not work)',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setAnalyzing(false);
                  setConverting(false);
                  return;
                },
              },
              {
                text: 'Try Original',
                onPress: () => {
                  console.log('⚠️ Using original MOV file...');
                  processedVideoUri = videoUri;
                },
              },
            ]
          );
        } finally {
          setConverting(false);
        }
      }

      console.log('🔍 Starting analysis...');
      const analysisResult = await analyzeVideoWithGemini(processedVideoUri);
      setResult(analysisResult);
      console.log('✅ Analysis complete');

      // Play haptic feedback
      successPattern();

      // Speak the narrative after a brief delay using ElevenLabs
      if (analysisResult.spoken_narrative) {
        setTimeout(() => {
          speakNarrative(analysisResult.spoken_narrative, analysisResult.safety_level);
        }, 1000);
      }

      // Additional haptic feedback for danger
      if (analysisResult.safety_level === 'danger') {
        setTimeout(() => {
          hazardPattern();
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Analysis failed:', errorMessage);
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setAnalyzing(false);
      setConverting(false);
      setConversionProgress('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gemini Video Analysis</Text>
        <Text style={styles.headerSubtitle}>AI-powered accessibility assistant</Text>
      </View>

      {/* Video Selection */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={pickVideo} 
        disabled={analyzing || converting}
      >
        <Text style={styles.buttonText}>
          {videoUri ? '✓ Video Selected' : '📁 Select Video (MP4/MOV)'}
        </Text>
      </TouchableOpacity>

      {videoUri && (
        <View style={styles.videoInfo}>
          <Text style={styles.videoInfoText}>📹 Video ready for analysis</Text>
          <Text style={styles.videoPath} numberOfLines={1}>
            {videoUri}
          </Text>
        </View>
      )}

      {/* Analyze Button */}
      {videoUri && (
        <TouchableOpacity
          style={[
            styles.button, 
            styles.analyzeButton, 
            (analyzing || converting) && styles.buttonDisabled
          ]}
          onPress={analyzeVideo}
          disabled={analyzing || converting}
        >
          {converting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>  Converting to MP4...</Text>
            </View>
          ) : analyzing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>  Analyzing...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🔍 Analyze with Gemini</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Conversion Progress */}
      {conversionProgress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>⏳ {conversionProgress}</Text>
          <Text style={styles.progressSubtext}>
            This may take 30-60 seconds. Please wait...
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results Display */}
      {result && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>✅ Analysis Complete</Text>

          {/* Spoken Narrative - Most Important for Accessibility */}
          {result.spoken_narrative && (
            <View style={styles.narrativeCard}>
              <View style={styles.narrativeHeader}>
                <Text style={styles.narrativeIcon}>🔊</Text>
                <Text style={styles.narrativeLabel}>Audio Description</Text>
              </View>
              <Text style={styles.narrativeText}>{result.spoken_narrative}</Text>
              <TouchableOpacity 
                style={styles.repeatButton}
                onPress={() => {
                  speakNarrative(result.spoken_narrative, result.safety_level);
                }}
              >
                <Text style={styles.repeatButtonText}>🔁 Repeat Audio</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scene Overview */}
          <View style={styles.sceneCard}>
            <Text style={styles.sceneLabel}>Scene:</Text>
            <Text style={styles.sceneText}>{result.scene}</Text>
          </View>

          {/* Safety Level */}
          {result.safety_level && (
            <View style={[
              styles.safetyCard,
              result.safety_level === 'danger' && styles.safetyDanger,
              result.safety_level === 'warning' && styles.safetyWarning,
              result.safety_level === 'caution' && styles.safetyCaution,
            ]}>
              <Text style={styles.safetyLabel}>⚠️ Safety Level:</Text>
              <Text style={styles.safetyText}>{result.safety_level.toUpperCase()}</Text>
            </View>
          )}

          {/* Objects Detected */}
          {result.objects && result.objects.length > 0 && (
            <View style={styles.objectsSection}>
              <Text style={styles.sectionTitle}>
                Objects Detected ({result.objects.length})
              </Text>
              {result.objects.map((obj, index) => (
                <View key={index} style={styles.objectCard}>
                  <Text style={styles.objectName}>
                    {index + 1}. {obj.name}
                  </Text>
                  <Text style={styles.objectDetail}>📍 Position: {obj.position}</Text>
                  <Text style={styles.objectDetail}>
                    📏 Distance: {obj.distance_category} ({obj.distance_estimate})
                  </Text>
                  <Text style={styles.objectDetail}>⚠️ Urgency: {obj.urgency}</Text>
                  <Text style={styles.objectDescription}>{obj.audio_description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationLabel}>💡 Recommendation:</Text>
              <Text style={styles.recommendationText}>{result.recommendation}</Text>
            </View>
          )}

          {/* Raw JSON - Hidden for cleaner UI */}
          {/* <JsonDisplay data={result} title="📄 Full JSON Response" /> */}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 24,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  videoInfoText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 4,
  },
  videoPath: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Courier',
  },
  progressContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#E65100',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  narrativeCard: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  narrativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  narrativeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  narrativeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  narrativeText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#0D47A1',
    marginBottom: 16,
    fontWeight: '500',
  },
  repeatButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  repeatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sceneCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  sceneLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  sceneText: {
    fontSize: 16,
    color: '#333',
  },
  safetyCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  safetyDanger: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  safetyWarning: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  safetyCaution: {
    backgroundColor: '#FFF9C4',
    borderLeftColor: '#FFC107',
  },
  safetyLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  objectsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  objectCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  objectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  objectDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  objectDescription: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    fontStyle: 'italic',
  },
  recommendationCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#E65100',
  },
});