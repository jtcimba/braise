import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image} from 'react-native';
import {useNavigation, ParamListBase} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Recipe} from '../models';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

export default function AddScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const theme = useTheme() as unknown as Theme;
  const newRecipe: Recipe = {
    id: '',
    title: '',
    author: '',
    host: '',
    image: '',
    total_time: '',
    total_time_unit: '',
    yields: '',
    ingredients: '',
    instructions: '',
    category: '',
  };

  return (
    <View style={styles(theme).content}>
      <View style={styles(theme).imageContainer}>
        <Image
          source={require('../assets/bowl.png')}
          style={styles(theme).bowlImage}
          resizeMode="contain"
        />
      </View>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('RecipeDetailsScreen', {
            item: newRecipe,
            newRecipe: true,
          })
        }
        style={styles(theme).secondaryButton}>
        <View style={styles(theme).buttonContent}>
          <Text style={styles(theme).text}>From scratch</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('AddFromUrl')}
        style={styles(theme).button}>
        <View style={styles(theme).buttonContent}>
          <Text style={styles(theme).text}>From url</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    content: {
      padding: 22,
      alignItems: 'center',
      height: '100%',
      backgroundColor: theme.colors.secondary,
      flex: 1,
      justifyContent: 'space-between',
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 5,
    },
    bowlImage: {
      width: 400,
      height: 400,
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
    buttonContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    text: {
      color: theme.colors.card,
      ...theme.typography.h2,
    },
    subtext: {
      color: theme.colors.subtext,
      fontSize: 14,
      marginTop: 2,
      ...theme.typography.b2,
    },
    secondaryButton: {
      borderWidth: 2,
      borderColor: theme.colors.card,
      padding: 10,
      marginVertical: 10,
      borderRadius: 30,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
