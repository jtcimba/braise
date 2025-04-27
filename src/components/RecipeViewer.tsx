import React, {useState} from 'react';
import {
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {LogBox} from 'react-native';
import CustomToggle from './CustomToggle';

// Ignore WebView errors
LogBox.ignoreLogs(["Can't open url: about:srcdoc"]);

// Common measurement units
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
  const [webViewError, setWebViewError] = useState(false);

  const handleHostPress = () => {
    if (data.canonical_url) {
      Linking.openURL(data.canonical_url);
    }
  };

  // Function to convert Unicode fractions to decimal
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

  // Function to convert long-form units to abbreviations
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

    // Remove the quantity from the ingredient string
    const remainingText = ingredient
      .substring(quantityMatch?.[0]?.length || 0)
      .trim();

    // Check if the next word is a unit
    const words = remainingText.split(/\s+/);
    let unit = '';
    let text = remainingText;

    if (words.length > 0) {
      // Check for single word units
      if (MEASUREMENT_UNITS.includes(words[0].toLowerCase())) {
        unit = convertToAbbreviation(words[0]);
        text = words.slice(1).join(' ');
      }
      // Check for two-word units (like "fluid ounce")
      else if (
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
    <View style={{flex: 1}}>
      <View
        style={[
          styles(theme).contentContainer,
          !isWebView && styles(theme).hidden,
        ]}>
        {webViewError ? (
          <View style={styles(theme).errorContainer}>
            <Text style={styles(theme).errorText}>
              Unable to load the recipe. Please try again later.
            </Text>
            <TouchableOpacity
              style={styles(theme).retryButton}
              onPress={() => setWebViewError(false)}>
              <Text style={styles(theme).retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{uri: data.canonical_url}}
            style={styles(theme).webview}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={true}
            allowsInlineMediaPlayback={false}
            allowsFullscreenVideo={false}
            allowsPictureInPictureMediaPlayback={false}
            onError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setWebViewError(true);
            }}
            onHttpError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
              setWebViewError(true);
            }}
            onShouldStartLoadWithRequest={request => {
              if (
                request.url.includes('video') ||
                request.url.includes('player')
              ) {
                return false;
              }
              return true;
            }}
          />
        )}
      </View>
      <View
        style={[
          styles(theme).contentContainer,
          isWebView && styles(theme).hidden,
        ]}>
        <ScrollView automaticallyAdjustKeyboardInsets={true}>
          <Image
            style={styles(theme).image}
            source={{uri: data.image ? data.image : null}}
          />
          <View style={styles(theme).bodyContainer}>
            <Text style={styles(theme).title}>{data.title}</Text>
            <View style={styles(theme).subheader}>
              <View style={styles(theme).itemBody}>
                <Text style={styles(theme).subtext}>{data.author}</Text>
                {data.host && data.author && (
                  <Text style={styles(theme).dot}>•</Text>
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
            <View style={styles(theme).subheader}>
              <Text
                style={[
                  styles(theme).time,
                  data.total_time ? styles(theme).paddingRight : null,
                ]}>
                {data.total_time}
              </Text>
              <Text style={styles(theme).subtext}>{data.yields}</Text>
            </View>
            {data.ingredients && (
              <>
                <Text style={styles(theme).sectionTitle}>Ingredients</Text>
                <View style={styles(theme).ingredientsContainer}>
                  {data.ingredients
                    .split('\n')
                    .map((ingredient: string, index: number) => {
                      const {quantity, unit, text} =
                        parseIngredient(ingredient);

                      return (
                        <View style={styles(theme).ingredientLine} key={index}>
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
                    })}
                </View>
              </>
            )}
            {data.instructions && (
              <>
                <Text style={styles(theme).sectionTitle}>Instructions</Text>
                <View style={styles(theme).instructionsContainer}>
                  {data.instructions
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
                    })}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
      <View style={[styles(theme).toggleContainer]}>
        <CustomToggle
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
    toggleContainer: {
      position: 'absolute',
      bottom: 25,
      left: '50%',
      transform: [{translateX: -105}],
      zIndex: 1,
    },
    image: {
      width: '100%',
      height: 350,
      resizeMode: 'cover',
      backgroundColor: theme.colors.border,
    },
    bodyContainer: {
      flex: 1,
      paddingHorizontal: 20,
      marginBottom: 65,
    },
    title: {
      fontSize: 20,
      marginTop: 10,
      width: '100%',
      color: theme.colors.text,
    },
    subheader: {
      flexDirection: 'row',
      alignContent: 'center',
      marginTop: 5,
      width: '100%',
    },
    dot: {
      marginHorizontal: 5,
    },
    itemBody: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subtext: {
      fontSize: 16,
      color: theme.colors.subtext,
    },
    host: {
      textDecorationLine: 'underline',
    },
    time: {
      fontSize: 16,
      color: theme.colors.subtext,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 16,
      marginTop: 25,
      marginBottom: 10,
      color: theme.colors.subtext,
    },
    instructionsContainer: {
      flex: 1,
    },
    ingredientsContainer: {
      flex: 1,
    },
    ingredientLine: {
      flexDirection: 'row',
      paddingVertical: 5,
      alignItems: 'flex-start',
    },
    quantityContainer: {
      width: 70,
      alignItems: 'flex-end',
      paddingRight: 10,
    },
    quantity: {
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'right',
      lineHeight: 24,
    },
    emptyQuantity: {
      width: 1,
      height: 24,
    },
    ingredientText: {
      flex: 1,
      color: theme.colors.text,
      lineHeight: 24,
    },
    lineContainer: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 5,
    },
    lineNumber: {
      lineHeight: 24,
      marginRight: 10,
      color: theme.colors.subtext,
    },
    lineText: {
      lineHeight: 24,
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
  });
