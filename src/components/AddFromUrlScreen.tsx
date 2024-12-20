import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {useNavigation, useTheme} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RecipeService} from '../api';

type RootStackParamList = {
  AddFromUrl: undefined;
  DetailsScreen: {item: any; newRecipe: boolean};
};

export default function AddFromUrlScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [url, setUrl] = useState('');

  const onAddRecipe = () => {
    RecipeService.getRecipeFromUrl(url)
      .then(recipe => {
        navigation.navigate('DetailsScreen', {
          item: {
            ...JSON.parse(recipe.body),
            ingredients: JSON.parse(recipe.body).ingredients.join('\n'),
          },
          newRecipe: true,
        });
      })
      .catch(() => {
        Alert.alert('Oops!', 'Failed to add recipe. Please try again.');
      });
  };

  return (
    <View style={styles(colors).content}>
      <TextInput
        style={styles(colors).input}
        placeholder="https://www..."
        placeholderTextColor="gray"
        value={url}
        onChangeText={setUrl}
      />
      <TouchableOpacity
        onPress={() => onAddRecipe()}
        style={styles(colors).button}>
        <Text style={styles(colors).text}>Add recipe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
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
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
    },
  });
