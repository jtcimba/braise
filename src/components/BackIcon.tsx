import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@react-navigation/native';
import {useSelector} from 'react-redux';

export default function BackIcon(navigation: any, component: any = null) {
  const {colors} = useTheme();
  const viewMode = useSelector((state: any) => state.viewMode.value);

  if (viewMode !== 'view' && component === 'RecipeDetailsScreen') {
    return null;
  }

  const onBackPress = () => {
    if (component === 'RecipeDetailsScreen') {
      navigation.navigate('Recipes', {refresh: true});
      return;
    }
    navigation.goBack();
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
