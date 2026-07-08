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
import {isTablet, MAX_CONTENT_WIDTH} from '../hooks/useTablet';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useHeaderHeight} from '@react-navigation/elements';
import CustomToggle from './CustomToggle';
import {parseIngredient, scaleIngredients} from '../services';
import {useGroceryListModal} from '../context/GroceryListModalContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BraiseLogoLight from '../assets/images/braise-logo-light.svg';
import {RecipeIngredient} from '../models';

export default function RecipeViewer({
  data,
  structuredIngredients = [],
}: {
  data: any;
  structuredIngredients?: RecipeIngredient[];
}) {
  const theme = useTheme() as unknown as Theme;
  const {showModal} = useGroceryListModal();
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
    showModal(structuredIngredients, recipeInfo);
  };

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

  const tablet = isTablet();
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles(theme).container}>
      <ScrollView
        style={[styles(theme).contentContainer, {marginTop: headerHeight}]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles(theme).scrollContentContainer}>
        <View style={tablet ? styles(theme).tabletContentWrapper : undefined}>
          <View style={styles(theme).imageContainer}>
            {data.image ? (
              <Image style={styles(theme).image} source={{uri: data.image}} />
            ) : (
              <View style={styles(theme).imagePlaceholder}>
                <BraiseLogoLight width={100} height={100} />
              </View>
            )}
          </View>
          <View style={styles(theme).headerContainer}>
            <Text style={styles(theme).title}>{data.title}</Text>
            {data.author && (
              <Text style={styles(theme).author}>{data.author}</Text>
            )}
          </View>
          <View style={styles(theme).divider} />
          <View style={styles(theme).bodyContainer}>
            <View style={styles(theme).metadataCard}>
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
            </View>
            {data.about && (
              <Text style={styles(theme).aboutText}>{data.about}</Text>
            )}
            {data.categories && (
              <View style={styles(theme).tagsRow}>
                {data.categories.split(',').map((cat: string, idx: number) => {
                  return (
                    <View key={idx} style={styles(theme).tagPill}>
                      <Text style={styles(theme).tagPillText}>
                        {cat.trim().toLocaleLowerCase()}
                      </Text>
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
                pressed && {backgroundColor: theme.colors['yellow-400']},
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors['neutral-100'],
    },
    imageContainer: {
      position: 'relative',
      height: 260,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 15,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors['neutral-300'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    bodyContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
      backgroundColor: theme.colors['neutral-100'],
    },
    tabletContentWrapper: {
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      width: '100%',
    },
    metadataCard: {
      borderRadius: 12,
      paddingVertical: 10,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignContent: 'center',
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors['neutral-800'],
    },
    author: {
      marginTop: 4,
      ...theme.typography.h2,
      color: theme.colors['toffee-400'],
    },
    instructionsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 5,
    },
    ingredientsContainer: {
      paddingHorizontal: 20,
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
      ...theme.typography['h2-emphasized'],
      marginRight: 10,
      color: theme.colors['neutral-800'],
    },
    lineText: {
      ...theme.typography.b1,
      flex: 1,
      marginTop: 1,
      alignSelf: 'flex-start',
      color: theme.colors['neutral-800'],
    },
    paddingRight: {
      paddingRight: 5,
    },
    contentContainer: {
      flex: 1,
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
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tagPill: {
      backgroundColor: theme.colors['neutral-300'],
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingTop: 5,
      paddingBottom: 7,
      marginVertical: 5,
      marginRight: 5,
    },
    tagPillText: {
      color: theme.colors['toffee-400'],
      ...theme.typography.h4,
    },
    tabBarContainer: {
      marginTop: 10,
      marginBottom: 5,
      borderTopWidth: 1,
      borderTopColor: theme.colors['neutral-300'],
      paddingTop: 10,
      width: '100%',
    },
    aboutText: {
      ...theme.typography.b1,
      color: theme.colors['neutral-800'],
      marginBottom: 10,
    },
    emptyStateContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginTop: 10,
    },
    emptyStateText: {
      ...theme.typography.b1,
      color: theme.colors['toffee-400'],
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
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 14,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
      marginHorizontal: 20,
    },
    detailsIcon: {
      marginRight: 3,
    },
    metadataServingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    metadataTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metadataText: {
      ...theme.typography.h2,
      color: theme.colors['toffee-400'],
      marginRight: 6,
    },
    metadataValue: {
      ...theme.typography['h2-emphasized'],
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
      ...theme.typography['h2-emphasized'],
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
