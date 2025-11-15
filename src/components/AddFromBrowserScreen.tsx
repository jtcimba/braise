import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

export default function AddFromBrowserScreen() {
  const theme = useTheme() as unknown as Theme;

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).content}>
        <View style={styles(theme).iconContainer}>
          <Ionicons
            name="share-outline"
            size={80}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles(theme).title}>Import from Browser</Text>
        <View style={styles(theme).instructionsContainer}>
          <Text style={styles(theme).sectionTitle}>First time setup:</Text>
          <Text style={styles(theme).instructionsText}>
            1. Open a recipe website in your browser
          </Text>
          <Text style={styles(theme).instructionsText}>
            2. Tap the Share button
          </Text>
          <Text style={styles(theme).instructionsText}>
            3. Scroll to the bottom of the share sheet and tap "Edit Actions"
          </Text>
          <Text style={styles(theme).instructionsText}>
            4. Find "Import to Braise" and toggle it on
          </Text>
          <Text style={styles(theme).instructionsText}>
            5. Tap "Done" to save
          </Text>
          <View style={styles(theme).divider} />
          <Text style={styles(theme).sectionTitle}>To import a recipe:</Text>
          <Text style={styles(theme).instructionsText}>
            1. Open a recipe website in your browser
          </Text>
          <Text style={styles(theme).instructionsText}>
            2. Tap the Share button
          </Text>
          <Text style={styles(theme).instructionsText}>
            3. Select "Import to Braise" from the share sheet
          </Text>
          <Text style={styles(theme).instructionsText}>
            4. The recipe will be imported automatically
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
    },
    content: {
      flex: 1,
      padding: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      marginBottom: 40,
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.text,
      marginBottom: 40,
      textAlign: 'center',
    },
    instructionsContainer: {
      width: '100%',
      paddingHorizontal: 20,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 15,
      fontWeight: 'bold',
    },
    instructionsText: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: 12,
      lineHeight: 24,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 20,
      width: '100%',
    },
  });
