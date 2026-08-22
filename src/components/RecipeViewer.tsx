import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {supabase} from '../supabase-client';
import {isTablet, MAX_CONTENT_WIDTH} from '../hooks/useTablet';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useHeaderHeight} from '@react-navigation/elements';
import CustomToggle from './CustomToggle';
import {scaleQuantity} from '../services';
import {useGroceryListModal} from '../context/GroceryListModalContext';
import {useAddToCollectionModal} from '../context/AddToCollectionModalContext';
import {collectionsService} from '../services/collectionsService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BraiseLogoLight from '../assets/images/braise-logo-light.svg';
import {Collection, RecipeIngredient} from '../models';

function renderWithBold(text: string, baseStyle: any, boldStyle: any) {
  const parts = text.split(/\*\*(.+?)\*\*/);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={boldStyle}>
        {part}
      </Text>
    ) : (
      <Text key={i} style={baseStyle}>
        {part}
      </Text>
    ),
  );
}

const parseAmountNum = (amount: string | null): number => {
  if (!amount) {
    return 0;
  }
  if (amount.includes('/')) {
    const [n, d] = amount.split('/');
    return parseFloat(n) / parseFloat(d);
  }
  return parseFloat(amount) || 0;
};

const pluralizeUnit = (
  unit: string | null,
  amount: string | null,
): string | null => {
  if (!unit) {
    return null;
  }
  const num = parseAmountNum(amount);
  if (num <= 1) {
    return unit;
  }
  const noPlural = new Set([
    'tsp',
    'tbsp',
    'oz',
    'fl oz',
    'g',
    'kg',
    'ml',
    'l',
  ]);
  if (noPlural.has(unit.toLowerCase()) || unit.endsWith('s')) {
    return unit;
  }
  return unit + 's';
};

