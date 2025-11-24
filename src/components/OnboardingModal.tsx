import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function OnboardingModal({
  visible,
  onClose,
}: OnboardingModalProps) {
  const theme = useTheme() as unknown as Theme;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles(theme).overlay}>
        <View style={styles(theme).modalContainer}>
          <ScrollView
            style={styles(theme).scrollView}
            contentContainerStyle={styles(theme).scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles(theme).iconContainer}>
              <Ionicons
                name="share-outline"
                size={60}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles(theme).title}>Welcome to Braise!</Text>
            <Text style={styles(theme).subtitle}>
              Import recipes from your browser
            </Text>
            <View style={styles(theme).instructionsContainer}>
              <Text style={styles(theme).sectionTitle}>First time setup:</Text>
              <Text style={styles(theme).instructionsText}>
                1. Open a recipe website in your browser
              </Text>
              <Text style={styles(theme).instructionsText}>
                2. Tap the Share button
              </Text>
              <Text style={styles(theme).instructionsText}>
                3. Scroll to the bottom of the share sheet and tap "Edit
                Actions"
              </Text>
              <Text style={styles(theme).instructionsText}>
                4. Find "Import to Braise" and toggle it on
              </Text>
              <Text style={styles(theme).instructionsText}>
                5. Tap "Done" to save
              </Text>
              <View style={styles(theme).divider} />
              <Text style={styles(theme).sectionTitle}>
                To import a recipe:
              </Text>
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
          </ScrollView>
          <TouchableOpacity
            style={[
              styles(theme).button,
              {backgroundColor: theme.colors.primary},
            ]}
            onPress={onClose}>
            <Text
              style={[styles(theme).buttonText, {color: theme.colors.card}]}>
              Got it
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      width: '100%',
      maxWidth: 500,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    scrollView: {
      maxHeight: '70%',
    },
    scrollContent: {
      padding: 24,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      ...theme.typography.h3,
      color: theme.colors.subtext,
      textAlign: 'center',
      marginBottom: 24,
    },
    instructionsContainer: {
      width: '100%',
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 12,
      fontWeight: 'bold',
    },
    instructionsText: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: 10,
      lineHeight: 22,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 20,
      width: '100%',
    },
    button: {
      padding: 16,
      borderRadius: 8,
      margin: 24,
      alignItems: 'center',
    },
    buttonText: {
      ...theme.typography.h2,
      fontWeight: '600',
    },
  });
