import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <Text>Comming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
