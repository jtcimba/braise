import React, {useState} from 'react';
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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RecipeService} from '../api';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

type RootStackParamList = {
  AddFromUrl: undefined;
  RecipeDetailsScreen: {item: any; newRecipe: boolean};
};

export default function AddFromUrlScreen() {
  const {colors} = useTheme() as unknown as Theme;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const onAddRecipe = () => {
    setIsLoading(true);
    RecipeService.getRecipeFromUrl(url)
      .then(recipe => {
        navigation.navigate('RecipeDetailsScreen', {
          item: {
            ...recipe,
            ingredients: recipe.ingredients?.join('\n'),
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
            onChangeText={setUrl}
          />
          <TouchableOpacity
            onPress={() => onAddRecipe()}
            style={styles(colors).button}>
            <Text style={styles(colors).text}>Add recipe</Text>
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
    },
    content: {
      backgroundColor: colors.background,
      padding: 22,
      alignItems: 'center',
      height: '100%',
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
    input: {
      padding: 15,
      marginVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.border,
      width: '100%',
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
  });
