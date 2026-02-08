import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type TranscriptEditorProps = {
  value: string;
  onChange: (text: string) => void;
  statusMessage?: string;
};

export const TranscriptEditor = ({ value, onChange, statusMessage }: TranscriptEditorProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label} allowFontScaling>
        Transcript (optional)
      </Text>
      {statusMessage ? (
        <Text style={styles.status} allowFontScaling>
          {statusMessage}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        style={styles.input}
        placeholder="Edit your story if you like"
        accessibilityLabel="Transcript editor"
        accessibilityHint="Edit the transcribed story text"
        allowFontScaling
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: '#475467',
    marginBottom: 12,
  },
  input: {
    minHeight: 160,
    fontSize: 18,
    color: '#101828',
    textAlignVertical: 'top',
  },
});
