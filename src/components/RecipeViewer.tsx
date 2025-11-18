import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {LogBox} from 'react-native';
import CustomToggle from './CustomToggle';
import {WebView} from 'react-native-webview';
import ServingsPickerModal from './ServingsPickerModal';
import {parseIngredient, scaleIngredients} from '../services';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useOnboarding} from '../context/OnboardingContext';
import {useOnboardingTarget} from '../hooks/useOnboardingTarget';
import OnboardingTooltip from './OnboardingTooltip';

// Ignore WebView errors
LogBox.ignoreLogs(["Can't open url: about:srcdoc"]);

export default function RecipeViewer({data, onScaledIngredientsChange}: any) {
  const theme = useTheme() as unknown as Theme;
  const [isWebView, setIsWebView] = useState(false);
  const [tab, setTab] = useState('ingredients');
  const [showServingsModal, setShowServingsModal] = useState(false);
  const [currentServings, setCurrentServings] = useState(data.servings || '-');
  const [scaledIngredients, setScaledIngredients] = useState(
    data.ingredients || '',
  );

  const {isOnboardingActive, currentStep, steps, completeOnboarding} =
    useOnboarding();
  const {targetRef: completeTargetRef, measureTarget: measureCompleteTarget} =
    useOnboardingTarget('complete');

  const handleServingsConfirm = (newServings: string) => {
    const newScaledIngredients = scaleIngredients(
      data.ingredients || '',
      newServings,
      data.servings.toString(),
    );

    setCurrentServings(newServings);
    setScaledIngredients(newScaledIngredients);

    if (onScaledIngredientsChange) {
      onScaledIngredientsChange(newScaledIngredients);
    }
  };

  useEffect(() => {
    if (onScaledIngredientsChange) {
      onScaledIngredientsChange(scaledIngredients);
    }
  }, [scaledIngredients, onScaledIngredientsChange]);

  useEffect(() => {
    if (data.ingredients) {
      const originalServings =
        data.servings && data.servings !== '-' ? data.servings.toString() : '1';
      const servings =
        currentServings &&
        currentServings !== '-' &&
        currentServings !== originalServings
          ? currentServings
          : originalServings;

      if (servings !== originalServings) {
        const newScaledIngredients = scaleIngredients(
          data.ingredients,
          servings,
          data.servings,
        );
        setScaledIngredients(newScaledIngredients);
      } else {
        setScaledIngredients(data.ingredients);
      }
    }
  }, [data.ingredients, data.servings, currentServings]);

  useEffect(() => {
    if (data.servings) {
      setCurrentServings(data.servings);
    }
  }, [data.servings]);

  useEffect(() => {
    if (isOnboardingActive && currentStep === 4) {
      console.log('measuring complete target');
      setTimeout(() => {
        measureCompleteTarget();
      }, 1000);
    }
  }, [isOnboardingActive, currentStep, measureCompleteTarget]);

  const currentStepData = steps[currentStep];
  const showCompleteTooltip = isOnboardingActive && currentStep === 4;

  return (
    <View style={styles(theme).container}>
      {isWebView ? (
        <WebView
          source={{uri: data.original_url}}
          style={styles(theme).webview}
        />
      ) : (
        <ScrollView
          style={styles(theme).contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles(theme).scrollContentContainer}>
          <View ref={completeTargetRef}>
            <View style={styles(theme).headerContainer}>
              <Text style={styles(theme).title}>{data.title}</Text>
              {data.author && (
                <Text style={styles(theme).author}>{data.author}</Text>
              )}
            </View>
          </View>
          <View style={styles(theme).imageContainer}>
            <Image
              style={styles(theme).image}
              source={{uri: data.image ? data.image : null}}
            />
          </View>
          <View style={styles(theme).bodyContainer}>
            <View style={styles(theme).detailsContainer}>
              <View style={styles(theme).detailsRow}>
                <View style={styles(theme).detailsTimeContainer}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles(theme).detailsText}>
                    {data.total_time
                      ? data.total_time + ' ' + (data.total_time_unit || 'min')
                      : '-'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles(theme).detailsTimeContainer}
                  onPress={() => setShowServingsModal(true)}>
                  <Ionicons
                    name="restaurant-outline"
                    size={18}
                    color={theme.colors.primary}
                    style={styles(theme).detailsIcon}
                  />
                  <Text style={styles(theme).detailsText}>
                    {currentServings} servings
                  </Text>
                </TouchableOpacity>
              </View>
              {data.categories && (
                <View style={styles(theme).tagsRow}>
                  {data.categories
                    .split(',')
                    .map((cat: string, idx: number) => {
                      const label = cat.trim();
                      const capitalized =
                        label.charAt(0).toUpperCase() + label.slice(1);
                      return (
                        <View key={idx}>
                          <Text style={styles(theme).tagPillText}>
                            {capitalized}
                            {idx < data.categories.split(',').length - 1
                              ? '  •  '
                              : ''}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}
              {data.about && (
                <Text style={styles(theme).aboutText}>{data.about}</Text>
              )}
            </View>
            <View style={styles(theme).tabBarContainer}>
              <CustomToggle
                value={tab === 'directions'}
                onValueChange={v => setTab(v ? 'directions' : 'ingredients')}
                leftLabel="Ingredients"
                rightLabel="Directions"
                textStyle="header"
              />
            </View>
            {tab === 'ingredients' && (
              <View style={styles(theme).ingredientsContainer}>
                {scaledIngredients ? (
                  scaledIngredients
                    .split('\n')
                    .map((ingredient: string, index: number, arr: string[]) => {
                      const {quantity, unit, text} =
                        parseIngredient(ingredient);
                      return (
                        <View
                          style={[
                            styles(theme).ingredientLine,
                            index !== arr.length - 1 &&
                              styles(theme).ingredientDivider,
                          ]}
                          key={index}>
                          <View style={styles(theme).quantityContainer}>
                            {quantity ? (
                              <Text style={styles(theme).quantity}>
                                {quantity} {unit}
                              </Text>
                            ) : (
                              <View style={styles(theme).emptyQuantity} />
                            )}
                          </View>
                          <Text style={styles(theme).ingredientTextBold}>
                            {text}
                          </Text>
                        </View>
                      );
                    })
                ) : (
                  <View style={styles(theme).emptyStateContainer}>
                    <Text style={styles(theme).emptyStateText}>
                      No ingredients found. Add them in edit mode or view the
                      original recipe.
                    </Text>
                  </View>
                )}
              </View>
            )}
            {tab === 'directions' && (
              <>
                <View style={styles(theme).instructionsContainer}>
                  {data.instructions ? (
                    data.instructions
                      .split('\n')
                      .map((instruction: any, index: any) => {
                        return (
                          <View style={styles(theme).lineContainer} key={index}>
                            <Text style={styles(theme).lineNumber}>
                              {index + 1}.
                            </Text>
                            <Text style={styles(theme).lineText}>
                              {instruction}
                            </Text>
                          </View>
                        );
                      })
                  ) : (
                    <View style={styles(theme).emptyStateContainer}>
                      <Text style={styles(theme).emptyStateText}>
                        No directions found. Add them in edit mode or view the
                        original recipe.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
      <View style={[styles(theme).toggleContainer]}>
        <CustomToggle
          value={isWebView}
          onValueChange={setIsWebView}
          leftLabel="Braise"
          rightLabel="Original"
          textStyle="body"
        />
      </View>
      <ServingsPickerModal
        visible={showServingsModal}
        onClose={() => setShowServingsModal(false)}
        onConfirm={handleServingsConfirm}
        currentValue={currentServings.toString()}
      />
      {showCompleteTooltip && currentStepData?.targetPosition && (
        <OnboardingTooltip
          visible={true}
          title={currentStepData.title}
          description={currentStepData.description}
          targetPosition={currentStepData.targetPosition}
          onNext={() => completeOnboarding()}
          onSkip={() => completeOnboarding()}
          isLastStep={currentStep === steps.length - 1}
        />
      )}
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    toggleContainer: {
      position: 'absolute',
      top: 65,
      left: '50%',
      transform: [{translateX: -105}],
      zIndex: 1,
      minWidth: 210,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 350,
      backgroundColor: theme.colors.border,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    bodyContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 18,
      backgroundColor: theme.colors.background,
      minHeight: '100%',
      marginTop: -75,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      alignContent: 'center',
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.text,
    },
    author: {
      ...theme.typography.h5,
      color: theme.colors.primary,
    },
    host: {
      ...theme.typography.b1,
      textDecorationLine: 'underline',
    },
    time: {
      ...theme.typography.b1,
      color: theme.colors.subtext,
      overflow: 'hidden',
    },
    sectionTitle: {
      ...theme.typography.h3,
      marginTop: 25,
      marginBottom: 10,
      color: theme.colors.subtext,
    },
    instructionsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 5,
    },
    ingredientsContainer: {
      paddingHorizontal: 15,
      paddingVertical: 5,
    },
    ingredientLine: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      backgroundColor: 'transparent',
    },
    ingredientDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    quantityContainer: {
      width: 80,
      alignItems: 'flex-end',
      paddingRight: 15,
    },
    quantity: {
      ...theme.typography.h4,
      textAlign: 'right',
      color: theme.colors.primary,
    },
    emptyQuantity: {
      width: 1,
      height: 24,
    },
    ingredientTextBold: {
      ...theme.typography.b1,
      flex: 1,
      color: theme.colors.text,
      textAlign: 'left',
      marginLeft: 0,
    },
    lineContainer: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
    },
    lineNumber: {
      ...theme.typography.h4,
      marginRight: 10,
      color: theme.colors.primary,
      marginTop: 2,
    },
    lineText: {
      ...theme.typography.b1,
      flex: 1,
      alignSelf: 'flex-start',
      color: theme.colors.text,
    },
    paddingRight: {
      paddingRight: 5,
    },
    webview: {
      flex: 1,
      marginTop: 105,
    },
    contentContainer: {
      flex: 1,
      marginTop: 105,
    },
    scrollContentContainer: {
      paddingBottom: 40,
    },
    hidden: {
      display: 'none',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
      fontSize: 16,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      padding: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: theme.colors.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    tagPillText: {
      color: theme.colors.text,
      ...theme.typography.h4,
    },
    tabBarContainer: {
      marginVertical: 10,
      width: '100%',
    },
    aboutText: {
      ...theme.typography.b1,
      color: theme.colors.text,
      marginVertical: 5,
    },
    emptyStateContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      marginTop: 10,
    },
    emptyStateText: {
      ...theme.typography.b2,
      color: theme.colors.subtext,
      textAlign: 'center',
    },
    flex: {
      flex: 1,
    },
    horizontalLine: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.opaque,
      marginBottom: 10,
    },
    authorRow: {
      marginBottom: 10,
    },
    headerContainer: {
      marginBottom: 10,
      paddingHorizontal: 25,
      paddingTop: 5,
    },
    detailsContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 7,
      padding: 15,
    },
    detailsText: {
      ...theme.typography.h5,
      color: theme.colors.text,
      marginLeft: 5,
    },
    detailsIcon: {
      marginRight: 3,
    },
    detailsTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
    },
  });
