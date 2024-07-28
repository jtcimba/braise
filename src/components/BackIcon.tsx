import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function BackIcon(navigation: any) {
  return (
    <View style={[styles.iconContainer]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back-outline" size={22} color="gray" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    backgroundColor: '#EBE9E5',
    borderRadius: 50,
    paddingTop: 2,
    paddingLeft: 1,
    paddingBottom: 2,
    paddingRight: 3,
  },
});
