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
import {User} from '@supabase/supabase-js';

export default function SettingsScreen() {
  const theme = useTheme() as unknown as Theme;
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatDate = (date: string | undefined) => {
    if (!date) {
      return null;
    }
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles(theme).container}>
      <SafeAreaView style={styles(theme).settings}>
        <View style={styles(theme).userInfo}>
          <Text style={styles(theme).email}>{user?.email}</Text>
          <Text style={styles(theme).memberSince}>
            Member since {formatDate(user?.created_at)}
          </Text>
        </View>
        <TouchableHighlight
          onPress={handleSignOut}
          style={styles(theme).signOutButton}>
          <Text style={styles(theme).signOutText}>Sign Out</Text>
        </TouchableHighlight>
      </SafeAreaView>
      <View>
        <Text style={styles(theme).version}>v1.0</Text>
      </View>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    userInfo: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      width: '100%',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      padding: 20,
      marginBottom: 20,
    },
    container: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors['neutral-100'],
      paddingHorizontal: 20,
    },
    settings: {
      flex: 1,
      alignItems: 'center',
      width: '100%',
    },
    version: {
      color: theme.colors['neutral-400'],
      ...theme.typography.h4,
      paddingBottom: 20,
    },
    email: {
      color: theme.colors['neutral-800'],
      ...theme.typography['h2-emphasized'],
      marginBottom: 20,
    },
    memberSince: {
      color: theme.colors['neutral-400'],
      ...theme.typography.h4,
    },
    signOutText: {
      color: theme.colors['neutral-100'],
      ...theme.typography['h2-emphasized'],
    },
    signOutButton: {
      backgroundColor: theme.colors['neutral-800'],
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
