import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {Theme} from '../../theme/types';
import {useTheme} from '../../theme/ThemeProvider';

export default function BackIcon(navigation: any, component: any = null) {
  const {colors} = useTheme() as unknown as Theme;
  const viewMode = useSelector((state: any) => state.viewMode.value);

  if (viewMode !== 'view' && component === 'RecipeDetailsScreen') {
    return null;
  }

  const onBackPress = () => {
    if (component !== 'RecipeDetailsScreen') {
      navigation.goBack();
      return;
    }

    navigation.navigate('Recipes', {refresh: true});
  };

  return (
    <View style={[styles(colors).iconContainer]}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="chevron-back-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    iconContainer: {
      backgroundColor: colors.opaque,
      borderRadius: 48,
      paddingTop: 2,
      paddingLeft: 1,
      paddingBottom: 2,
      paddingRight: 3,
    },
  });
