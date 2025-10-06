import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RecipeService} from '../api';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import WebView from 'react-native-webview';

type RootStackParamList = {
  AddFromUrl: undefined;
  RecipeDetailsScreen: {item: any; newRecipe: boolean};
};

export default function AddFromUrlScreen() {
  const theme = useTheme() as unknown as Theme;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  useEffect(() => {
    if (url.length === 0) {
      setIsValidUrl(false);
      return;
    }
    try {
      new URL(url);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(false);
    }
  }, [url]);

  const onAddRecipe = () => {
    setIsLoading(true);
    RecipeService.getRecipeFromUrl(url)
      .then(recipe => {
        navigation.navigate('RecipeDetailsScreen', {
          item: {
            ...recipe.data,
          },
          newRecipe: true,
        });
      })
      .catch(e => {
        console.log(e);
        Alert.alert('Error', 'Failed to add recipe. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles(theme).container}>
        {isLoading && (
          <View style={styles(theme).loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.subtext} />
          </View>
        )}
        <View style={styles(theme).content}>
          {!isValidUrl && (
            <View style={styles(theme).invalidUrlContainer}>
              <Text style={styles(theme).invalidUrlText}>
                Enter a valid URL
              </Text>
            </View>
          )}
          {isValidUrl && (
            <View style={styles(theme).webviewContainer}>
              <WebView
                source={{uri: url}}
                style={styles(theme).webview}
                startInLoadingState={true}
                renderLoading={() => (
                  <ActivityIndicator
                    style={styles(theme).webviewLoader}
                    color={theme.colors.subtext}
                  />
                )}
              />
            </View>
          )}
          <TextInput
            style={styles(theme).input}
            placeholder="https://www..."
            placeholderTextColor={theme.colors.subtext}
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
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      overflow: 'hidden',
    },
    content: {
      backgroundColor: theme.colors.secondary,
      padding: 22,
      alignItems: 'center',
      height: '100%',
      flex: 1,
      justifyContent: 'space-between',
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
    },
    loadingOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{translateX: -50}, {translateY: -50}],
      width: 100,
      height: 100,
      borderRadius: 20,
      backgroundColor: theme.colors.opaque,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    webviewContainer: {
      width: '100%',
      height: Dimensions.get('window').height * 0.63,
      marginVertical: 10,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: theme.colors.border,
    },
    webview: {
      flex: 1,
    },
    webviewLoader: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{translateX: -50}, {translateY: -50}],
    },
    invalidUrlContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    invalidUrlText: {
      color: theme.colors.card,
      fontSize: 14,
      textAlign: 'center',
      ...theme.typography.b2,
    },
  });
