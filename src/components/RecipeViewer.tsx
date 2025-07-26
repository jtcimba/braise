import React, {useState, useRef} from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {LogBox} from 'react-native';
import CustomToggle from './CustomToggle';
import {WebView} from 'react-native-webview';

// Ignore WebView errors
LogBox.ignoreLogs(["Can't open url: about:srcdoc"]);

const MEASUREMENT_UNITS = [
  // Volume
  'cup',
  'cups',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'tbsp.',
  'tbs',
  'teaspoon',
  'teaspoons',
  'tsp',
  'tsp.',
  'fluid ounce',
  'fluid ounces',
  'fl oz',
  'fl. oz.',
  'pint',
  'pints',
  'pt',
  'pt.',
  'quart',
  'quarts',
  'qt',
  'qt.',
  'gallon',
  'gallons',
  'gal',
  'gal.',
  'milliliter',
  'milliliters',
  'ml',
  'ml.',
  'liter',
  'liters',
  'l',
  'l.',

  // Weight
  'ounce',
  'ounces',
  'oz',
  'oz.',
  'pound',
  'pounds',
  'lb',
  'lb.',
  'lbs',
  'lbs.',
  'gram',
  'grams',
  'g',
  'g.',
  'kilogram',
  'kilograms',
  'kg',
  'kg.',

  // Length
  'inch',
  'inches',
  'in',
  'in.',
  'centimeter',
  'centimeters',
  'cm',
  'cm.',
  'meter',
  'meters',
  'm',
  'm.',

  // Count
  'piece',
  'pieces',
  'pc',
  'pc.',
  'pinch',
  'dash',
  'to taste',

  // Common abbreviations
  't',
  't.',
  'T',
  'T.',
  'c',
  'c.',
  'pt',
  'pt.',
  'qt',
  'qt.',
  'gal',
  'gal.',
  'oz',
  'oz.',
  'lb',
  'lb.',
  'g',
  'g.',
  'kg',
  'kg.',
  'ml',
  'ml.',
  'l',
  'l.',
];

