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
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.border,
      marginRight: 6,
      marginBottom: 6,
    },
    selectedChip: {
      backgroundColor: theme.colors.primary,
    },
    label: {
      color: theme.colors.text,
      fontSize: 13,
    },
    selectedLabel: {
      color: theme.colors.background,
    },
  });
