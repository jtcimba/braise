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
import ServingsPickerModal from './ServingsPickerModal';
import {parseIngredient, scaleIngredients} from '../services';

// Ignore WebView errors
LogBox.ignoreLogs(["Can't open url: about:srcdoc"]);

export default function RecipeViewer({data}: any) {
  const theme = useTheme() as unknown as Theme;
  const [isWebView, setIsWebView] = useState(false);
  const [tab, setTab] = useState('ingredients');
  const [showServingsModal, setShowServingsModal] = useState(false);
  const [currentServings, setCurrentServings] = useState(data.yields || '-');
  const [scaledIngredients, setScaledIngredients] = useState(
    data.ingredients || '',
  );
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

  const handleServingsConfirm = (newServings: string) => {
    const originalServings =
      data.yields && data.yields !== '-' ? data.yields : '1';
    const newScaledIngredients = scaleIngredients(
      data.ingredients || '',
      newServings,
      originalServings,
    );

    setCurrentServings(newServings);
    setScaledIngredients(newScaledIngredients);
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
                <TouchableOpacity
                  style={styles(theme).metaBadgeRect}
                  onPress={() => setShowServingsModal(true)}
                  activeOpacity={0.7}>
                  <Text style={styles(theme).metaBadgeValue}>
                    {currentServings}
                  </Text>
                  <Text style={styles(theme).metaBadgeLabel}>servings</Text>
                </TouchableOpacity>
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

      <ServingsPickerModal
        visible={showServingsModal}
        onClose={() => setShowServingsModal(false)}
        onConfirm={handleServingsConfirm}
        currentValue={currentServings}
      />
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
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      marginTop: -75,
      paddingTop: 18,
      backgroundColor: theme.colors.background,
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
      ...theme.typography.b1,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: -2,
    },
    metaBadgeLabel: {
      ...theme.typography.b1,
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
      ...theme.typography.b1,
      color: theme.colors.subtext,
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
      ...theme.typography.b1,
      textAlign: 'right',
      color: theme.colors.subtext,
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
      ...theme.typography.b1,
      marginRight: 10,
      color: theme.colors.subtext,
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
      ...theme.typography.b1,
    },
    tabBarContainer: {
      marginVertical: 10,
      width: '100%',
    },
    aboutText: {
      ...theme.typography.b1,
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
      ...theme.typography.b1,
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
