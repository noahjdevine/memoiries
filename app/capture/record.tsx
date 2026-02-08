import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton } from '../../src/components/BigButton';
import { AudioRecorder } from '../../src/components/AudioRecorder';
import { StepHeader } from '../../src/components/StepHeader';
import { useCaptureStore } from '../../src/state/captureStore';

const prompts = [
  'How did you get it?',
  'Best memory with it?',
  'What should future family know?'
];

const RecordScreen = () => {
  const router = useRouter();
  const setAudio = useCaptureStore((state) => state.setAudio);
  const audio = useCaptureStore((state) => state.draft.audio);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepHeader
        title="Record the story"
        subtitle="Speak naturally. You can pause and redo anytime."
      />
      <View style={styles.promptCard}>
        <Text style={styles.promptTitle} allowFontScaling>
          Gentle prompts
        </Text>
        {prompts.map((prompt) => (
          <Text key={prompt} style={styles.promptText} allowFontScaling>
            • {prompt}
          </Text>
        ))}
      </View>
      <AudioRecorder onRecorded={setAudio} />
      <BigButton
        label="Next: Review transcript"
        onPress={() => router.push('/capture/transcript')}
        accessibilityLabel="Next step"
        accessibilityHint="Moves to transcript review"
        disabled={!audio}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
    backgroundColor: '#FFFFFF',
  },
  promptCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#101828',
  },
  promptText: {
    fontSize: 16,
    color: '#475467',
    marginBottom: 4,
  },
});

export default RecordScreen;
