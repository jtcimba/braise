import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  leftLabel: string;
  rightLabel: string;
}

export default function CustomToggle({
  value,
  onValueChange,
  leftLabel,
  rightLabel,
}: CustomToggleProps) {
  const theme = useTheme() as unknown as Theme;

  return (
    <View style={styles(theme).pillContainer}>
      <TouchableOpacity
        style={[
          styles(theme).pillOption,
          !value && styles(theme).pillOptionSelected,
        ]}
        onPress={() => onValueChange(false)}>
        <Text
          style={[
            styles(theme).pillText,
            !value
              ? styles(theme).pillTextSelected
              : styles(theme).pillTextUnselected,
          ]}>
          {leftLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles(theme).pillOption,
          value && styles(theme).pillOptionSelected,
        ]}
        onPress={() => onValueChange(true)}>
        <Text
          style={[
            styles(theme).pillText,
            value
              ? styles(theme).pillTextSelected
              : styles(theme).pillTextUnselected,
          ]}>
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    pillContainer: {
      flexDirection: 'row',
      borderRadius: 25,
      marginTop: 10,
    },
    pillOption: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
    },
    pillOptionSelected: {
      backgroundColor: theme.colors['green-400'],
    },
    pillText: {
      ...theme.typography['h2-emphasized'],
    },
    pillTextSelected: {
      color: theme.colors['neutral-100'],
      fontWeight: '600',
    },
    pillTextUnselected: {
      color: theme.colors['toffee-400'],
    },
  });
