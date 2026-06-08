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
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Purchases, {CustomerInfo} from 'react-native-purchases';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {supabase} from '../supabase-client';
import {User} from '@supabase/supabase-js';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSubscription} from '../hooks/useSubscription';
import {useNavigation} from '@react-navigation/native';
import {isTablet, MAX_CONTENT_WIDTH, MODAL_MAX_WIDTH} from '../hooks/useTablet';

export default function SettingsScreen() {
  const theme = useTheme() as unknown as Theme;
  const [user, setUser] = useState<User | null>(null);
  const {isPro, isLoading: isSubscriptionLoading} = useSubscription();
  const navigation = useNavigation<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: {user: currentUser},
      } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const {error} = await supabase.functions.invoke('delete-account');
      if (error) {
        throw error;
      }
      try {
        await Purchases.logOut();
      } catch (_) {}
      await supabase.auth.signOut();
      setIsDeleting(false);
      setShowDeleteModal(false);
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
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
          {isPro ? (
            <TouchableOpacity
              style={styles(theme).menuRow}
              onPress={() =>
                Linking.openURL(
                  Platform.OS === 'ios'
                    ? 'https://apps.apple.com/account/subscriptions'
                    : 'https://play.google.com/store/account/subscriptions',
                )
              }>
              <Text style={styles(theme).menuRowText}>
                Manage or Cancel Subscription
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors['toffee-400']}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles(theme).menuRow}
              onPress={() =>
                navigation.navigate('Paywall', {dismissible: true})
              }>
              <Text style={styles(theme).menuRowText}>Upgrade to Pro</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors['toffee-400']}
              />
            </TouchableOpacity>
          )}
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
        {!isSubscriptionLoading && (
          <TouchableOpacity
            style={styles(theme).deleteButton}
            onPress={() => setShowDeleteModal(true)}>
            <Text style={styles(theme).deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
      <View>
        <Text style={styles(theme).version}>v1.0.5</Text>
      </View>
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>Delete Account</Text>
            <Text style={styles(theme).modalBody}>
              This will permanently delete all your recipes and account data.
              This action cannot be undone.
              {isPro
                ? ' You have an active subscription — cancel it before deleting to avoid further charges.'
                : ''}
            </Text>
            {isDeleting ? (
              <ActivityIndicator
                size="large"
                color={theme.colors['neutral-800']}
              />
            ) : (
              <>
                <Pressable
                  style={({pressed}) => [
                    styles(theme).confirmDeleteButton,
                    pressed && {opacity: 0.5},
                  ]}
                  onPress={handleDeleteAccount}>
                  <Text style={styles(theme).confirmDeleteText}>
                    Delete My Account
                  </Text>
                </Pressable>
                <Pressable
                  style={({pressed}) => [
                    styles(theme).cancelButton,
                    pressed && {opacity: 0.5},
                  ]}
                  onPress={() => setShowDeleteModal(false)}>
                  <Text style={styles(theme).cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
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
      maxWidth: isTablet() ? MAX_CONTENT_WIDTH : undefined,
      alignSelf: 'center',
      width: '100%',
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
    deleteButton: {
      marginTop: 12,
      padding: 10,
      width: '100%',
      alignItems: 'center',
    },
    deleteButtonText: {
      color: theme.colors['toffee-400'],
      ...theme.typography.h2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: theme.colors['neutral-100'],
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: isTablet() ? MODAL_MAX_WIDTH : undefined,
    },
    modalTitle: {
      color: theme.colors['neutral-800'],
      ...theme.typography['h2-emphasized'],
      marginBottom: 12,
    },
    modalBody: {
      color: theme.colors['toffee-400'],
      ...theme.typography.h2,
      marginBottom: 24,
    },
    confirmDeleteButton: {
      backgroundColor: '#c0392b',
      padding: 12,
      borderRadius: 25,
      alignItems: 'center',
      marginBottom: 12,
    },
    confirmDeleteText: {
      color: '#ffffff',
      ...theme.typography['h2-emphasized'],
    },
    cancelButton: {
      padding: 12,
      borderRadius: 25,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
    },
    cancelText: {
      color: theme.colors['neutral-800'],
      ...theme.typography['h2-emphasized'],
    },
  });
