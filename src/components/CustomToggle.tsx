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

  const getOptionStyle = (isSelected: boolean) => [
    styles(theme).option,
    isSelected && styles(theme, textStyle).selectedOption,
  ];

  const getTextStyle = (isSelected: boolean) => [
    styles(theme).baseText,
    textStyle === 'header' ? theme.typography.h3 : theme.typography.h5,
    isSelected
      ? styles(theme, textStyle).selectedText
      : styles(theme, textStyle).unselectedText,
  ];

  return (
    <View style={styles(theme).container}>
      <TouchableOpacity
        style={getOptionStyle(!value)}
        onPress={() => onValueChange(false)}>
        <Text style={getTextStyle(!value)}>{leftLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={getOptionStyle(value)}
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
      paddingHorizontal: textStyle === 'body' ? 12 : 16,
      paddingVertical: textStyle === 'body' ? 0 : 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedOption: {},
    baseText: {
      color: theme.colors.text,
    },
    selectedText: {
      color: theme.colors.text,
      ...theme.typography.h4,
    },
    unselectedText: {
      color: theme.colors.subtext,
    },
  });
