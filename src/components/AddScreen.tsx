import React, {useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {useNavigation, ParamListBase} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Recipe} from '../models';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useOnboarding} from '../context/OnboardingContext';
import {useOnboardingTarget} from '../hooks/useOnboardingTarget';
import OnboardingTooltip from './OnboardingTooltip';
import {useAppDispatch} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';

export default function AddScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const theme = useTheme() as unknown as Theme;

  // Onboarding
  const {isOnboardingActive, currentStep, steps, nextStep, skipOnboarding} =
    useOnboarding();
  const {
    targetRef: fromUrlButtonTargetRef,
    measureTarget: measureFromUrlButtonTarget,
  } = useOnboardingTarget('from_url_button');

  // Measure from URL button target when onboarding step 2 is active
  useEffect(() => {
    if (isOnboardingActive && currentStep === 1) {
      setTimeout(() => {
        measureFromUrlButtonTarget();
      }, 500);
    }
  }, [isOnboardingActive, currentStep, measureFromUrlButtonTarget]);

  const newRecipe: Recipe = {
    id: '',
    title: '',
    author: '',
    host: '',
    image: '',
    total_time: '',
    total_time_unit: '',
    yields: '',
    ingredients: '',
    instructions: '',
    category: '',
  };

  return (
    <View style={styles(theme).content}>
      <TouchableOpacity
        onPress={() => {
          dispatch(changeViewMode('edit'));
          navigation.navigate('RecipeDetailsScreen', {
            item: newRecipe,
          });
        }}
        style={styles(theme).secondaryButton}>
        <View style={styles(theme).buttonContent}>
          <Text style={[styles(theme).text, styles(theme).secondaryText]}>
            From scratch
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        ref={fromUrlButtonTargetRef}
        onPress={() => navigation.navigate('AddFromBrowser')}
        style={styles(theme).button}>
        <View style={styles(theme).buttonContent}>
          <Text style={styles(theme).text}>From browser</Text>
        </View>
      </TouchableOpacity>

      {/* Onboarding Tooltip */}
      {isOnboardingActive && currentStep === 1 && steps[1]?.targetPosition && (
        <OnboardingTooltip
          visible={true}
          title={steps[1].title}
          description={steps[1].description}
          targetPosition={steps[1].targetPosition}
          onNext={nextStep}
          onSkip={skipOnboarding}
          isLastStep={currentStep === steps.length - 1}
        />
      )}
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    content: {
      padding: 22,
      alignItems: 'center',
      height: '100%',
      backgroundColor: theme.colors.card,
      flex: 1,
      justifyContent: 'flex-end',
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 5,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 10,
      marginVertical: 10,
      borderRadius: 8,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    text: {
      color: theme.colors.card,
      ...theme.typography.h2,
    },
    subtext: {
      color: theme.colors.subtext,
      fontSize: 14,
      marginTop: 2,
      ...theme.typography.b2,
    },
    secondaryButton: {
      borderWidth: 2,
      borderColor: theme.colors.secondary,
      padding: 10,
      marginVertical: 10,
      borderRadius: 8,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryText: {
      color: theme.colors.secondary,
    },
  });
