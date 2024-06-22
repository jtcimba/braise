import React from 'react';
import {StyleSheet, View, Text} from 'react-native';

export default function AddScreen() {
  return (
    <View style={styles.content}>
      <Text style={styles.contentTitle}>Add recipe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#EBE9E5',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
  },
  contentTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  contentView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});
