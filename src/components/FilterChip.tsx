import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function FilterChip({
  label,
  selected,
  onPress,
}: FilterChipProps) {
  const theme = useTheme() as unknown as Theme;

  return (
    <TouchableOpacity
      style={[styles(theme).chip, selected && styles(theme).selectedChip]}
      onPress={onPress}>
      <Text
        style={[styles(theme).label, selected && styles(theme).selectedLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: 15,
      paddingVertical: 4,
      borderRadius: 15,
      marginRight: 6,
      borderColor: theme.colors['neutral-300'],
      borderWidth: 1,
    },
    selectedChip: {
      backgroundColor: theme.colors['neutral-800'],
      borderColor: theme.colors['neutral-800'],
    },
    label: {
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
    },
    selectedLabel: {
      color: theme.colors['neutral-100'],
    },
  });
