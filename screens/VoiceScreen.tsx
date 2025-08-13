import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Animated, Text, TouchableOpacity, View } from 'react-native';
import { InlineLoader } from '../components/LoadingScreen';
import { apiService } from '../services/api';

interface VoiceScreenProps {
  onVoiceComplete: (data: any) => void;
  onBack: () => void;
}

export default function VoiceScreen({ onVoiceComplete, onBack }: VoiceScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pulse1] = useState(new Animated.Value(0));
  const [pulse2] = useState(new Animated.Value(0));
  const [pulse3] = useState(new Animated.Value(0));

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      // Start multiple pulse animations with different delays
      const createPulseAnimation = (animatedValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      // Start all three pulse animations with different delays
      Animated.parallel([
        createPulseAnimation(pulse1, 0),
        createPulseAnimation(pulse2, 400),
        createPulseAnimation(pulse3, 800),
      ]).start();

      // Start duration counter
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop animations
      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, pulse1, pulse2, pulse3]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestMicrophonePermission = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Microphone access is needed to record voice memos for expenses.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      if (uri) {
        setIsProcessing(true);
        try {
          console.log('Voice recording URI:', uri);

          // Send audio URI directly to backend for processing
          const apiResponse = await apiService.processVoiceRecording(uri);

          if (apiResponse.success) {
            const processedData = {
              amount: apiResponse.data.amount?.toString() || '',
              description: apiResponse.data.description || '',
              category_id: apiResponse.data.category_id || '',
              expense_date: apiResponse.data.expense_date || new Date().toISOString().split('T')[0],
              notes: apiResponse.data.notes || 'Recorded via voice entry',
              item_breakdowns: apiResponse.data.item_breakdowns || [],
            };
            onVoiceComplete(processedData);
          } else {
            Alert.alert(
              'Processing Failed',
              apiResponse.message || 'Failed to process voice recording'
            );
          }
        } catch (error) {
          console.error('Voice processing error:', error);

          // Provide more specific error messages to the user
          let errorMessage = 'Failed to process voice recording. Please try again.';

          if (error instanceof Error) {
            if (error.message.includes('Network request failed')) {
              errorMessage = 'Network error: Please check your internet connection and try again.';
            } else if (error.message.includes('HTTP 401')) {
              errorMessage = 'Authentication error: Please log in again.';
            } else if (error.message.includes('HTTP 413')) {
              errorMessage = 'Audio file too large: Please record a shorter message.';
            } else if (error.message.includes('HTTP 500')) {
              errorMessage = 'Server error: Please try again later.';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'Request timeout: Please try again.';
            } else {
              errorMessage = `Error: ${error.message}`;
            }
          }

          Alert.alert('Voice Processing Error', errorMessage);
        } finally {
          setIsProcessing(false);
        }
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
      setIsProcessing(false);
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      try {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        setRecording(null);
        setRecordingDuration(0);
      } catch (error) {
        console.error('Failed to cancel recording:', error);
      }
    }
  };

  if (isProcessing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <StatusBar style="light" backgroundColor="#000000" />
        <InlineLoader size="large" showDots={false} />
        <Text className="mt-4 text-xl font-semibold text-foreground">Processing Voice...</Text>
        <Text className="mt-2 text-center text-muted-foreground">
          Converting your voice to expense data
        </Text>
      </View>
    );
  }

  const createPulseStyle = (animatedValue: Animated.Value, maxScale: number) => ({
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, maxScale],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.7, 0.3, 0],
    }),
  });

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-foreground">Voice Entry</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Speak naturally about your expense
            </Text>
          </View>
        </View>
      </View>

      {/* Recording Interface */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Visualizer Circle */}
        <View className="mb-8 items-center justify-center">
          {/* Pulse rings - perfectly centered */}
          {isRecording && (
            <View className="absolute items-center justify-center">
              <Animated.View
                style={[
                  {
                    width: 128,
                    height: 128,
                    borderRadius: 64,
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                  },
                  createPulseStyle(pulse1, 2.5),
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: 128,
                    height: 128,
                    borderRadius: 64,
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                  },
                  createPulseStyle(pulse2, 2.0),
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: 128,
                    height: 128,
                    borderRadius: 64,
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                  },
                  createPulseStyle(pulse3, 1.5),
                ]}
              />
            </View>
          )}

          {/* Main microphone circle */}
          <View
            className={`h-32 w-32 items-center justify-center rounded-full ${
              isRecording ? 'bg-red-500' : 'bg-primary'
            }`}>
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={48}
              color={isRecording ? '#FFFFFF' : '#000000'}
            />
          </View>
        </View>

        {/* Recording Status */}
        <View className="items-center">
          <Text className="text-xl font-semibold text-foreground">
            {isRecording ? 'Recording...' : 'Ready to Record'}
          </Text>

          {isRecording && (
            <Text className="mt-2 font-mono text-lg text-primary">
              {formatDuration(recordingDuration)}
            </Text>
          )}

          <Text className="mt-4 text-center text-muted-foreground">
            {isRecording
              ? 'Speak clearly about your expense'
              : 'Tap the microphone to start recording'}
          </Text>
        </View>

        {/* Example phrases */}
        {!isRecording && (
          <View className="mt-8 w-full rounded-xl border border-border bg-muted p-4">
            <Text className="mb-2 font-medium text-foreground">Try saying:</Text>
            <Text className="text-sm text-muted-foreground">
              • I spent $12.50 on lunch at McDonald&apos;s
            </Text>
            <Text className="text-sm text-muted-foreground">
              • Coffee for $4.25 at Starbucks this morning
            </Text>
            <Text className="text-sm text-muted-foreground">
              • Grocery shopping $85 at Whole Foods
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View className="px-6 pb-8">
        {isRecording ? (
          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={cancelRecording}
              className="flex-1 rounded-lg border border-border bg-secondary py-4">
              <Text className="text-center font-medium text-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopRecording} className="flex-1 rounded-lg bg-primary py-4">
              <Text className="text-center font-medium text-primary-foreground">Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={startRecording} className="w-full rounded-lg bg-primary py-4">
            <View className="flex-row items-center justify-center">
              <Ionicons name="mic" size={20} color="#000000" />
              <Text className="ml-2 font-medium text-primary-foreground">Start Recording</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
