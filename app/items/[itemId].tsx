import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { Item, subscribeItem, updateItem } from '../../src/services/itemService';
import { PrivacySelector } from '../../src/components/PrivacySelector';
import { TranscriptEditor } from '../../src/components/TranscriptEditor';
import { auth } from '../../src/services/firebase';
import { BigButton } from '../../src/components/BigButton';

const ItemDetailScreen = () => {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'family' | 'specific'>('private');
  const [outcome, setOutcome] = useState<Item['outcome']>();
  const [isSaving, setIsSaving] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    return subscribeItem(itemId, setItem);
  }, [itemId]);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? '');
    setTranscript(item.transcription?.text ?? '');
    setVisibility(item.visibility ?? 'private');
    setOutcome(item.outcome);
  }, [item]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const isReadOnly = useMemo(() => {
    const userId = auth.currentUser?.uid;
    return !userId || userId !== item?.ownerId;
  }, [item?.ownerId]);

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      await updateItem(item.id, {
        title: title.trim() ? title.trim() : null,
        transcription: {
          ...item.transcription,
          text: transcript,
        },
        visibility,
        outcome,
      });
    } catch (error) {
      Alert.alert('Unable to save', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlayback = async () => {
    if (!item?.audio?.url) return;
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.audio.url });
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
      });
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  if (!item) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A4DFF" />
        <Text style={styles.loadingText} allowFontScaling>
          Loading item…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title} allowFontScaling>
        Item detail
      </Text>
      {isReadOnly ? (
        <View style={styles.readOnlyCard}>
          <Text style={styles.readOnlyText} allowFontScaling>
            This story is read-only for family members.
          </Text>
        </View>
      ) : null}
      <View style={styles.field}>
        <Text style={styles.fieldLabel} allowFontScaling>
          Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add a title"
          editable={!isReadOnly}
          style={[styles.input, isReadOnly ? styles.inputDisabled : null]}
          accessibilityLabel="Edit title"
          accessibilityHint="Updates the item title"
          allowFontScaling
        />
      </View>
      {item.photos?.map((photo, index) => (
        <Image
          key={`${photo.path}-${index}`}
          source={{ uri: photo.url }}
          style={styles.photo}
          accessibilityLabel="Item photo"
          accessibilityHint="Photo of the item"
        />
      ))}
      <View style={styles.card}>
        <Text style={styles.sectionTitle} allowFontScaling>
          Audio playback
        </Text>
        <Pressable
          onPress={togglePlayback}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
          accessibilityHint="Plays or pauses the recorded story audio"
          style={styles.audioButton}
          disabled={!item.audio?.url}
        >
          <Text style={styles.audioButtonText} allowFontScaling>
            {item.audio?.url ? (isPlaying ? 'Pause' : 'Play') : 'No audio'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle} allowFontScaling>
          Transcript
        </Text>
        <TranscriptEditor
          value={transcript}
          onChange={setTranscript}
          statusMessage={item.transcription?.text ? undefined : 'Transcript is on the way.'}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle} allowFontScaling>
          Who can see this?
        </Text>
        <View pointerEvents={isReadOnly ? 'none' : 'auto'}>
          <PrivacySelector value={visibility ?? 'private'} onChange={setVisibility} />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle} allowFontScaling>
          Outcome
        </Text>
        <View style={styles.outcomeGrid}>
          {['keep', 'gift', 'donate', 'sell', 'discard'].map((option) => {
            const selected = outcome === option;
            return (
              <Pressable
                key={option}
                onPress={() => setOutcome(option as Item['outcome'])}
                accessibilityRole="button"
                accessibilityLabel={`Set outcome to ${option}`}
                accessibilityHint="Updates the item outcome"
                style={[styles.outcomeCard, selected ? styles.outcomeSelected : null]}
                disabled={isReadOnly}
              >
                <Text style={styles.outcomeText} allowFontScaling>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {!isReadOnly ? (
        <BigButton
          label={isSaving ? 'Saving…' : 'Save changes'}
          onPress={handleSave}
          accessibilityLabel="Save changes"
          accessibilityHint="Saves your edits to this item"
          disabled={isSaving}
        />
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
    backgroundColor: '#FFFFFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#475467',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#101828',
  },
  readOnlyCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#475467',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingHorizontal: 12,
    fontSize: 18,
    color: '#101828',
  },
  inputDisabled: {
    backgroundColor: '#F2F4F7',
    color: '#667085',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 8,
  },
  audioButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#1A4DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outcomeCard: {
    minHeight: 48,
    minWidth: 110,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D5DD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  outcomeSelected: {
    borderColor: '#1A4DFF',
    backgroundColor: '#EEF4FF',
  },
  outcomeText: {
    fontSize: 16,
    color: '#101828',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default ItemDetailScreen;
