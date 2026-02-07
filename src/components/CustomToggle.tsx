import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  textStyle?: 'body' | 'header';
}

export default function CustomToggle({
  value,
  onValueChange,
  leftLabel,
  rightLabel,
  textStyle = 'body',
}: CustomToggleProps) {
  const theme = useTheme() as unknown as Theme;

  const getTextStyle = (isSelected: boolean) => [
    styles(theme).baseText,
    textStyle === 'header' ? theme.typography.h2 : theme.typography.h4,
    isSelected
      ? styles(theme, textStyle).selectedText
      : styles(theme, textStyle).unselectedText,
  ];

  return (
    <View style={styles(theme).container}>
      <TouchableOpacity
        style={styles(theme).option}
        onPress={() => onValueChange(false)}>
        <Text style={getTextStyle(!value)}>{leftLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles(theme).option}
        onPress={() => onValueChange(true)}>
        <Text style={getTextStyle(value)}>{rightLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme: Theme, textStyle?: string) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
    },
    option: {
      flex: 1,
      paddingHorizontal: textStyle === 'body' ? 5 : 10,
      paddingVertical: textStyle === 'body' ? 0 : 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    baseText: {
      color: theme.colors['neutral-800'],
    },
    selectedText: {
      color: theme.colors['neutral-800'],
      fontWeight: '600',
    },
    unselectedText: {
      color: theme.colors['neutral-400'],
    },
  });
