import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  SafeAreaView,
} from 'react-native';
import {signOut} from 'aws-amplify/auth';
import {AuthService} from '../api';

export default function SettingsScreen() {
  const [email, setEmail] = useState<string | undefined>('');

  useEffect(() => {
    const getUser = async () => {
      const user = await AuthService.getUser();
      if (user) {
        setEmail(user.signInDetails?.loginId);
      }
    };
    getUser();
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
      <SafeAreaView style={styles.settings}>
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
    backgroundColor: '#EBE9E5',
    paddingHorizontal: 20,
  },
  settings: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  version: {
    color: 'gray',
  },
  email: {
    color: 'black',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
});
