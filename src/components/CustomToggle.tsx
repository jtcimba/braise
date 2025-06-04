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
    <View style={styles(theme).container}>
      <TouchableOpacity
        style={[styles(theme).option, !value && styles(theme).selectedOption]}
        onPress={() => onValueChange(false)}>
        <Text
          style={[
            styles(theme).optionText,
            !value && styles(theme).selectedText,
          ]}>
          {leftLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles(theme).option, value && styles(theme).selectedOption]}
        onPress={() => onValueChange(true)}>
        <Text
          style={[
            styles(theme).optionText,
            value && styles(theme).selectedText,
          ]}>
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.colors.backgroundText,
      borderRadius: 25,
      width: '100%',
      minWidth: 210,
    },
    option: {
      flex: 1,
      paddingVertical: 4,
      paddingHorizontal: 16,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedOption: {
      backgroundColor: theme.colors.primary,
    },
    optionText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    selectedText: {
      color: theme.colors.background,
      // fontWeight: '600',
    },
  });
