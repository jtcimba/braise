import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface OnboardingTooltipProps {
  visible: boolean;
  title: string;
  description: string;
  targetPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onNext: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}

const {width: screenWidth} = Dimensions.get('window');

export default function OnboardingTooltip({
  visible,
  title,
  description,
  targetPosition,
  onNext,
  onSkip,
  isLastStep = false,
}: OnboardingTooltipProps) {
  const theme = useTheme() as unknown as Theme;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  // Calculate tooltip position
  const tooltipWidth = screenWidth - 40;
  const tooltipHeight = 200;
  // Position tooltip above or below target based on available space
  const spaceAbove = targetPosition.y;

  const tooltipY =
    spaceAbove > tooltipHeight + 21
      ? targetPosition.y - tooltipHeight - 21
      : targetPosition.y + targetPosition.height + 21;

  const tooltipX = Math.max(
    20,
    Math.min(
      targetPosition.x + targetPosition.width / 2 - tooltipWidth / 2,
      screenWidth - tooltipWidth - 20,
      screenWidth - tooltipWidth - 20,
    ),
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onSkip}>
        <View style={styles.overlay}>
          {/* Highlight target area */}
          <View
            style={[
              styles.highlight,
              {
                left: targetPosition.x - 10,
                top: targetPosition.y - 10,
                width: targetPosition.width + 20,
                height: targetPosition.height + 20,
              },
            ]}
          />

          {/* Tooltip */}
          <Animated.View
            style={[
              styles.tooltip,
              {
                left: tooltipX,
                top: tooltipY,
                width: tooltipWidth,
                backgroundColor: theme.colors.card,
                opacity: fadeAnim,
                transform: [{scale: scaleAnim}],
              },
            ]}>
            <View style={styles.tooltipContent}>
              <Text style={[styles.title, {color: theme.colors.text}]}>
                {title}
              </Text>
              <Text style={[styles.description, {color: theme.colors.subtext}]}>
                {description}
              </Text>

              <View style={styles.buttonContainer}>
                {!isLastStep && (
                  <TouchableOpacity
                    style={[
                      styles.skipButton,
                      {borderColor: theme.colors.subtext},
                    ]}
                    onPress={onSkip}>
                    <Text
                      style={[styles.skipText, {color: theme.colors.subtext}]}>
                      Skip
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    {backgroundColor: theme.colors.primary},
                  ]}
                  onPress={onNext}>
                  <Text style={[styles.nextText, {color: theme.colors.card}]}>
                    {isLastStep ? 'Get Started' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Arrow pointing to target
            <View
              style={[
                styles.arrow,
                {
                  backgroundColor: theme.colors.card,
                  left: Math.max(
                    20,
                    Math.min(
                      targetPosition.x +
                        targetPosition.width / 2 -
                        tooltipX -
                        10,
                      tooltipWidth - 40,
                    ),
                  ),
                  top:
                    spaceAbove > tooltipHeight + 21 ? tooltipHeight - 21 : -5,
                  transform: [
                    {
                      rotate:
                        spaceAbove > tooltipHeight + 21 ? '45deg' : '225deg',
                    },
                  ],
                },
              ]}
            /> */}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipContent: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '600',
  },
  arrow: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
});
