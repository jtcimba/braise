import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@react-navigation/native';
import {useSelector} from 'react-redux';

export default function BackIcon(navigation: any) {
  const {colors} = useTheme();
  const viewMode = useSelector((state: any) => state.viewMode.value);

  if (viewMode === 'edit') {
    return null;
  }

  return (
    <View style={[styles(colors).iconContainer]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back-outline" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    iconContainer: {
      backgroundColor: colors.opaque,
      borderRadius: 50,
      paddingTop: 2,
      paddingLeft: 1,
      paddingBottom: 2,
      paddingRight: 3,
    },
  });
