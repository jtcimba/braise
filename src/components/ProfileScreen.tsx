import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, TouchableHighlight} from 'react-native';
import {signOut, getCurrentUser, AuthUser} from 'aws-amplify/auth';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | undefined>('');

  useEffect(() => {
    getCurrentUser()
      .then((userInfo: AuthUser | undefined) => {
        if (userInfo?.signInDetails) {
          setEmail(userInfo.signInDetails.loginId);
        }
      })
      .catch(error => {
        console.log('error getting user info: ', error);
      });
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('error signing out: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.profile}>
        <Text style={styles.email}>{email}</Text>
        <TouchableHighlight
          onPress={handleSignOut}
          style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableHighlight>
      </SafeAreaView>
      <View>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#303030',
  },
  profile: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  version: {
    color: 'gray',
  },
  email: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    marginTop: 20,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#D95931',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
});
