import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  theme: any;
  placeholder?: string;
}

export default function VoiceRecorder({ onTranscription, theme, placeholder = "Appuie pour parler..." }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (isRecording) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500, easing: Easing.ease }),
          withTiming(1, { duration: 500, easing: Easing.ease })
        ),
        -1,
        false
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionStatus('denied');
    }
  };

  const startRecording = async () => {
    try {
      if (permissionStatus !== 'granted') {
        await checkPermissions();
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
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsTranscribing(false);
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      // Create form data with audio file
      const formData = new FormData();
      
      // Handle different platforms
      const fileInfo = {
        uri: Platform.OS === 'web' ? uri : uri,
        type: 'audio/webm',
        name: 'recording.webm',
      };
      
      formData.append('audio', fileInfo as any);

      const response = await fetch(`${API_URL}/api/voice/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success && data.text) {
        onTranscription(data.text);
      } else {
        console.error('Transcription failed:', data.error);
      }
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (permissionStatus === 'denied') {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Ionicons name="mic-off-outline" size={24} color={theme.textMuted} />
        <Text style={[styles.permissionText, { color: theme.textMuted }]}>
          Autorise l'accès au micro pour utiliser les notes vocales
        </Text>
        <TouchableOpacity 
          style={[styles.permissionButton, { backgroundColor: theme.accentWarm }]}
          onPress={checkPermissions}
        >
          <Text style={styles.permissionButtonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isTranscribing}
        activeOpacity={0.7}
        style={styles.buttonWrapper}
      >
        <Animated.View 
          style={[
            styles.recordButton,
            { backgroundColor: isRecording ? '#E74C3C' : theme.accentWarm },
            pulseStyle
          ]}
        >
          {isTranscribing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={28} 
              color="#fff" 
            />
          )}
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        {isTranscribing ? (
          <Text style={[styles.statusText, { color: theme.accentWarm }]}>
            Transcription en cours...
          </Text>
        ) : isRecording ? (
          <Text style={[styles.statusText, { color: '#E74C3C' }]}>
            Enregistrement... Appuie pour arrêter
          </Text>
        ) : (
          <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
            {placeholder}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  buttonWrapper: {
    marginRight: 14,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
  },
  permissionText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
