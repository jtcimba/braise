import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

export default function BackIcon(
  navigation: any,
  component: any = null,
  color: string = '#2D2D2D',
) {
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
    <View style={[styles().iconContainer]}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="chevron-back-outline" size={25} color={color} />
      </TouchableOpacity>
    </View>
  );
}

const styles = () =>
  StyleSheet.create({
    iconContainer: {
      borderRadius: 48,
      paddingTop: 2,
      paddingLeft: 1,
      paddingBottom: 2,
      paddingRight: 3,
    },
  });
