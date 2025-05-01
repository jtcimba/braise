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
  const {colors} = useTheme() as unknown as Theme;
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
            ...recipe,
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
      <View style={styles(colors).container}>
        {isLoading && (
          <View style={styles(colors).loadingOverlay}>
            <ActivityIndicator size="large" color={colors.subtext} />
          </View>
        )}
        <View style={styles(colors).content}>
          <TextInput
            style={styles(colors).input}
            placeholder="https://www..."
            placeholderTextColor={colors.subtext}
            value={url}
            onChangeText={text => {
              setUrl(text);
            }}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={() => onAddRecipe()}
          />
          {!isValidUrl && (
            <View style={styles(colors).invalidUrlContainer}>
              <Text style={styles(colors).invalidUrlText}>
                Enter a valid URL
              </Text>
            </View>
          )}
          {isValidUrl && (
            <View style={styles(colors).webviewContainer}>
              <WebView
                source={{uri: url}}
                style={styles(colors).webview}
                startInLoadingState={true}
                renderLoading={() => (
                  <ActivityIndicator
                    style={styles(colors).webviewLoader}
                    color={colors.subtext}
                  />
                )}
              />
            </View>
          )}
          <TouchableOpacity
            onPress={() => onAddRecipe()}
            style={styles(colors).button}
            disabled={!isValidUrl || isLoading}>
            <Text
              style={[
                styles(colors).text,
                !isValidUrl && styles(colors).disabledText,
                isLoading && styles(colors).disabledText,
              ]}>
              Add recipe
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      overflow: 'hidden',
    },
    content: {
      backgroundColor: colors.background,
      padding: 22,
      alignItems: 'center',
      height: '100%',
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
    },
    button: {
      position: 'absolute',
      bottom: 15,
      backgroundColor: colors.primary,
      padding: 15,
      marginVertical: 10,
      borderRadius: 10,
      width: '100%',
    },
    text: {
      color: 'white',
      fontSize: 16,
      textAlign: 'center',
    },
    disabledText: {
      opacity: 0.5,
    },
    input: {
      padding: 15,
      marginVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
      color: colors.text,
    },
    loadingOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{translateX: -50}, {translateY: -50}],
      width: 100,
      height: 100,
      borderRadius: 20,
      backgroundColor: colors.opaque,
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
      backgroundColor: colors.backgroundText,
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
      color: colors.opaque,
      fontSize: 16,
      textAlign: 'center',
    },
  });
