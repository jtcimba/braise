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
  ActionSheetIOS,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import Purchases, {CustomerInfo} from 'react-native-purchases';
import {
  useTheme,
  useAppearance,
  AppearancePreference,
} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {supabase} from '../supabase-client';
import {User} from '@supabase/supabase-js';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSubscription} from '../hooks/useSubscription';
import {useHousehold} from '../hooks/useHousehold';
import Clipboard from '@react-native-clipboard/clipboard';
import {useNavigation} from '@react-navigation/native';
import {isTablet, MAX_CONTENT_WIDTH, MODAL_MAX_WIDTH} from '../hooks/useTablet';

const APPEARANCE_LABELS: Record<AppearancePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export default function SettingsScreen() {
  const theme = useTheme() as unknown as Theme;
  const {appearance, setAppearance} = useAppearance();
  const [user, setUser] = useState<User | null>(null);
  const {isPro, isLoading: isSubscriptionLoading} = useSubscription();
  const {
    isPrimary,
    member,
    inviteCode,
    isLoading: isHouseholdLoading,
    refresh: refreshHousehold,
  } = useHousehold();
  const navigation = useNavigation<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

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

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    try {
      const {data, error} = await supabase.functions.invoke('generate-invite');
      if (error) {
        throw error;
      }
      await refreshHousehold();
      copyCode(data.code);
    } catch {
      Alert.alert('Error', 'Failed to generate invite code. Please try again.');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleShareCode = () => {
    if (!inviteCode) {
      return;
    }
    copyCode(inviteCode);
  };

  const handleJoinHousehold = async () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      return;
    }
    setIsJoining(true);
    try {
      const {error} = await supabase.functions.invoke('accept-invite', {
        body: {code: trimmed},
      });
      if (error) {
        const message = error.message?.includes('full')
          ? 'This household is already full.'
          : error.message?.includes('already sharing')
          ? 'You are already sharing a household with someone.'
          : 'Invalid or expired invite code.';
        Alert.alert('Could not join', message);
        return;
      }
      setShowJoinModal(false);
      setJoinCode('');
      await refreshHousehold();
      Alert.alert('Joined!', 'You have joined the household.');
    } catch {
      Alert.alert('Error', 'Failed to join household. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemoveMember = () => {
    Alert.alert(
      'Remove member',
      'This will remove your household member and revoke their access to the shared grocery list.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsRemovingMember(true);
            try {
              const {error} = await supabase.functions.invoke(
                'remove-household-member',
              );
              if (error) {
                throw error;
              }
              await refreshHousehold();
            } catch {
              Alert.alert(
                'Error',
                'Failed to remove member. Please try again.',
              );
            } finally {
              setIsRemovingMember(false);
            }
          },
        },
      ],
    );
  };

  const handleAppearance = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'System', 'Light', 'Dark'],
        cancelButtonIndex: 0,
      },
      index => {
        if (index === 1) {
          setAppearance('system');
        } else if (index === 2) {
          setAppearance('light');
        } else if (index === 3) {
          setAppearance('dark');
        }
      },
    );
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
            onPress={handleAppearance}>
            <Text style={styles(theme).menuRowText}>Appearance</Text>
            <View style={styles(theme).menuRowRight}>
              <Text style={styles(theme).menuRowSubtext}>
                {APPEARANCE_LABELS[appearance]}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors['toffee-400']}
              />
            </View>
          </TouchableOpacity>
          <View style={styles(theme).menuDivider} />
          <TouchableOpacity
            style={styles(theme).menuRow}
            onPress={() => Linking.openURL('app-settings:')}>
            <Text style={styles(theme).menuRowText}>Text Size</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors['toffee-400']}
            />
          </TouchableOpacity>
        </View>
        <>
          <Text style={styles(theme).sectionTitle}>Household</Text>
          <View style={styles(theme).menuGroup}>
            {!isHouseholdLoading && isPrimary && member ? (
              <>
                <View style={styles(theme).menuRow}>
                  <Text style={styles(theme).menuRowText}>
                    {member.email ?? 'Household member'}
                  </Text>
                  <Text style={styles(theme).menuRowSubtext}>Member</Text>
                </View>
                <View style={styles(theme).menuDivider} />
                <TouchableOpacity
                  style={styles(theme).menuRow}
                  onPress={handleRemoveMember}
                  disabled={isRemovingMember}>
                  <Text style={styles(theme).removeMemberText}>
                    {isRemovingMember ? 'Removing…' : 'Remove member'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : !isHouseholdLoading && !isPrimary ? (
              <View style={styles(theme).menuRow}>
                <Text style={styles(theme).menuRowText}>Household member</Text>
                <Text style={styles(theme).menuRowSubtext}>Active</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles(theme).menuRow}
                  onPress={inviteCode ? handleShareCode : handleGenerateInvite}
                  disabled={isHouseholdLoading || isGeneratingInvite}>
                  <Text style={styles(theme).menuRowText}>
                    {isGeneratingInvite
                      ? 'Generating…'
                      : inviteCode
                      ? `Invite Code: ${inviteCode}`
                      : 'Invite household member'}
                  </Text>
                  {codeCopied ? (
                    <View style={styles(theme).copiedPill}>
                      <Text style={styles(theme).copiedPillText}>Copied</Text>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={theme.colors['neutral-800']}
                      />
                    </View>
                  ) : (
                    <Ionicons
                      name="copy-outline"
                      size={18}
                      color={theme.colors['toffee-400']}
                    />
                  )}
                </TouchableOpacity>
                {inviteCode && (
                  <>
                    <View style={styles(theme).menuDivider} />
                    <TouchableOpacity
                      style={styles(theme).menuRow}
                      onPress={handleGenerateInvite}
                      disabled={isGeneratingInvite}>
                      <Text style={styles(theme).menuRowText}>
                        Generate new code
                      </Text>
                      <Ionicons
                        name="refresh-outline"
                        size={18}
                        color={theme.colors['toffee-400']}
                      />
                    </TouchableOpacity>
                  </>
                )}
                <View style={styles(theme).menuDivider} />
                <TouchableOpacity
                  style={styles(theme).menuRow}
                  disabled={isHouseholdLoading}
                  onPress={() => setShowJoinModal(true)}>
                  <Text style={styles(theme).menuRowText}>
                    Join a household
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors['toffee-400']}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
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
        <Text style={styles(theme).version}>v1.1.0</Text>
      </View>
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowJoinModal(false);
          setJoinCode('');
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowJoinModal(false);
              setJoinCode('');
            }}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>Join a household</Text>
            <Text style={styles(theme).modalBody}>
              Enter the 6-character code shared by your household primary.
            </Text>
            <TextInput
              style={styles(theme).codeInput}
              placeholder="Enter code"
              placeholderTextColor={theme.colors['toffee-400']}
              value={joinCode}
              onChangeText={text => setJoinCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            {isJoining ? (
              <ActivityIndicator
                size="large"
                color={theme.colors['neutral-800']}
              />
            ) : (
              <>
                <Pressable
                  style={({pressed}) => [
                    styles(theme).joinButton,
                    pressed && {opacity: 0.7},
                  ]}
                  onPress={handleJoinHousehold}>
                  <Text style={styles(theme).joinButtonText}>Join</Text>
                </Pressable>
                <Pressable
                  style={({pressed}) => [
                    styles(theme).cancelButton,
                    pressed && {opacity: 0.5},
                  ]}
                  onPress={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                  }}>
                  <Text style={styles(theme).cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    sectionTitle: {
      color: theme.colors['toffee-400'],
      ...theme.typography.h4,
      alignSelf: 'flex-start',
      marginBottom: 8,
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
    menuRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    menuRowSubtext: {
      color: theme.colors['toffee-400'],
      ...theme.typography.h4,
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
      marginBottom: 16,
    },
    codeInput: {
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 24,
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
      textAlign: 'center',
      letterSpacing: 4,
    },
    joinButton: {
      backgroundColor: theme.colors['yellow-400'],
      padding: 12,
      borderRadius: 25,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    joinButtonText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['on-yellow'],
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
    copiedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    copiedPillText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
      lineHeight: 18,
    },
    removeMemberText: {
      ...theme.typography.h2,
      color: '#c0392b',
    },
  });
