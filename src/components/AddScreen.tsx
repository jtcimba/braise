import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {useNavigation, ParamListBase} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Recipe} from '../models';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function AddScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const {colors} = useTheme() as unknown as Theme;
  const newRecipe: Recipe = {
    id: '',
    title: '',
    author: '',
    host: '',
    image: '',
    total_time: '',
    yields: '',
    ingredients: '',
    instructions: '',
  };

  return (
    <View style={styles(colors).content}>
      <TouchableOpacity
        onPress={() => navigation.navigate('AddFromUrl')}
        style={styles(colors).button}>
        <View style={styles(colors).buttonContent}>
          <Text style={styles(colors).text}>From URL</Text>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.opaque}
          />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('RecipeDetailsScreen', {
            item: newRecipe,
            newRecipe: true,
          })
        }
        style={styles(colors).button}>
        <View style={styles(colors).buttonContent}>
          <Text style={styles(colors).text}>From Scratch</Text>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.opaque}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    content: {
      padding: 22,
      alignItems: 'center',
      height: '100%',
    },
    button: {
      backgroundColor: 'white',
      padding: 15,
      marginVertical: 10,
      borderRadius: 10,
      width: '100%',
    },
    buttonContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    text: {
      color: colors.text,
      fontSize: 16,
    },
  });
