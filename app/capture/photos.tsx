import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BigButton } from '../../src/components/BigButton';
import { StepHeader } from '../../src/components/StepHeader';
import { useCaptureStore } from '../../src/state/captureStore';

const PhotosScreen = () => {
  const router = useRouter();
  const photos = useCaptureStore((state) => state.draft.photos);
  const addPhoto = useCaptureStore((state) => state.addPhoto);
  const removePhoto = useCaptureStore((state) => state.removePhoto);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      addPhoto(result.assets[0].uri);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepHeader
        title="Add photos"
        subtitle="Take or choose clear photos of your item."
      />
      <Pressable
        onPress={handleAddPhoto}
        style={styles.addButton}
        accessibilityRole="button"
        accessibilityLabel="Add photo"
        accessibilityHint="Opens your photo library to select an image"
      >
        <Text style={styles.addButtonText} allowFontScaling>
          Add a photo
        </Text>
      </Pressable>
      <View style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <View key={`${photo.localUri}-${index}`} style={styles.photoCard}>
            <Image source={{ uri: photo.localUri }} style={styles.photo} />
            <Pressable
              onPress={() => removePhoto(index)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              accessibilityHint="Removes this photo from your draft"
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText} allowFontScaling>
                Remove
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      <BigButton
        label="Next: Record story"
        onPress={() => router.push('/capture/record')}
        accessibilityLabel="Next step"
        accessibilityHint="Moves to the record story step"
        disabled={photos.length === 0}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1A4DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    color: '#1A4DFF',
    fontWeight: '700',
  },
  photoGrid: {
    gap: 16,
  },
  photoCard: {
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
    padding: 12,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#98A2B3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#475467',
  },
});

export default PhotosScreen;
