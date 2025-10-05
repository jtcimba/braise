import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  type?: 'pill' | 'tab';
  color?: 'primary' | 'secondary';
  textStyle?: 'body' | 'header';
}

export default function CustomToggle({
  value,
  onValueChange,
  leftLabel,
  rightLabel,
  type = 'pill',
  color = 'primary',
  textStyle = 'body',
}: CustomToggleProps) {
  const theme = useTheme() as unknown as Theme;

  const isPill = type === 'pill';
  const isTab = type === 'tab';

  return (
    <View
      style={[styles(theme).container, isTab && styles(theme).tabContainer]}>
      <TouchableOpacity
        style={[
          styles(theme).option,
          isPill &&
            !value &&
            (color === 'secondary'
              ? styles(theme).selectedSecondaryOption
              : styles(theme).selectedPillOption),
          isTab && !value && styles(theme).selectedTabOption,
        ]}
        onPress={() => onValueChange(false)}>
        <Text
          style={[
            styles(theme).optionText,
            textStyle === 'header'
              ? theme.typography.h3
              : (isPill && theme.typography.b1) ||
                (isTab && theme.typography.h3),
            isPill &&
              !value &&
              (color === 'secondary'
                ? styles(theme).selectedSecondaryText
                : styles(theme).selectedPillText),
            isTab && !value && styles(theme).selectedTabText,
            isTab && value && styles(theme).unselectedTabText,
          ]}>
          {leftLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles(theme).option,
          isPill &&
            value &&
            (color === 'secondary'
              ? styles(theme).selectedSecondaryOption
              : styles(theme).selectedPillOption),
          isTab && value && styles(theme).selectedTabOption,
        ]}
        onPress={() => onValueChange(true)}>
        <Text
          style={[
            styles(theme).optionText,
            textStyle === 'header'
              ? theme.typography.h3
              : (isPill && theme.typography.b1) ||
                (isTab && theme.typography.h3),
            isPill &&
              value &&
              (color === 'secondary'
                ? styles(theme).selectedSecondaryText
                : styles(theme).selectedPillText),
            isTab && value && styles(theme).selectedTabText,
            isTab && !value && styles(theme).unselectedTabText,
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
      borderRadius: 25,
      width: '100%',
      minWidth: 210,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabContainer: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      minWidth: 'auto',
    },
    option: {
      flex: 1,
      paddingBottom: 1,
      paddingHorizontal: 16,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedPillOption: {
      backgroundColor: theme.colors.primary,
      margin: 2,
    },
    selectedTabOption: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.text,
    },
    optionText: {
      color: theme.colors.text,
    },
    selectedPillText: {
      color: theme.colors.background,
    },
    selectedTabText: {
      color: theme.colors.text,
      ...theme.typography.h2,
    },
    unselectedTabText: {
      paddingBottom: 3,
      color: theme.colors.subtext,
      ...theme.typography.h2,
    },
    selectedSecondaryOption: {
      backgroundColor: theme.colors.opaque,
      margin: 2,
    },
    selectedSecondaryText: {
      color: theme.colors.background,
    },
  });