export default function RecipeViewer({data}: any) {
  const theme = useTheme() as unknown as Theme;
  const [isWebView, setIsWebView] = useState(false);
  const [tab, setTab] = useState('ingredients');
  const scrollY = useRef(new Animated.Value(0)).current;

  const imageScale = scrollY.interpolate({
    inputRange: [-350, 0],
    outputRange: [1.5, 1],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: [-100, 0, 100],
    extrapolate: 'clamp',
  });

  const handleHostPress = () => {
    if (data.canonical_url) {
      Linking.openURL(data.canonical_url);
    }
  };

  const convertUnicodeFraction = (fraction: string): string => {
    const unicodeFractions: {[key: string]: string} = {
      '½': '1/2',
      '⅓': '1/3',
      '⅔': '2/3',
      '¼': '1/4',
      '¾': '3/4',
      '⅕': '1/5',
      '⅖': '2/5',
      '⅗': '3/5',
      '⅘': '4/5',
      '⅙': '1/6',
      '⅚': '5/6',
      '⅐': '1/7',
      '⅛': '1/8',
      '⅜': '3/8',
      '⅝': '5/8',
      '⅞': '7/8',
    };
    return unicodeFractions[fraction] || fraction;
  };

  const convertToAbbreviation = (unit: string): string => {
    const unitMap = {
      // Volume
      teaspoon: 'tsp',
      teaspoons: 'tsp',
      tablespoon: 'tbsp',
      tablespoons: 'tbsp',
      'fluid ounce': 'fl oz',
      'fluid ounces': 'fl oz',
      pint: 'pt',
      pints: 'pt',
      quart: 'qt',
      quarts: 'qt',
      gallon: 'gal',
      gallons: 'gal',
      milliliter: 'ml',
      milliliters: 'ml',
      liter: 'l',
      liters: 'l',

      // Weight
      ounce: 'oz',
      ounces: 'oz',
      pound: 'lb',
      pounds: 'lb',
      gram: 'g',
      grams: 'g',
      kilogram: 'kg',
      kilograms: 'kg',

      // Length
      inch: 'in',
      inches: 'in',
      centimeter: 'cm',
      centimeters: 'cm',
      meter: 'm',
      meters: 'm',

      // Count
      piece: 'pc',
      pieces: 'pc',
    } as const;

    const lowerUnit = unit.toLowerCase();
    return unitMap[lowerUnit as keyof typeof unitMap] || unit;
  };

  const parseIngredient = (ingredient: string) => {
    const quantityMatch = ingredient.match(
      /^(\d+\s*\d*\/\d+|\d+\.\d+|\d+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞])?/,
    );
    const quantity = quantityMatch
      ? convertUnicodeFraction(quantityMatch[1]?.trim() || '')
      : '';

    if (!quantity) {
      return {quantity: '', unit: '', text: ingredient};
    }

    const remainingText = ingredient
      .substring(quantityMatch?.[0]?.length || 0)
      .trim();

    const words = remainingText.split(/\s+/);
    let unit = '';
    let text = remainingText;

    if (words.length > 0) {
      if (MEASUREMENT_UNITS.includes(words[0].toLowerCase())) {
        unit = convertToAbbreviation(words[0]);
        text = words.slice(1).join(' ');
      } else if (
        words.length > 1 &&
        MEASUREMENT_UNITS.includes(`${words[0]} ${words[1]}`.toLowerCase())
      ) {
        unit = convertToAbbreviation(`${words[0]} ${words[1]}`);
        text = words.slice(2).join(' ');
      }
    }

    return {quantity, unit, text};
  };

  return (
    <View style={styles(theme).container}>
      {isWebView ? (
        <WebView
          source={{uri: data.canonical_url}}
          style={styles(theme).webview}
        />
      ) : (
        <Animated.ScrollView
          contentContainerStyle={styles(theme).scrollContent}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
          bounces={true}
          contentInsetAdjustmentBehavior="never"
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: true},
          )}
          scrollEventThrottle={16}>
          <Animated.View
            style={[
              {transform: [{scale: imageScale}, {translateY: imageTranslateY}]},
              styles(theme).imageContainer,
            ]}>
            <Image
              style={styles(theme).image}
              source={{uri: data.image ? data.image : null}}
            />
          </Animated.View>
          <View style={styles(theme).bodyContainer}>
            <View style={styles(theme).headerRow}>
              <View style={styles(theme).flex}>
                <Text style={styles(theme).title}>{data.title}</Text>
                <View style={styles(theme).authorRow}>
                  {data.author && (
                    <Text style={styles(theme).subtext}>{data.author}</Text>
                  )}
                  {data.host && (
                    <TouchableOpacity onPress={handleHostPress}>
                      <Text style={[styles(theme).subtext, styles(theme).host]}>
                        {data.host}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles(theme).metaBadgeCol}>
                <View style={styles(theme).metaBadgeRect}>
                  <Text style={styles(theme).metaBadgeValue}>
                    {data.yields || '-'}
                  </Text>
                  <Text style={styles(theme).metaBadgeLabel}>servings</Text>
                </View>
                <View style={styles(theme).metaBadgeRect}>
                  <Text style={styles(theme).metaBadgeValue}>
                    {data.total_time || '-'}
                  </Text>
                  <Text style={styles(theme).metaBadgeLabel}>
                    {data.total_time_unit || 'min'}
                  </Text>
                </View>
              </View>
            </View>
            {data.category && (
              <View style={styles(theme).tagsRow}>
                {data.category.split(',').map((cat: string, idx: number) => {
                  const label = cat.trim();
                  const capitalized =
                    label.charAt(0).toUpperCase() + label.slice(1);
                  return (
                    <View key={idx}>
                      <Text style={styles(theme).tagPillText}>
                        {capitalized}
                        {idx < data.category.split(',').length - 1
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
            <View style={styles(theme).tabBarContainer}>
              <CustomToggle
                value={tab === 'directions'}
                onValueChange={v => setTab(v ? 'directions' : 'ingredients')}
                leftLabel="Ingredients"
                rightLabel="Directions"
                textStyle="header"
                color="secondary"
                type="tab"
              />
            </View>
            {tab === 'ingredients' && (
              <View style={styles(theme).ingredientsContainer}>
                {data.ingredients ? (
                  data.ingredients
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
        </Animated.ScrollView>
      )}
      <View style={[styles(theme).toggleContainer]}>
        <CustomToggle
          type="pill"
          color="secondary"
          value={isWebView}
          onValueChange={setIsWebView}
          leftLabel="Braise"
          rightLabel="Original"
        />
      </View>
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
      top: 68,
      left: '50%',
      transform: [{translateX: -105}],
      zIndex: 1,
    },
    imageContainer: {
      overflow: 'hidden',
      marginTop: -50,
    },
    image: {
      width: '100%',
      height: 475,
      resizeMode: 'cover',
      backgroundColor: theme.colors.border,
    },
    bodyContainer: {
      flex: 1,
      paddingHorizontal: 20,
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      marginTop: -75,
      paddingTop: 18,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    metaBadgeCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 5,
    },
    metaBadgeRect: {
      width: 64,
      height: 60,
      borderRadius: 13,
      backgroundColor: theme.colors.badgeBackground,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    metaBadgeValue: {
      ...theme.typography.bodyLarge,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: -2,
    },
    metaBadgeLabel: {
      ...theme.typography.caption,
      color: theme.colors.text,
      textAlign: 'center',
      opacity: 0.7,
      marginTop: -2,
      flexWrap: 'wrap',
      width: '100%',
    },
    title: {
      ...theme.typography.h1,
      marginBottom: 5,
      width: '100%',
      color: theme.colors.text,
    },
    subtext: {
      ...theme.typography.bodyMedium,
      color: theme.colors.subtext,
    },
    host: {
      ...theme.typography.bodyMedium,
      textDecorationLine: 'underline',
    },
    time: {
      ...theme.typography.bodyMedium,
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
      ...theme.typography.bodyMedium,
      textAlign: 'right',
      color: theme.colors.subtext,
    },
    emptyQuantity: {
      width: 1,
      height: 24,
    },
    ingredientTextBold: {
      ...theme.typography.bodyMedium,
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
      ...theme.typography.bodyMedium,
      marginRight: 10,
      color: theme.colors.subtext,
    },
    lineText: {
      ...theme.typography.bodyMedium,
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
    },
    tagPillText: {
      color: theme.colors.primary,
      ...theme.typography.bodyMedium,
    },
    tabBarContainer: {
      marginVertical: 10,
      width: '100%',
    },
    aboutText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.text,
      marginBottom: 5,
    },
    emptyStateContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      marginTop: 10,
    },
    emptyStateText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.subtext,
      textAlign: 'center',
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
      paddingTop: 0,
    },
    horizontalLine: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.opaque,
      marginBottom: 10,
    },
    authorRow: {
      marginBottom: 10,
    },
  });
