import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RecipeService} from '../api';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useOnboarding} from '../context/OnboardingContext';
import {useOnboardingTarget} from '../hooks/useOnboardingTarget';
import OnboardingTooltip from './OnboardingTooltip';
import Storage from '../storage';

type RootStackParamList = {
  AddFromUrl: undefined;
  RecipeDetailsScreen: {item: any};
};

const FOOD_ICONS = [
  'pizza',
  'restaurant',
  'fast-food',
  'cafe',
  'beer',
  'ice-cream',
  'fish',
  'nutrition',
];

export default function AddFromUrlScreen() {
  const theme = useTheme() as unknown as Theme;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Onboarding
  const {isOnboardingActive, currentStep, steps, nextStep, skipOnboarding} =
    useOnboarding();
  const {targetRef: urlInputTargetRef, measureTarget: measureUrlInputTarget} =
    useOnboardingTarget('url_input');
  const {
    targetRef: addRecipeButtonTargetRef,
    measureTarget: measureAddRecipeButtonTarget,
  } = useOnboardingTarget('add_recipe_button');

  useEffect(() => {
    if (url.length === 0) {
      setIsValidUrl(false);
      scaleAnim.setValue(0);
      return;
    }
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(false);
      scaleAnim.setValue(0);
    }
  }, [url, scaleAnim]);

  useEffect(() => {
    if (isValidUrl) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [isValidUrl, scaleAnim]);

  // Animate loading stages
  useEffect(() => {
    if (isLoading) {
      fadeAnim.setValue(0);
      progressBarAnim.setValue(0);
      iconOpacity.setValue(0);
      setCurrentIconIndex(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(progressBarAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      if (iconAnimRef.current) {
        iconAnimRef.current.stop();
      }
    }
  }, [isLoading, fadeAnim, progressBarAnim, iconOpacity]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    if (iconAnimRef.current) {
      iconAnimRef.current.stop();
    }

    iconOpacity.setValue(0);
    iconAnimRef.current = Animated.sequence([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(iconOpacity, {
        toValue: 0,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    iconAnimRef.current.start(({finished}) => {
      if (finished) {
        setCurrentIconIndex(prev => (prev + 1) % FOOD_ICONS.length);
      }
    });

    return () => {
      if (iconAnimRef.current) {
        iconAnimRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, currentIconIndex]);

  // Measure onboarding targets when appropriate steps are active
  useEffect(() => {
    if (isOnboardingActive) {
      if (currentStep === 2) {
        // URL input step
        setTimeout(() => {
          measureUrlInputTarget();
        }, 500);
      } else if (currentStep === 3) {
        // Add recipe button step
        setTimeout(() => {
          measureAddRecipeButtonTarget();
        }, 500);
      }
    }
  }, [
    isOnboardingActive,
    currentStep,
    measureUrlInputTarget,
    measureAddRecipeButtonTarget,
  ]);

  const onAddRecipe = () => {
    Keyboard.dismiss();
    setIsLoading(true);
    RecipeService.getRecipeFromUrl(url)
      .then(recipe => {
        handleSaveNewRecipe(recipe);
      })
      .catch(e => {
        console.log(e);
        Alert.alert('Error', 'Failed to add recipe. Please try again.');
        setIsLoading(false);
        setUrl('');
        setIsValidUrl(false);
      });
  };

  const handleSaveNewRecipe = async (recipe: any) => {
    let newRecipe: any;
    try {
      const response = await RecipeService.addNewRecipe({
        ...recipe.data,
        ingredients: recipe.data.ingredients?.replace(/\\n$/, ''),
      });
      newRecipe = await RecipeService.getRecipe(response.id);
      console.log('newRecipe', newRecipe);

      const localRecipes = await Storage.loadRecipesFromLocal();
      localRecipes.push(newRecipe[0]);
      console.log('localRecipes', localRecipes);
      await Storage.saveRecipesToLocal(localRecipes);
    } catch (e: any) {
      console.log('save error', e.message);
      Alert.alert('Error', 'Failed to save recipe');
    } finally {
      console.log('recipe', recipe.data);
      navigation.navigate('RecipeDetailsScreen', {
        item: {
          ...newRecipe[0],
        },
      });
      setUrl('');
      setIsValidUrl(false);
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles(theme).container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}>
        {isLoading && (
          <Animated.View
            style={[
              styles(theme).loadingOverlay,
              {
                opacity: fadeAnim,
              },
            ]}>
            <Animated.View
              style={[
                styles(theme).foodIconContainer,
                {
                  opacity: iconOpacity,
                },
              ]}>
              <Ionicons
                name={FOOD_ICONS[currentIconIndex]}
                size={80}
                color={theme.colors.primary}
              />
            </Animated.View>
            <View style={styles(theme).progressBarContainer}>
              <Animated.View
                style={[
                  styles(theme).progressBarFill,
                  {
                    width: progressBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </Animated.View>
        )}
        <View style={styles(theme).content}>
          {!isValidUrl && url.length > 0 && (
            <View style={styles(theme).messageContainer}>
              <Text style={styles(theme).messageText}>
                No recipe found, try a different URL
              </Text>
            </View>
          )}
          {isValidUrl && !isLoading && (
            <View style={styles(theme).checkmarkContainer}>
              <Animated.Text
                style={[
                  styles(theme).checkmark,
                  {
                    transform: [{scale: scaleAnim}],
                  },
                ]}>
                ✓
              </Animated.Text>
              <Text style={styles(theme).checkmarkText}>Valid Url</Text>
            </View>
          )}
          <TextInput
            ref={urlInputTargetRef}
            style={styles(theme).input}
            placeholder="https://www..."
            placeholderTextColor={theme.colors.subtext}
            editable={!isLoading}
            value={url}
            onChangeText={text => {
              setUrl(text);
            }}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={() => onAddRecipe()}
          />
          <TouchableOpacity
            ref={addRecipeButtonTargetRef}
            onPress={() => onAddRecipe()}
            style={styles(theme).button}
            disabled={!isValidUrl || isLoading}>
            <Text
              style={[
                styles(theme).text,
                !isValidUrl && styles(theme).disabledText,
                isLoading && styles(theme).disabledText,
              ]}>
              Add recipe
            </Text>
          </TouchableOpacity>
        </View>

        {/* Onboarding Tooltips */}
        {isOnboardingActive &&
          currentStep === 2 &&
          steps[2]?.targetPosition && (
            <OnboardingTooltip
              visible={true}
              title={steps[2].title}
              description={steps[2].description}
              targetPosition={steps[2].targetPosition}
              onNext={nextStep}
              onSkip={skipOnboarding}
              isLastStep={currentStep === steps.length - 1}
            />
          )}

        {isOnboardingActive &&
          isValidUrl &&
          currentStep === 3 &&
          steps[3]?.targetPosition && (
            <OnboardingTooltip
              visible={true}
              title={steps[3].title}
              description={steps[3].description}
              targetPosition={steps[3].targetPosition}
              onNext={nextStep}
              onSkip={skipOnboarding}
              isLastStep={currentStep === steps.length - 1}
            />
          )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
      overflow: 'hidden',
    },
    content: {
      backgroundColor: theme.colors.card,
      padding: 22,
      alignItems: 'center',
      height: '100%',
      flex: 1,
      justifyContent: 'flex-end',
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 10,
      marginVertical: 10,
      borderRadius: 30,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: theme.colors.card,
      ...theme.typography.h2,
      textAlign: 'center',
    },
    disabledText: {
      opacity: 0.5,
    },
    input: {
      ...theme.typography.h5,
      padding: 10,
      marginVertical: 5,
      borderRadius: 7,
      width: '100%',
      color: theme.colors.text,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    foodIconContainer: {
      marginBottom: 40,
    },
    progressBarContainer: {
      width: '80%',
      height: 4,
      backgroundColor: 'rgba(234, 103, 45, 0.2)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    checkmarkContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    checkmark: {
      fontSize: 120,
      color: theme.colors.primary,
    },
    messageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    messageText: {
      color: theme.colors.card,
      fontSize: 16,
      textAlign: 'center',
      ...theme.typography.h5,
    },
    checkmarkText: {
      color: theme.colors.primary,
      fontSize: 16,
      textAlign: 'center',
      ...theme.typography.h4,
    },
  });
