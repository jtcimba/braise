import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  SafeAreaView,
  Alert,
} from 'react-native';
import {signOut} from 'aws-amplify/auth';
import {AuthService} from '../api';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

export default function SettingsScreen() {
  const {colors} = useTheme() as unknown as Theme;
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
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  return (
    <View style={styles(colors).container}>
      <SafeAreaView style={styles(colors).settings}>
        <Text style={styles(colors).email}>{email}</Text>
        <TouchableHighlight
          onPress={handleSignOut}
          style={styles(colors).signOutButton}>
          <Text style={styles(colors).signOutText}>Sign Out</Text>
        </TouchableHighlight>
      </SafeAreaView>
      <View>
        <Text style={styles(colors).version}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    settings: {
      flex: 1,
      alignItems: 'center',
      width: '100%',
    },
    version: {
      color: colors.subtext,
    },
    email: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 20,
      marginTop: 20,
    },
    signOutText: {
      color: 'white',
      fontSize: 16,
    },
    signOutButton: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 25,
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
