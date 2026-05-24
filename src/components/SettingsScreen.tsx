import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import Purchases, {CustomerInfo} from 'react-native-purchases';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {supabase} from '../supabase-client';
import {User} from '@supabase/supabase-js';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

  const handleRestore = async () => {
    try {
      const customerInfo: CustomerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active.pro) {
        Alert.alert('Success', 'Your purchases have been restored.');
      } else {
        Alert.alert(
          'No purchases found',
          'We could not find any previous purchases to restore.',
        );
      }
    } catch (error) {
      Alert.alert('Restore failed', 'Please try again later.');
    }
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
        <View style={styles(theme).menuGroup}>
          <TouchableOpacity
            style={styles(theme).menuRow}
            onPress={() =>
              Linking.openURL('https://apps.apple.com/account/subscriptions')
            }>
            <Text style={styles(theme).menuRowText}>Manage Subscription</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors['toffee-400']}
            />
          </TouchableOpacity>
          <View style={styles(theme).menuDivider} />
          <TouchableOpacity
            style={styles(theme).menuRow}
            onPress={handleRestore}>
            <Text style={styles(theme).menuRowText}>Restore Purchases</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors['toffee-400']}
            />
          </TouchableOpacity>
        </View>
        <Pressable
          onPress={handleSignOut}
          style={({pressed}) => [
            styles(theme).signOutButton,
            pressed && {backgroundColor: theme.colors['yellow-400']},
          ]}>
          <Text style={styles(theme).signOutText}>Sign Out</Text>
        </Pressable>
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
      color: theme.colors['toffee-400'],
      ...theme.typography.h4,
      paddingBottom: 20,
    },
    email: {
      color: theme.colors['neutral-800'],
      ...theme.typography['h2-emphasized'],
      marginBottom: 20,
    },
    memberSince: {
      color: theme.colors['toffee-400'],
      ...theme.typography.h4,
    },
    menuGroup: {
      width: '100%',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      marginBottom: 20,
    },
    menuRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    menuRowText: {
      color: theme.colors['neutral-800'],
      ...theme.typography.h2,
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.colors['neutral-300'],
      marginHorizontal: 20,
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