export default function RecipeViewer({
  data,
  structuredIngredients = [],
  isLoadingIngredients = false,
}: {
  data: any;
  structuredIngredients?: RecipeIngredient[];
  isLoadingIngredients?: boolean;
}) {
  const theme = useTheme() as unknown as Theme;
  const {showModal} = useGroceryListModal();
  const {
    showModal: showAddToCollectionModal,
    isVisible: isCollectionModalVisible,
  } = useAddToCollectionModal();
  const [recipeCollections, setRecipeCollections] = useState<Collection[]>([]);
  const [tab, setTab] = useState('ingredients');
  const [currentServings, setCurrentServings] = useState(data.servings || '-');
  const [enhancedInstructions, setEnhancedInstructions] = useState<
    string | null
  >(data.enhanced_instructions ?? null);
  const [showEnhanced, setShowEnhanced] = useState(
    !!data.enhanced_instructions,
  );
  const [isEnhancing, setIsEnhancing] = useState(false);

  const originalServings =
    data.servings != null ? parseFloat(data.servings.toString()) : 1;
  const scaleFactor =
    currentServings !== '-'
      ? parseFloat(currentServings) / originalServings
      : 1;

  const handleDecreaseServings = () => {
    const num = parseInt(currentServings, 10) || 1;
    if (num > 1) {
      setCurrentServings(String(num - 1));
    }
  };

  const handleIncreaseServings = () => {
    const num = parseInt(currentServings, 10) || 1;
    setCurrentServings(String(num + 1));
  };

  const onAddToShoppingListPress = () => {
    const recipeInfo =
      data?.id && data?.title ? {id: data.id, title: data.title} : undefined;
    showModal(structuredIngredients, recipeInfo);
  };

  const handleEnhance = async () => {
    if (isEnhancing || !data.instructions || !structuredIngredients.length) {
      return;
    }
    setIsEnhancing(true);
    try {
      const {data: result, error} = await supabase.functions.invoke(
        'enhance-directions',
        {
          body: {
            recipeId: data.id,
            instructions: data.instructions,
            ingredients: structuredIngredients.map(i => ({
              name: i.name,
              amount: i.amount,
              unit: i.unit,
            })),
          },
        },
      );
      if (!error && result?.instructions) {
        setEnhancedInstructions(result.instructions);
        setShowEnhanced(true);
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  useEffect(() => {
    // Only update currentServings if data.servings changes to a non-null value
    // This allows user scaling to persist when original servings is null
    if (data.servings != null) {
      setCurrentServings(data.servings.toString());
    }
    // If data.servings is null, don't reset currentServings - allow user scaling to persist
  }, [data.servings]);

  useEffect(() => {
    if (!data.id) {
      return;
    }
    collectionsService
      .fetchRecipeCollections(data.id)
      .then(setRecipeCollections)
      .catch(() => {});
  }, [data.id, isCollectionModalVisible]);

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
            {recipeCollections.length > 0 && (
              <View style={styles(theme).tagsRow}>
                {recipeCollections.map(collection => (
                  <View key={collection.id} style={styles(theme).tagPill}>
                    <Text style={styles(theme).tagPillText}>
                      {collection.name}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles(theme).tagPill, styles(theme).addPill]}
                  onPress={() => data.id && showAddToCollectionModal(data.id)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="add"
                    size={13}
                    color={theme.colors['toffee-400']}
                  />
                  <Text style={styles(theme).addPillText}>Add</Text>
                </TouchableOpacity>
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
                {isLoadingIngredients ? null : structuredIngredients.length >
                  0 ? (
                  structuredIngredients.map((row, index) => {
                    const scaledAmount =
                      scaleFactor !== 1 && row.amount
                        ? scaleQuantity(row.amount, scaleFactor)
                        : row.amount;
                    const displayUnit = pluralizeUnit(row.unit, scaledAmount);
                    const amountDisplay = [scaledAmount, displayUnit]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <View
                        style={[
                          styles(theme).ingredientLine,
                          index !== structuredIngredients.length - 1 &&
                            styles(theme).ingredientDivider,
                        ]}
                        key={row.id}>
                        <View style={styles(theme).quantityContainer}>
                          {amountDisplay ? (
                            <Text style={styles(theme).quantity}>
                              {amountDisplay}
                            </Text>
                          ) : (
                            <View style={styles(theme).emptyQuantity} />
                          )}
                        </View>
                        <View style={styles(theme).ingredientNameContainer}>
                          <Text style={styles(theme).ingredientText}>
                            {row.name}
                          </Text>
                        </View>
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
                {data.instructions && structuredIngredients.length > 0 && (
                  <TouchableOpacity
                    style={styles(theme).enhanceButton}
                    onPress={
                      enhancedInstructions
                        ? () => setShowEnhanced(v => !v)
                        : handleEnhance
                    }
                    disabled={isEnhancing}>
                    <Text
                      style={[
                        styles(theme).enhanceButtonText,
                        showEnhanced && styles(theme).enhanceButtonTextActive,
                      ]}>
                      {showEnhanced ? 'Enhanced' : 'Enhance'}
                    </Text>
                    {isEnhancing ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors['toffee-400']}
                        style={styles(theme).enhanceCircle}
                      />
                    ) : (
                      <View
                        style={[
                          styles(theme).enhanceCircle,
                          showEnhanced && styles(theme).enhanceCircleActive,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                )}
                <View style={styles(theme).instructionsContainer}>
                  {data.instructions ? (
                    (showEnhanced && enhancedInstructions
                      ? enhancedInstructions
                      : data.instructions
                    )
                      .split('\n')
                      .map((instruction: string, index: number) => (
                        <View style={styles(theme).lineContainer} key={index}>
                          <Text style={styles(theme).lineNumber}>
                            {index + 1}.
                          </Text>
                          <Text style={styles(theme).lineText}>
                            {showEnhanced && enhancedInstructions
                              ? renderWithBold(
                                  instruction,
                                  styles(theme).lineText,
                                  styles(theme).lineTextBold,
                                )
                              : instruction}
                          </Text>
                        </View>
                      ))
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
            {!isLoadingIngredients && (
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
            )}
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
      marginBottom: 20,
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
      marginTop: 10,
      paddingHorizontal: 15,
      paddingBottom: 20,
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
      marginTop: 5,
      ...theme.typography.h2,
      color: theme.colors['toffee-400'],
    },
    enhanceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginRight: 20,
      marginTop: 10,
      gap: 8,
    },
    enhanceButtonText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
    },
    enhanceButtonTextActive: {
      ...theme.typography['h4-emphasized'],
    },
    enhanceCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
    },
    enhanceCircleActive: {
      backgroundColor: theme.colors['yellow-400'],
      borderColor: theme.colors['yellow-400'],
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
      flex: 1,
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
    ingredientNameContainer: {
      flex: 2,
    },
    ingredientText: {
      ...theme.typography.b1,
      color: theme.colors['neutral-800'],
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
    lineTextBold: {
      ...theme.typography.b1,
      fontWeight: '700',
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
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingTop: 5,
      paddingBottom: 6,
      marginVertical: 5,
      marginRight: 5,
    },
    tagPillText: {
      color: theme.colors['neutral-800'],
      ...theme.typography.h4,
    },
    addPill: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      flexDirection: 'row',
      alignItems: 'center',
    },
    addPillText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
      marginLeft: 2,
    },
    tabBarContainer: {
      marginTop: 5,
      marginBottom: 5,
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
      paddingHorizontal: 15,
      paddingTop: 5,
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
      color: theme.colors['neutral-800'],
      marginRight: 6,
    },
    metadataValue: {
      ...theme.typography['h4-emphasized'],
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
      marginBottom: 10,
    },
    addToShoppingListIcon: {
      marginRight: 8,
    },
    addToShoppingListText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-100'],
    },
  });
