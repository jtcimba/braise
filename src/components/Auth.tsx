import React, {useState, useEffect} from 'react';
import {
  Alert,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
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
      data: {session},
      error,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (!session) {
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
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.subtext}]}>
          Sign in to continue
        </Text>
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, {color: theme.colors.text}]}>Email</Text>
        <TextInput
          onChangeText={(text: string) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            },
          ]}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, {color: theme.colors.text}]}>Password</Text>
        <TextInput
          onChangeText={(text: string) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          autoComplete="password"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        onPress={() => setView('reset')}
        style={styles.linkButton}>
        <Text style={[styles.linkText, {color: theme.colors.primary}]}>
          Forgot password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {backgroundColor: theme.colors.primary},
          loading && styles.buttonDisabled,
        ]}
        disabled={loading}
        onPress={signInWithEmail}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchView}>
        <Text style={[styles.switchText, {color: theme.colors.subtext}]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => setView('signup')}>
          <Text style={[styles.linkText, {color: theme.colors.primary}]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSignUp = () => (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Create Account
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.subtext}]}>
          Sign up to get started
        </Text>
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, {color: theme.colors.text}]}>Email</Text>
        <TextInput
          onChangeText={(text: string) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            },
          ]}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, {color: theme.colors.text}]}>Password</Text>
        <TextInput
          onChangeText={(text: string) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password (min. 6 characters)"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            },
          ]}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, {color: theme.colors.text}]}>
          Confirm Password
        </Text>
        <TextInput
          onChangeText={(text: string) => setConfirmPassword(text)}
          value={confirmPassword}
          secureTextEntry={true}
          placeholder="Confirm password"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {backgroundColor: theme.colors.primary},
          loading && styles.buttonDisabled,
        ]}
        disabled={loading}
        onPress={signUpWithEmail}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchView}>
        <Text style={[styles.switchText, {color: theme.colors.subtext}]}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => setView('signin')}>
          <Text style={[styles.linkText, {color: theme.colors.primary}]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderResetPassword = () => (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Reset Password
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.subtext}]}>
          Enter your email address and we'll send you a link to reset your
          password
        </Text>
      </View>

      {resetEmailSent ? (
        <View style={styles.successContainer}>
          <Text style={[styles.successText, {color: theme.colors.secondary}]}>
            Password reset email sent! Please check your inbox.
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: theme.colors.primary},
              styles.mt20,
            ]}
            onPress={() => {
              setResetEmailSent(false);
              setEmail('');
              setView('signin');
            }}>
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.verticallySpaced}>
            <Text style={[styles.label, {color: theme.colors.text}]}>
              Email
            </Text>
            <TextInput
              onChangeText={(text: string) => setEmail(text)}
              value={email}
              placeholder="email@address.com"
              placeholderTextColor={theme.colors.subtext}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: theme.colors.primary},
              loading && styles.buttonDisabled,
            ]}
            disabled={loading}
            onPress={resetPassword}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchView}>
            <TouchableOpacity onPress={() => setView('signin')}>
              <Text style={[styles.linkText, {color: theme.colors.primary}]}>
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
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Set New Password
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.subtext}]}>
          Enter your new password below
        </Text>
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, {color: theme.colors.text}]}>
          New Password
        </Text>
        <TextInput
          onChangeText={(text: string) => setNewPassword(text)}
          value={newPassword}
          secureTextEntry={true}
          placeholder="New password (min. 6 characters)"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            },
          ]}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, {color: theme.colors.text}]}>
          Confirm New Password
        </Text>
        <TextInput
          onChangeText={(text: string) => setConfirmNewPassword(text)}
          value={confirmNewPassword}
          secureTextEntry={true}
          placeholder="Confirm new password"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          autoComplete="password-new"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {backgroundColor: theme.colors.primary},
          loading && styles.buttonDisabled,
        ]}
        disabled={loading}
        onPress={updatePassword}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {view === 'signin' && renderSignIn()}
          {view === 'signup' && renderSignUp()}
          {view === 'reset' && renderResetPassword()}
          {view === 'newpassword' && renderNewPassword()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Hanken Grotesk',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Hanken Grotesk',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Hanken Grotesk',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Hanken Grotesk',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Hanken Grotesk',
  },
  linkButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Hanken Grotesk',
  },
  switchView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Hanken Grotesk',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Hanken Grotesk',
  },
  mt20: {
    marginTop: 20,
  },
});
