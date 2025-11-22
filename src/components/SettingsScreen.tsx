import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  SafeAreaView,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {supabase} from '../supabase-client';

export default function SettingsScreen() {
  const {colors} = useTheme() as unknown as Theme;
  const [email, setEmail] = useState<string | undefined>('');

  useEffect(() => {
    const getUser = async () => {
      const user = await supabase.auth.getUser().then(({data: {user}}) => user);
      if (user) {
        setEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
      borderRadius: 8,
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
