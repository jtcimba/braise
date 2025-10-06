import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CloseIcon(
  navigation: any,
  parentComponent: string,
  color: string = '#F6F6F4',
) {
  return (
    <View style={[styles().iconContainer]}>
      <TouchableOpacity onPress={() => navigation.navigate(parentComponent)}>
        <Ionicons name="close-outline" size={27} color={color} />
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
