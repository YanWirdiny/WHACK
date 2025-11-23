import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { analyzeVideoWithGemini, GeminiAnalysisResult } from '../services/geminiService';
import { convertAndCompressToMp4 } from '../services/VideoConversion';
import { JsonDisplay } from './JsonDisplay';

export function CameraRecorder() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container}><Text>Loading camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const startRecording = async () => {
    if (!cameraRef.current || recording) return;

    try {
      setError(null);
      setResult(null);
      setRecording(true);

      console.log('📹 Starting 5-second video recording...');

      // Countdown before recording
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setCountdown(null);

      // Start recording
      const videoPromise = cameraRef.current.recordAsync({
        maxDuration: 5, // 5 seconds
      });

      // Show recording indicator
      console.log('🔴 Recording...');

      // Wait for recording to finish (5 seconds)
      const video = await videoPromise;

      if (!video || !video.uri) {
        throw new Error('Failed to record video');
      }

      console.log('✅ Recording complete:', video.uri);
      setRecording(false);

      // Analyze the recorded video
      console.log('🔍 Starting analysis...');
      setAnalyzing(true);

      // Process video (check if conversion needed)
      const processedUri = await convertAndCompressToMp4(video.uri);

      // Send to Gemini
      const analysisResult = await analyzeVideoWithGemini(processedUri);
      setResult(analysisResult);
      console.log('✅ Analysis complete');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Recording/Analysis failed:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setRecording(false);
      setAnalyzing(false);
      setCountdown(null);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && recording) {
      console.log('⏹️  Stopping recording...');
      cameraRef.current.stopRecording();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Camera Analysis</Text>
        <Text style={styles.headerSubtitle}>Tap screen to record 5-second video</Text>
      </View>

      {/* Camera Preview - Full Screen Tappable */}
      <Pressable 
        style={styles.cameraContainer}
        onPress={startRecording}
        disabled={recording || analyzing}
      >
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
          mode="video"
        >
          {/* Recording Indicator */}
          {recording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>RECORDING</Text>
            </View>
          )}

          {/* Countdown */}
          {countdown !== null && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {/* Analyzing Overlay */}
          {analyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
          )}
        </CameraView>

        {/* Tap Instruction Overlay - Covers entire pressable area */}
        {!recording && !analyzing && !result && (
          <View style={styles.tapInstructionOverlay}>
            <Text style={styles.tapInstructionText}>👆 TAP ANYWHERE</Text>
            <Text style={styles.tapInstructionSubtext}>to start recording</Text>
          </View>
        )}

        {/* Camera Controls Overlay (Small Flip Button) */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
            disabled={recording || analyzing}
          >
            <Text style={styles.flipButtonText}>🔄 Flip</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How it works:</Text>
        <Text style={styles.instructionsText}>1. Point camera at your surroundings</Text>
        <Text style={styles.instructionsText}>2. Tap anywhere on screen to record</Text>
        <Text style={styles.instructionsText}>3. Wait for 3-second countdown</Text>
        <Text style={styles.instructionsText}>4. Camera records for 5 seconds</Text>
        <Text style={styles.instructionsText}>5. AI analyzes video automatically</Text>
      </View>

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

          {/* Raw JSON */}
          <JsonDisplay data={result} title="📄 Full JSON Response" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    backgroundColor: '#fff',
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
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    fontSize: 16,
    color: '#666',
  },
  cameraContainer: {
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: 400,
  },
  tapInstructionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 23, 68, 0.95)', // Vibrant red background
  },
  tapInstructionText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tapInstructionSubtext: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  cameraControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  flipButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  flipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
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
    padding: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
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
