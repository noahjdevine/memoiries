import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton } from '../../src/components/BigButton';
import { PrivacySelector } from '../../src/components/PrivacySelector';
import { StepHeader } from '../../src/components/StepHeader';
import { useCaptureStore } from '../../src/state/captureStore';

const outcomeOptions = [
  { value: 'keep', label: 'Keep' },
  { value: 'gift', label: 'Gift' },
  { value: 'donate', label: 'Donate' },
  { value: 'sell', label: 'Sell' },
  { value: 'discard', label: 'Discard' },
] as const;

const PrivacyScreen = () => {
  const router = useRouter();
  const visibility = useCaptureStore((state) => state.draft.visibility);
  const outcome = useCaptureStore((state) => state.draft.outcome);
  const setVisibility = useCaptureStore((state) => state.setVisibility);
  const setOutcome = useCaptureStore((state) => state.setOutcome);
  const persistDraftToFirestore = useCaptureStore((state) => state.persistDraftToFirestore);
  const isSaving = useCaptureStore((state) => state.isSaving);
  const errorMessage = useCaptureStore((state) => state.errorMessage);
  const clearDraftLocal = useCaptureStore((state) => state.clearDraftLocal);
  const resetDraft = useCaptureStore((state) => state.resetDraft);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSave = async () => {
    try {
      setHasSubmitted(true);
      const itemId = await persistDraftToFirestore();
      await clearDraftLocal();
      resetDraft();
      router.replace(`/items/${itemId}`);
    } catch (error) {
      Alert.alert('Unable to save', 'Please try again.');
    }
  };

  const handleSaveForLater = () => {
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepHeader
        title="Privacy settings"
        subtitle="Choose who can see this story."
      />
      <PrivacySelector value={visibility} onChange={setVisibility} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle} allowFontScaling>
          What will happen to this item?
        </Text>
        <View style={styles.outcomeGrid}>
          {outcomeOptions.map((option) => {
            const selected = outcome === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setOutcome(option.value)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityHint="Selects this outcome"
                style={[styles.outcomeCard, selected ? styles.outcomeSelected : null]}
              >
                <Text style={styles.outcomeText} allowFontScaling>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {errorMessage && hasSubmitted ? (
        <View style={styles.errorCard}>
          <Text style={styles.error} allowFontScaling>
            {errorMessage}
          </Text>
          <View style={styles.errorActions}>
            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Retries saving your item"
              style={styles.retryButton}
            >
              <Text style={styles.retryText} allowFontScaling>
                Try again
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSaveForLater}
              accessibilityRole="button"
              accessibilityLabel="Save for later"
              accessibilityHint="Keeps your draft on this device and returns home"
              style={styles.laterButton}
            >
              <Text style={styles.laterText} allowFontScaling>
                Save for later
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <BigButton
        label={isSaving ? 'Saving…' : 'Save item'}
        onPress={handleSave}
        accessibilityLabel="Save item"
        accessibilityHint="Uploads your story and saves it"
        disabled={isSaving}
      />
      {isSaving ? <ActivityIndicator size="large" color="#1A4DFF" /> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
    backgroundColor: '#FFFFFF',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outcomeCard: {
    minHeight: 52,
    minWidth: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D5DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outcomeSelected: {
    borderColor: '#1A4DFF',
    backgroundColor: '#EEF4FF',
  },
  outcomeText: {
    fontSize: 16,
    color: '#101828',
    fontWeight: '600',
  },
  error: {
    fontSize: 16,
    color: '#D92D20',
  },
  errorCard: {
    backgroundColor: '#FEF3F2',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  retryButton: {
    minHeight: 48,
    minWidth: 120,
    borderRadius: 12,
    backgroundColor: '#1A4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  laterButton: {
    minHeight: 48,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  laterText: {
    fontSize: 16,
    color: '#1A4DFF',
    fontWeight: '700',
  },
});

export default PrivacyScreen;
