import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {LogBox} from 'react-native';
import CustomToggle from './CustomToggle';
import {WebView} from 'react-native-webview';
import {parseIngredient, scaleIngredients} from '../services';
import {useGroceryListModal} from '../context/GroceryListModalContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Ignore WebView errors
LogBox.ignoreLogs(["Can't open url: about:srcdoc"]);

export default function RecipeViewer({data, onScaledIngredientsChange}: any) {
  const theme = useTheme() as unknown as Theme;
  const {showModal} = useGroceryListModal();
  const [isWebView, setIsWebView] = useState(false);
  const [tab, setTab] = useState('ingredients');
  const [currentServings, setCurrentServings] = useState(data.servings || '-');
  const [scaledIngredients, setScaledIngredients] = useState(
    data.ingredients || '',
  );

  const updateServings = (newServings: string) => {
    const newScaledIngredients = scaleIngredients(
      data.ingredients || '',
      newServings,
      data.servings != null ? data.servings.toString() : '1',
    );

    setCurrentServings(newServings);
    setScaledIngredients(newScaledIngredients);

    if (onScaledIngredientsChange) {
      onScaledIngredientsChange(newScaledIngredients);
    }
  };

  const handleDecreaseServings = () => {
    const num = parseInt(currentServings, 10) || 1;
    if (num > 1) {
      updateServings(String(num - 1));
    }
  };

  const handleIncreaseServings = () => {
    const num = parseInt(currentServings, 10) || 1;
    updateServings(String(num + 1));
  };

  const onAddToShoppingListPress = () => {
    const recipeInfo =
      data?.id && data?.title ? {id: data.id, title: data.title} : undefined;
    showModal(scaledIngredients, recipeInfo);
  };

  useEffect(() => {
    if (onScaledIngredientsChange) {
      onScaledIngredientsChange(scaledIngredients);
    }
  }, [scaledIngredients, onScaledIngredientsChange]);

  useEffect(() => {
    if (data.ingredients) {
      const originalServings =
        data.servings != null && data.servings !== '-'
          ? data.servings.toString()
          : '1';
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
          originalServings,
        );
        setScaledIngredients(newScaledIngredients);
      } else {
        setScaledIngredients(data.ingredients);
      }
    }
  }, [data.ingredients, data.servings, currentServings]);

  useEffect(() => {
    // Only update currentServings if data.servings changes to a non-null value
    // This allows user scaling to persist when original servings is null
    if (data.servings != null) {
      setCurrentServings(data.servings.toString());
    }
    // If data.servings is null, don't reset currentServings - allow user scaling to persist
  }, [data.servings]);

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
          <View style={styles(theme).headerContainer}>
            <Text style={styles(theme).title}>{data.title}</Text>
            {data.author && (
              <Text style={styles(theme).author}>{data.author}</Text>
            )}
          </View>
          <View style={styles(theme).imageContainer}>
            <Image
              style={styles(theme).image}
              source={{uri: data.image ? data.image : null}}
            />
          </View>
          <View style={styles(theme).bodyContainer}>
            <View style={styles(theme).detailsRow}>
              <View style={styles(theme).metadataServingsContainer}>
                <Text style={styles(theme).metadataText}>Servings</Text>
                <View style={styles(theme).servingsToggleContainer}>
                  <TouchableOpacity
                    style={styles(theme).servingsToggleButton}
                    onPress={handleDecreaseServings}>
                    <Ionicons
                      name="remove-outline"
                      size={16}
                      color={theme.colors['neutral-800']}
                    />
                  </TouchableOpacity>
                  <Text style={styles(theme).servingsValue}>
                    {currentServings}
                  </Text>
                  <TouchableOpacity
                    style={styles(theme).servingsToggleButton}
                    onPress={handleIncreaseServings}>
                    <Ionicons
                      name="add-outline"
                      size={16}
                      color={theme.colors['neutral-800']}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles(theme).metadataTimeContainer}>
                <Text style={styles(theme).metadataText}>Total Time</Text>
                <Text style={styles(theme).metadataValue}>
                  {data.total_time
                    ? data.total_time + ' ' + (data.total_time_unit || 'min')
                    : '-'}
                </Text>
              </View>
            </View>
            {data.about && (
              <Text style={styles(theme).aboutText}>{data.about}</Text>
            )}
            {data.categories && (
              <View style={styles(theme).tagsRow}>
                {data.categories.split(',').map((cat: string, idx: number) => {
                  const label = cat.trim().toUpperCase();
                  return (
                    <View key={idx} style={styles(theme).tagPill}>
                      <Text style={styles(theme).tagPillText}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
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
                          <Text style={styles(theme).ingredientText}>
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
            <Pressable
              style={({pressed}) => [
                styles(theme).addToShoppingListButton,
                pressed && {backgroundColor: '#98A3B5'},
              ]}
              onPress={onAddToShoppingListPress}>
              <Ionicons
                name="list-outline"
                size={20}
                color={theme.colors['neutral-100']}
                style={styles(theme).addToShoppingListIcon}
              />
              <Text style={styles(theme).addToShoppingListText}>
                Add to grocery list
              </Text>
            </Pressable>
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
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors['neutral-100'],
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
      height: 260,
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
      backgroundColor: theme.colors['neutral-100'],
      minHeight: '100%',
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignContent: 'center',
      marginBottom: 10,
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors['neutral-800'],
    },
    author: {
      ...theme.typography.h2,
      color: theme.colors['neutral-400'],
    },
    time: {
      ...theme.typography.h5,
      color: theme.colors['neutral-400'],
      overflow: 'hidden',
    },
    instructionsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 5,
    },
    ingredientsContainer: {
      paddingHorizontal: 30,
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
      borderBottomColor: theme.colors['neutral-300'],
    },
    quantityContainer: {
      width: 80,
      alignItems: 'flex-end',
      paddingRight: 15,
    },
    quantity: {
      ...theme.typography['h4-emphasized'],
      textAlign: 'right',
      color: theme.colors['neutral-800'],
    },
    emptyQuantity: {
      width: 1,
      height: 24,
    },
    ingredientText: {
      ...theme.typography.b1,
      flex: 1,
      color: theme.colors['neutral-800'],
      textAlign: 'left',
      marginLeft: 0,
    },
    lineContainer: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
    },
    lineNumber: {
      ...theme.typography['h4-emphasized'],
      marginRight: 10,
      marginTop: 2,
      color: theme.colors['neutral-800'],
    },
    lineText: {
      ...theme.typography.b1,
      flex: 1,
      alignSelf: 'flex-start',
      color: theme.colors['neutral-800'],
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
      paddingBottom: 10,
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
      ...theme.typography.h5,
      color: theme.colors['neutral-800'],
      marginBottom: 20,
      textAlign: 'center',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tagPill: {
      backgroundColor: theme.colors['rust-200'],
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginVertical: 5,
      marginRight: 5,
    },
    tagPillText: {
      color: theme.colors['rust-600'],
      ...theme.typography.h5,
    },
    tabBarContainer: {
      marginTop: 15,
      marginBottom: 5,
      width: '100%',
    },
    aboutText: {
      ...theme.typography.b2,
      color: theme.colors['neutral-800'],
      marginBottom: 5,
    },
    emptyStateContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginTop: 10,
    },
    emptyStateText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
      textAlign: 'center',
    },
    flex: {
      flex: 1,
    },
    horizontalLine: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
      marginBottom: 10,
    },
    headerContainer: {
      marginBottom: 10,
      paddingHorizontal: 20,
      paddingTop: 5,
    },
    detailsText: {
      ...theme.typography.h5,
      color: theme.colors['neutral-800'],
      marginLeft: 5,
    },
    detailsIcon: {
      marginRight: 3,
    },
    metadataServingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
    },
    metadataTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metadataText: {
      ...theme.typography.h3,
      color: theme.colors['neutral-400'],
      marginRight: 10,
    },
    metadataValue: {
      ...theme.typography['h3-emphasized'],
      color: theme.colors['neutral-800'],
    },
    servingsToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 24,
      minWidth: 70,
    },
    servingsValue: {
      ...theme.typography['h3-emphasized'],
      color: theme.colors['neutral-800'],
      minWidth: 18,
      textAlign: 'center',
    },
    servingsToggleButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    addToShoppingListButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors['neutral-800'],
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 24,
      marginTop: 24,
      marginBottom: 20,
    },
    addToShoppingListIcon: {
      marginRight: 8,
    },
    addToShoppingListText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-100'],
    },
  });
