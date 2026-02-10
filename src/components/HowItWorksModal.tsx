import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

const howItWorksImages = [
  require('../assets/images/how-it-works-1.png'),
  require('../assets/images/how-it-works-2.png'),
  require('../assets/images/how-it-works-3.png'),
  require('../assets/images/how-it-works-4.png'),
];

const SWIPE_THRESHOLD = 40;

interface HowItWorksModalProps {
  visible: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Open a recipe in your browser',
    description: 'Visit any recipe website in Safari or your browser.',
    icon: 'globe-outline' as const,
    screenshotPlaceholder: true,
  },
  {
    title: 'Tap the Share button',
    description: 'Use the Share icon in your browser’s toolbar.',
    icon: 'share-outline' as const,
    screenshotPlaceholder: true,
  },
  {
    title: 'Tap "Braise" app icon',
    description: 'Select Braise from the share sheet.',
    icon: 'arrow-redo-outline' as const,
    screenshotPlaceholder: true,
  },
  {
    title: 'Recipe appears in your library',
    description: 'The recipe is saved and ready to cook.',
    icon: 'book-outline' as const,
    screenshotPlaceholder: true,
  },
];

export default function HowItWorksModal({
  visible,
  onClose,
}: HowItWorksModalProps) {
  const theme = useTheme() as unknown as Theme;
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const {dx} = gestureState;
          return Math.abs(dx) > 10;
        },
        onPanResponderRelease: (_, gestureState) => {
          const {dx} = gestureState;
          if (dx < -SWIPE_THRESHOLD) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
          } else if (dx > SWIPE_THRESHOLD) {
            setCurrentStep(prev => Math.max(prev - 1, 0));
          }
        },
      }),
    [],
  );

  const step = STEPS[currentStep];

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={styles(theme).modalOverlay}>
      <View style={styles(theme).modalContainer}>
        <TouchableOpacity style={styles(theme).closeButton} onPress={onClose}>
          <Ionicons
            name="close-outline"
            size={24}
            color={theme.colors['neutral-400']}
          />
        </TouchableOpacity>
        <Text style={styles(theme).modalTitle}>How to add recipes</Text>
        <Text style={styles(theme).subtitle}>Swipe through to learn how!</Text>
        <View style={styles(theme).stepArea} {...panResponder.panHandlers}>
          <View style={styles(theme).imageContainer}>
            <Image
              source={howItWorksImages[currentStep]}
              style={styles(theme).screenshotImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles(theme).stepInfo}>
            <View style={styles(theme).stepNumber}>
              <Text style={styles(theme).stepNumberText}>
                {currentStep + 1}
              </Text>
            </View>
            <View style={styles(theme).stepText}>
              <Text style={styles(theme).stepTitle}>{step.title}</Text>
              <Text style={styles(theme).stepDescription}>
                {step.description}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles(theme).stepDots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles(theme).dot,
                index === currentStep && styles(theme).dotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[
            styles(theme).gotItButton,
            {backgroundColor: theme.colors['neutral-800']},
          ]}
          onPress={onClose}>
          <Text
            style={[
              styles(theme).gotItButtonText,
              {color: theme.colors['neutral-100']},
            ]}>
            Got it
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalContainer: {
      height: '92%',
      backgroundColor: theme.colors['neutral-100'],
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    closeButton: {
      position: 'absolute',
      right: 12,
      top: 10,
      padding: 6,
      zIndex: 1,
    },
    modalTitle: {
      ...theme.typography.h1,
      color: theme.colors['neutral-800'],
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
      textAlign: 'center',
      marginBottom: 24,
    },
    stepArea: {
      flex: 1,
    },
    stepInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 24,
    },
    stepText: {
      flex: 1,
    },
    imageContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    stepDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors['neutral-300'],
    },
    dotActive: {
      backgroundColor: theme.colors['rust-600'],
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    screenshotImage: {
      width: '80%',
      height: '80%',
      borderRadius: 12,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors['rust-600'],
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepNumberText: {
      ...theme.typography['h4-emphasized'],
      color: theme.colors['neutral-100'],
    },
    stepTitle: {
      ...theme.typography['h3-emphasized'],
      color: theme.colors['neutral-800'],
    },
    stepDescription: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
    },
    gotItButton: {
      padding: 16,
      borderRadius: 25,
      alignItems: 'center',
      marginTop: 8,
    },
    gotItButtonText: {
      ...theme.typography.h2,
      fontWeight: '600',
    },
  });
