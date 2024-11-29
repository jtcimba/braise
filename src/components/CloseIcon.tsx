import {useTheme} from '@react-navigation/native';
import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CloseIcon(navigation: any, parentComponent: string) {
  const {colors} = useTheme();

  return (
    <View style={[styles(colors).iconContainer]}>
      <TouchableOpacity onPress={() => navigation.navigate(parentComponent)}>
        <Ionicons name="close-outline" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    iconContainer: {
      backgroundColor: colors.opaque,
      borderRadius: 48,
      padding: 2,
    },
  });
