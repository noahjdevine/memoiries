import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton } from '../../src/components/BigButton';
import { StepHeader } from '../../src/components/StepHeader';
import { TranscriptEditor } from '../../src/components/TranscriptEditor';
import { subscribeItem } from '../../src/services/itemService';
import { useCaptureStore } from '../../src/state/captureStore';
import { logger } from '../../src/utils/logger';

const TranscriptScreen = () => {
  const router = useRouter();
  const transcript = useCaptureStore((state) => state.draft.transcript ?? '');
  const itemId = useCaptureStore((state) => state.draft.itemId);
  const setTranscript = useCaptureStore((state) => state.setTranscript);
  const audio = useCaptureStore((state) => state.draft.audio);
  const persistDraftToFirestore = useCaptureStore((state) => state.persistDraftToFirestore);
  const isSaving = useCaptureStore((state) => state.isSaving);
  const retryTranscription = useCaptureStore((state) => state.retryTranscription);
  const [hasTriggeredUpload, setHasTriggeredUpload] = useState(false);
  const [statusMessage, setStatusMessage] = useState('We will transcribe once you upload.');
  const [transcriptionStatus, setTranscriptionStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');

  useEffect(() => {
    if (!itemId) return;
    const unsubscribe = subscribeItem(itemId, (item) => {
      if (!item?.transcription) return;
      if (item.transcription.status === 'processing') {
        setStatusMessage('Transcription in progress…');
        setTranscriptionStatus('processing');
      } else if (item.transcription.status === 'complete') {
        setStatusMessage('Transcript ready. You can edit it below.');
        setTranscriptionStatus('complete');
        logger.info('Transcription completed', { itemId });
        if (item.transcription.text) {
          setTranscript(item.transcription.text);
        }
      } else if (item.transcription.status === 'error') {
        setStatusMessage(item.transcription.errorMessage ?? 'Transcription failed.');
        setTranscriptionStatus('error');
        logger.error('Transcription failed', {
          itemId,
          message: item.transcription.errorMessage ?? 'Unknown error',
        });
      }
    });
    return unsubscribe;
  }, [itemId, setTranscript]);

  useEffect(() => {
    const startUpload = async () => {
      if (!audio || itemId || isSaving || hasTriggeredUpload) {
        return;
      }
      setHasTriggeredUpload(true);
      setStatusMessage('Uploading your audio for transcription…');
      try {
        await persistDraftToFirestore();
      } catch (error) {
        setStatusMessage('Upload failed. Please try again.');
      }
    };

    startUpload();
  }, [audio, hasTriggeredUpload, isSaving, itemId, persistDraftToFirestore]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepHeader
        title="Review transcript"
        subtitle="Edit if you want. You can also leave it as-is."
      />
      <TranscriptEditor value={transcript} onChange={setTranscript} statusMessage={statusMessage} />
      {!itemId ? (
        <View style={styles.notice}>
          <ActivityIndicator size="large" color="#1A4DFF" />
          <Text style={styles.noticeText} allowFontScaling>
            Your transcript will appear after upload.
          </Text>
        </View>
      ) : null}
      {transcriptionStatus === 'error' ? (
        <View style={styles.retryCard}>
          <Text style={styles.retryText} allowFontScaling>
            We had trouble transcribing. You can try again without re-uploading.
          </Text>
          <BigButton
            label={isSaving ? 'Retrying…' : 'Retry transcription'}
            onPress={retryTranscription}
            accessibilityLabel="Retry transcription"
            accessibilityHint="Sends a new transcription request"
            disabled={isSaving}
          />
        </View>
      ) : null}
      <BigButton
        label="Next: Privacy"
        onPress={() => router.push('/capture/privacy')}
        accessibilityLabel="Next step"
        accessibilityHint="Moves to privacy selection"
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
  notice: {
    alignItems: 'center',
    gap: 12,
  },
  noticeText: {
    fontSize: 16,
    color: '#475467',
  },
  retryCard: {
    backgroundColor: '#FEF3F2',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  retryText: {
    fontSize: 16,
    color: '#7A271A',
  },
});

export default TranscriptScreen;
