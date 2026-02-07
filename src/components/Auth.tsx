import React, {useState, useEffect} from 'react';
import {
  Alert,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {braiseLogoSvg} from '../assets/images/braiseLogoSvg';
import {supabase} from '../supabase-client';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

type AuthView = 'signin' | 'signup' | 'reset' | 'newpassword';

type AuthProps = {
  resetPasswordToken?: string | null;
  onPasswordResetComplete?: () => void;
};

export default function Auth({
  resetPasswordToken,
  onPasswordResetComplete,
}: AuthProps = {}) {
  const theme = useTheme() as unknown as Theme;
  const screenHeight = Dimensions.get('window').height;
  const paddingTop = Math.max(40, screenHeight * 0.07);
  const paddingBottom = Math.max(80, screenHeight * 0.15);
  const [view, setView] = useState<AuthView>(
    resetPasswordToken ? 'newpassword' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (resetPasswordToken) {
      setView('newpassword');
    } else if (view === 'newpassword' && !resetPasswordToken) {
      setView('signin');
    }
  }, [resetPasswordToken, view]);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validatePassword = (passwordValue: string): boolean => {
    return passwordValue.length >= 6;
  };

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const {error} = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      Alert.alert('Sign In Error', error.message);
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const {
      data: {session, user},
      error,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
      setLoading(false);
      return;
    }

    if (user) {
      const {error: insertError} = await supabase.from('users').insert({
        user_id: user.id,
        email: user.email,
      });

      if (insertError) {
        console.error('Error creating user record:', insertError);
      }
    }

    if (!session) {
      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox for email verification!',
      );
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setView('signin');
    }
    setLoading(false);
  }

  async function resetPassword() {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const {error} = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'braise://reset-password',
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setResetEmailSent(true);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your inbox for password reset instructions.',
      );
    }
    setLoading(false);
  }

  async function updatePassword() {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    let session = null;
    const maxWaitTime = 5000;
    const startTime = Date.now();

    while (!session && Date.now() - startTime < maxWaitTime) {
      const {
        data: {session: currentSession},
      } = await supabase.auth.getSession();
      session = currentSession;

      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!session) {
      Alert.alert(
        'Session Error',
        'Unable to verify your session. The password reset link may have expired. Please request a new password reset link.',
      );
      setLoading(false);
      return;
    }

    const {error} = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      handlePasswordUpdateSuccess();
    }
  }

  const handlePasswordUpdateSuccess = () => {
    Alert.alert(
      'Password Updated',
      'Your password has been successfully updated. You can now sign in with your new password.',
      [
        {
          text: 'OK',
          onPress: () => {
            setNewPassword('');
            setConfirmNewPassword('');
            setView('signin');
            onPasswordResetComplete?.();
          },
        },
      ],
    );
    setLoading(false);
  };

  const renderSignIn = () => (
    <>
      <View style={styles(theme).header}>
        <SvgXml
          xml={braiseLogoSvg}
          width={150}
          height={75}
          style={styles(theme).logo}
        />
      </View>

      <View style={styles(theme).verticallySpaced}>
        <Text style={[styles(theme).label, {color: theme.colors.text}]}>
          Email
        </Text>
        <TextInput
          onChangeText={(text: string) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={theme.colors['neutral-400']}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={[
            styles(theme).input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors['neutral-100'],
            },
          ]}
        />
      </View>

      <View style={styles(theme).verticallySpaced}>
        <View style={styles(theme).passwordContainer}>
          <Text style={[styles(theme).label, {color: theme.colors.text}]}>
            Password
          </Text>
          <TouchableOpacity
            onPress={() => setView('reset')}
            style={styles(theme).linkButton}>
            <Text
              style={[
                styles(theme).linkText,
                {color: theme.colors['neutral-400']},
              ]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          onChangeText={(text: string) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor={theme.colors['neutral-400']}
          autoCapitalize="none"
          autoComplete="password"
          style={[
            styles(theme).input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors['neutral-100'],
            },
          ]}
        />
      </View>
      <TouchableOpacity
        style={[
          styles(theme).button,
          loading && styles(theme).buttonDisabled,
          {backgroundColor: theme.colors['neutral-800']},
        ]}
        disabled={loading}
        onPress={signInWithEmail}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles(theme).buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={styles(theme).switchView}>
        <Text style={[styles(theme).switchText, {color: theme.colors.subtext}]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => setView('signup')}>
          <Text
            style={[styles(theme).linkText, {color: theme.colors['rust-600']}]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSignUp = () => (
    <>
      <View style={styles(theme).header}>
        <Text style={[styles(theme).title, {color: theme.colors.text}]}>
          Create Account
        </Text>
        <Text style={[styles(theme).subtitle, {color: theme.colors.subtext}]}>
          Sign up to get started
        </Text>
      </View>

      <View style={styles(theme).verticallySpaced}>
        <Text style={[styles(theme).label, {color: theme.colors.text}]}>
          Email
        </Text>
        <TextInput
          onChangeText={(text: string) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={theme.colors['neutral-400']}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={[
            styles(theme).input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors['neutral-100'],
            },
          ]}
        />
      </View>

      <View style={styles(theme).verticallySpaced}>
        <Text style={[styles(theme).label, {color: theme.colors.text}]}>
          Password
        </Text>
        <TextInput
          onChangeText={(text: string) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password (min. 6 characters)"
          placeholderTextColor={theme.colors['neutral-400']}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles(theme).input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors['neutral-100'],
            },
          ]}
        />
      </View>

      <View style={styles(theme).verticallySpaced}>
        <Text style={[styles(theme).label, {color: theme.colors.text}]}>
          Confirm Password
        </Text>
        <TextInput
          onChangeText={(text: string) => setConfirmPassword(text)}
          value={confirmPassword}
          secureTextEntry={true}
          placeholder="Confirm password"
          placeholderTextColor={theme.colors['neutral-400']}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles(theme).input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors['neutral-100'],
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[
          styles(theme).button,
          {backgroundColor: theme.colors['rust-600']},
          loading && styles(theme).buttonDisabled,
        ]}
        disabled={loading}
        onPress={signUpWithEmail}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles(theme).buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <View style={styles(theme).switchView}>
        <Text style={[styles(theme).switchText, {color: theme.colors.subtext}]}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => setView('signin')}>
          <Text
            style={[styles(theme).linkText, {color: theme.colors['rust-600']}]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderResetPassword = () => (
    <>
      <View style={styles(theme).header}>
        <Text style={[styles(theme).title, {color: theme.colors.text}]}>
          Reset Password
        </Text>
        <Text style={[styles(theme).subtitle, {color: theme.colors.subtext}]}>
          Enter your email address and we'll send you a link to reset your
          password
        </Text>
      </View>

      {resetEmailSent ? (
        <View style={styles(theme).successContainer}>
          <Text
            style={[
              styles(theme).successText,
              {color: theme.colors['rust-600']},
            ]}>
            Password reset email sent! Please check your inbox.
          </Text>
          <TouchableOpacity
            style={[
              styles(theme).button,
              {backgroundColor: theme.colors['rust-600']},
              styles(theme).mt20,
            ]}
            onPress={() => {
              setResetEmailSent(false);
              setEmail('');
              setView('signin');
            }}>
            <Text style={styles(theme).buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles(theme).verticallySpaced}>
            <Text style={[styles(theme).label, {color: theme.colors.text}]}>
              Email
            </Text>
            <TextInput
              onChangeText={(text: string) => setEmail(text)}
              value={email}
              placeholder="email@address.com"
              placeholderTextColor={theme.colors['neutral-400']}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={[
                styles(theme).input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors['neutral-100'],
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles(theme).button,
              {backgroundColor: theme.colors['rust-600']},
              loading && styles(theme).buttonDisabled,
            ]}
            disabled={loading}
            onPress={resetPassword}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles(theme).buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <View style={styles(theme).switchView}>
            <TouchableOpacity onPress={() => setView('signin')}>
              <Text
                style={[
                  styles(theme).linkText,
                  {color: theme.colors['rust-600']},
                ]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );

  const renderNewPassword = () => (
    <>
      <View style={styles(theme).header}>
        <Text style={[styles(theme).title, {color: theme.colors.text}]}>
          Set New Password
        </Text>
        <Text style={[styles(theme).subtitle, {color: theme.colors.subtext}]}>
          Enter your new password below
        </Text>
      </View>

      <View style={styles(theme).verticallySpaced}>
        <Text style={[styles(theme).label, {color: theme.colors.text}]}>
          New Password
        </Text>
        <TextInput
          onChangeText={(text: string) => setNewPassword(text)}
          value={newPassword}
          secureTextEntry={true}
          placeholder="New password (min. 6 characters)"
          placeholderTextColor={theme.colors['neutral-400']}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles(theme).input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors['neutral-100'],
            },
          ]}
        />
      </View>

      <View style={styles(theme).verticallySpaced}>
        <Text style={[styles(theme).label, {color: theme.colors.text}]}>
          Confirm New Password
        </Text>
        <TextInput
          onChangeText={(text: string) => setConfirmNewPassword(text)}
          value={confirmNewPassword}
          secureTextEntry={true}
          placeholder="Confirm new password"
          placeholderTextColor={theme.colors['neutral-400']}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles(theme).input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors['neutral-100'],
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[styles(theme).button, loading && styles(theme).buttonDisabled]}
        disabled={loading}
        onPress={updatePassword}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles(theme).buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles(theme).container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[styles(theme).scrollContent, {paddingTop, paddingBottom}]}>
          <View style={styles(theme).content}>
            {view === 'signin' && renderSignIn()}
            {view === 'signup' && renderSignUp()}
            {view === 'reset' && renderResetPassword()}
            {view === 'newpassword' && renderNewPassword()}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      padding: 24,
      maxWidth: 400,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      marginBottom: 16,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
      ...theme.typography.h1,
    },
    logo: {
      width: 200,
      height: 100,
      marginBottom: 8,
    },
    subtitle: {
      ...theme.typography.h3,
      textAlign: 'center',
    },
    verticallySpaced: {
      paddingTop: 4,
      paddingBottom: 4,
      alignSelf: 'stretch',
      marginBottom: 16,
    },
    label: {
      ...theme.typography.h3,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 14,
      ...theme.typography.h3,
    },
    button: {
      backgroundColor: theme.colors['neutral-800'],
      padding: 16,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      minHeight: 50,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: theme.colors['neutral-100'],
      ...theme.typography['h2-emphasized'],
    },
    linkButton: {
      marginBottom: 8,
    },
    linkText: {
      ...theme.typography.h4,
    },
    switchView: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
    },
    switchText: {
      ...theme.typography.h4,
    },
    successContainer: {
      alignItems: 'center',
      padding: 20,
    },
    successText: {
      ...theme.typography.h3,
      textAlign: 'center',
      marginBottom: 16,
    },
    mt20: {
      marginTop: 20,
    },
    passwordContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
