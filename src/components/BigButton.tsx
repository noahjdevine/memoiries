import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type BigButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  style?: ViewStyle;
  disabled?: boolean;
};

export const BigButton = ({
  label,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  disabled,
}: BigButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
    >
      <Text style={styles.label} allowFontScaling>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#1A4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    backgroundColor: '#9AA9FF',
  },
  label: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
