import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StepHeaderProps = {
  title: string;
  subtitle?: string;
};

export const StepHeader = ({ title, subtitle }: StepHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title} allowFontScaling>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} allowFontScaling>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#101828',
  },
  subtitle: {
    fontSize: 18,
    color: '#475467',
    marginTop: 6,
  },
});
