import React, { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AudioRecorderProps = {
  onRecorded: (uri: string, durationSec: number, mime: string) => void;
};

export const AudioRecorder = ({ onRecorded }: AudioRecorderProps) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('Ready to record.');
  const persistentAudioDir = `${FileSystem.documentDirectory ?? ''}memoiries/audio/`;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const requestPermission = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      setStatusMessage('Microphone access is needed to record.');
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    const granted = await requestPermission();
    if (!granted) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await newRecording.startAsync();
    setRecording(newRecording);
    setStatusMessage('Recording… Tap stop when finished.');
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    const seconds = status.isLoaded ? status.durationMillis / 1000 : 0;
    if (uri) {
      let persistedUri = uri;
      try {
        if (persistentAudioDir) {
          await FileSystem.makeDirectoryAsync(persistentAudioDir, { intermediates: true });
          const filename = `recording-${Date.now()}.m4a`;
          const destination = `${persistentAudioDir}${filename}`;
          await FileSystem.copyAsync({ from: uri, to: destination });
          persistedUri = destination;
        }
      } catch (error) {
        console.warn('Failed to persist audio recording, using temp file.', error);
      }
      setAudioUri(persistedUri);
      setDurationSec(seconds);
      onRecorded(persistedUri, seconds, 'audio/m4a');
    }
    setRecording(null);
    setStatusMessage('Recording saved. You can play it back or redo.');
  };

  const playRecording = async () => {
    if (!audioUri) return;
    const { sound: playbackSound } = await Audio.Sound.createAsync({ uri: audioUri });
    setSound(playbackSound);
    await playbackSound.playAsync();
  };

  const redoRecording = async () => {
    if (audioUri && persistentAudioDir && audioUri.startsWith(persistentAudioDir)) {
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete persisted recording.', error);
      }
    }
    setAudioUri(null);
    setDurationSec(0);
    setStatusMessage('Ready to record.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status} allowFontScaling>
        {statusMessage}
      </Text>
      <View style={styles.row}>
        {!recording ? (
          <Pressable
            onPress={startRecording}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            accessibilityHint="Begins recording your story"
          >
            <Text style={styles.buttonText} allowFontScaling>
              Record
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={stopRecording}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            accessibilityHint="Stops recording and saves the audio"
          >
            <Text style={styles.buttonText} allowFontScaling>
              Stop
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={playRecording}
          disabled={!audioUri}
          style={[styles.secondaryButton, !audioUri ? styles.disabled : null]}
          accessibilityRole="button"
          accessibilityLabel="Play recording"
          accessibilityHint="Plays back your recorded story"
        >
          <Text style={styles.secondaryText} allowFontScaling>
            Play
          </Text>
        </Pressable>
        <Pressable
          onPress={redoRecording}
          disabled={!audioUri}
          style={[styles.secondaryButton, !audioUri ? styles.disabled : null]}
          accessibilityRole="button"
          accessibilityLabel="Redo recording"
          accessibilityHint="Clears the recording so you can record again"
        >
          <Text style={styles.secondaryText} allowFontScaling>
            Redo
          </Text>
        </Pressable>
      </View>
      {audioUri ? (
        <Text style={styles.duration} allowFontScaling>
          Duration: {durationSec.toFixed(1)} seconds
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F4F7',
    padding: 16,
    borderRadius: 16,
  },
  status: {
    fontSize: 18,
    color: '#101828',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryButton: {
    minHeight: 52,
    minWidth: 120,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1A4DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    minHeight: 52,
    minWidth: 100,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A4DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryText: {
    fontSize: 18,
    color: '#1A4DFF',
    fontWeight: '700',
  },
  duration: {
    fontSize: 16,
    color: '#475467',
    marginTop: 12,
  },
});
