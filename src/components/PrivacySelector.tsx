import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type PrivacyOption = 'private' | 'family' | 'specific';

type PrivacySelectorProps = {
  value: PrivacyOption;
  onChange: (value: PrivacyOption) => void;
};

const options: { value: PrivacyOption; title: string; description: string }[] = [
  {
    value: 'private',
    title: 'Private',
    description: 'Only you can see this story.',
  },
  {
    value: 'family',
    title: 'Family',
    description: 'Shared with your family circle.',
  },
  {
    value: 'specific',
    title: 'Specific people',
    description: 'Choose who can view this.',
  },
];

export const PrivacySelector = ({ value, onChange }: PrivacySelectorProps) => {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.title}
            accessibilityHint={option.description}
            accessibilityState={{ selected }}
            style={[styles.card, selected ? styles.cardSelected : null]}
          >
            <Text style={styles.title} allowFontScaling>
              {option.title}
            </Text>
            <Text style={styles.description} allowFontScaling>
              {option.description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    minHeight: 64,
  },
  cardSelected: {
    borderColor: '#1A4DFF',
    backgroundColor: '#EEF4FF',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  description: {
    fontSize: 16,
    color: '#475467',
    marginTop: 4,
  },
});
