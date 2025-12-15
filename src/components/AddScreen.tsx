import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Linking} from 'react-native';
import {useNavigation, ParamListBase} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Recipe} from '../models';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useAppDispatch} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';

export default function AddScreen() {
  const dispatch = useAppDispatch();
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
    categories: '',
  };

  const handleOpenBrowser = () => {
    Linking.openURL('http://');
  };

  return (
    <View style={styles(theme).content}>
      <View style={styles(theme).instructionsContainer}>
        <Text style={styles(theme).sectionTitle}>To add a recipe:</Text>
        <Text style={styles(theme).instructionsText}>
          1. Open the recipe in your browser
        </Text>
        <Text style={styles(theme).instructionsText}>
          2. Tap the Share button
        </Text>
        <Text style={styles(theme).instructionsText}>
          3. Select "Import to Braise"
        </Text>
        <Text style={styles(theme).instructionsText}>
          4. The recipe will automatically save
        </Text>
      </View>
      <View style={styles(theme).buttonsContainer}>
        <TouchableOpacity
          onPress={handleOpenBrowser}
          style={styles(theme).primaryButton}>
          <Text style={styles(theme).primaryButtonText}>Open browser</Text>
        </TouchableOpacity>
        <Text style={styles(theme).orText}>or</Text>
        <TouchableOpacity
          onPress={() => {
            dispatch(changeViewMode('edit'));
            navigation.navigate('RecipeDetailsScreen', {
              item: newRecipe,
            });
          }}
          style={styles(theme).secondaryButton}>
          <Text style={styles(theme).secondaryButtonText}>
            Add recipe from scratch
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    content: {
      padding: 22,
      alignItems: 'center',
      height: '100%',
      backgroundColor: theme.colors.secondaryLight,
      flex: 1,
      justifyContent: 'center',
    },
    instructionsContainer: {
      width: '100%',
      paddingHorizontal: 20,
      marginBottom: 60,
      alignItems: 'center',
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.secondary,
      marginBottom: 15,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    instructionsText: {
      ...theme.typography.h4,
      color: theme.colors.secondary,
      marginBottom: 12,
      lineHeight: 24,
      textAlign: 'center',
    },
    buttonsContainer: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    primaryButton: {
      backgroundColor: theme.colors.tertiary,
      paddingVertical: 18,
      paddingHorizontal: 40,
      borderRadius: 30,
      width: '100%',
      maxWidth: 300,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    primaryButtonText: {
      color: theme.colors.card,
      ...theme.typography.h2,
      fontWeight: '600',
    },
    orText: {
      ...theme.typography.h5,
      color: theme.colors.secondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: theme.colors.secondary,
      backgroundColor: 'transparent',
      paddingVertical: 14,
      paddingHorizontal: 30,
      borderRadius: 25,
      width: '100%',
      maxWidth: 250,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: theme.colors.secondary,
      ...theme.typography.h4,
    },
  });
