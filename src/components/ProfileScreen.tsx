import React from 'react';
import {Button, View, StyleSheet} from 'react-native';
import {signOut} from 'aws-amplify/auth';

export default function ProfileScreen() {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('error signing out: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Sign Out" onPress={handleSignOut} />
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
