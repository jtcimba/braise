import 'react-native-gesture-handler';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
  ParamListBase,
  CommonActions,
} from '@react-navigation/native';
import RecipesScreen from './src/components/RecipesScreen';
import SettingsScreen from './src/components/SettingsScreen';
import AddScreen from './src/components/AddScreen';
import {createStackNavigator} from '@react-navigation/stack';
import RecipeDetailsScreen from './src/components/RecipeDetailsScreen';
import GroceryListScreen from './src/components/GroceryListScreen';
import TabBarIcon from './src/components/TabBarIcon';
import SettingsIcon from './src/components/SettingsIcon';
import BackIcon from './src/components/BackIcon';
import CloseIcon from './src/components/CloseIcon';
import DetailsMenuHeader from './src/components/DetailsMenuHeader';
import AddFromBrowserScreen from './src/components/AddFromBrowserScreen';
import {ThemeProvider} from './theme/ThemeProvider';
import {LightTheme} from './theme/theme';
import {useTheme} from './theme/ThemeProvider';
import {GroceryListModalProvider} from './src/context/GroceryListModalContext';
import {Theme} from './theme/types';
import {
  OnboardingProvider,
  useOnboarding,
} from './src/context/OnboardingContext';
import OnboardingModal from './src/components/OnboardingModal';
import {supabase} from './src/supabase-client';
import {Session} from '@supabase/supabase-js';
import Auth from './src/components/Auth';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AddComponent() {
  return null;
}

function AddStackNavigator() {
  const theme = useTheme() as unknown as Theme;
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddScreen"
        component={AddScreen}
        options={({navigation}) => ({
          headerLeft: () => null,
          headerRight: () =>
            CloseIcon(navigation, 'Recipes', theme.colors.text),
          headerTitle: 'Add recipe',
          presentation: 'modal',
          headerShadowVisible: false,
          headerRightContainerStyle: {paddingRight: 15, paddingTop: 5},
          headerTitleStyle: {
            ...theme?.typography.h1,
            color: theme.colors.text,
          },
          headerStyle: {
            backgroundColor: theme.colors.card,
          },
        })}
      />
      <Stack.Screen
        name="AddFromBrowser"
        component={AddFromBrowserScreen}
        options={({navigation}) => ({
          headerTitle: 'Add from Browser',
          headerLeft: () => BackIcon(navigation, null, theme.colors.text),
          headerLeftContainerStyle: {paddingLeft: 15, paddingTop: 5},
          headerRight: () =>
            CloseIcon(navigation, 'Recipes', theme.colors.text),
          headerShadowVisible: false,
          headerRightContainerStyle: {paddingRight: 15, paddingTop: 5},
          headerTitleStyle: {
            ...theme.typography.h1,
            color: theme.colors.text,
          },
          headerStyle: {
            backgroundColor: theme.colors.card,
          },
        })}
      />
    </Stack.Navigator>
  );
}

function TabNavigator({navigation}: {navigation: any}) {
  const theme = useTheme() as unknown as Theme;
  const {showOnboardingModal, completeOnboarding} = useOnboarding();

  return (
    <>
      <Tab.Navigator
        screenOptions={({route}) => ({
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({color, size}) => {
            return (
              <TabBarIcon
                name={route.name}
                color={color}
                size={size}
                onPressFunction={() => navigation.navigate(route.name)}
              />
            );
          },
          tabBarActiveTintColor: '#323232',
          tabBarInactiveTintColor: 'gray',
          tabBarShowLabel: false,
        })}>
        <Tab.Screen
          name="Recipes"
          component={RecipesScreen}
          options={{
            headerTitleAlign: 'left',
            headerRight: () => SettingsIcon(navigation),
            headerRightContainerStyle: {paddingRight: 15},
            headerShadowVisible: false,
            headerTitleStyle: {
              ...theme?.typography.h1,
              color: theme.colors.text,
            },
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddComponent}
          listeners={() => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('Add');
              navigation.removeListener('tabPress');
            },
          })}
        />
        <Tab.Screen
          name="Grocery List"
          component={GroceryListScreen}
          options={{
            headerTitleAlign: 'left',
            headerShadowVisible: false,
          }}
        />
      </Tab.Navigator>

      <OnboardingModal
        visible={showOnboardingModal}
        onClose={completeOnboarding}
      />
    </>
  );
}

export type DeepLinkEvent = {url: string};

type AppProps = {
  pendingDeepLink?: DeepLinkEvent | null;
  onConsumeDeepLink?: () => void;
};

export default function App({
  pendingDeepLink,
  onConsumeDeepLink,
}: AppProps): React.JSX.Element {
  const navigationRef = useRef<NavigationContainerRef<ParamListBase>>(null);
  const navigationReadyRef = useRef(false);
  const pendingDeepLinkRef = useRef<DeepLinkEvent | null>(null);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(
    null,
  );
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => {
    const checkInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl?.includes('reset-password')) {
        setIsRecoverySession(true);
        setResetPasswordToken('recovery');
      }
    };
    checkInitialURL();

    supabase.auth.getSession().then(({data: {session}}) => {
      setAuthSession(session);
      setIsLoadingSession(false);
      if (session) {
        Linking.getInitialURL().then(url => {
          if (url?.includes('reset-password')) {
            setIsRecoverySession(true);
            setResetPasswordToken('recovery');
          }
        });
      }
    });
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthSession(session);
      setIsLoadingSession(false);
      if (event === 'PASSWORD_RECOVERY') {
        setResetPasswordToken('recovery');
        setIsRecoverySession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const processDeepLink = useCallback(
    async (event: DeepLinkEvent) => {
      const url = event?.url;
      if (!url) {
        return;
      }

      try {
        if (url.includes('reset-password')) {
          setIsRecoverySession(true);
          setResetPasswordToken('recovery');

          try {
            const urlForParsing = url.replace('#', '?');
            const urlObj = new URL(
              urlForParsing.replace('braise://', 'https://'),
            );
            const accessToken = urlObj.searchParams.get('access_token');
            const refreshToken = urlObj.searchParams.get('refresh_token');
            const type = urlObj.searchParams.get('type');

            if (accessToken && refreshToken && type === 'recovery') {
              const {error: sessionError} = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                Alert.alert('Error', 'Invalid or expired reset link');
              }
            } else {
              const code = urlObj.searchParams.get('code');
              if (code) {
                const {error: exchangeError} =
                  await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                  Alert.alert('Error', 'Invalid or expired reset link');
                }
              }
            }
          } catch (parseError) {
            // Continue - might still work with server-side verification
          }

          onConsumeDeepLink?.();
          return;
        }

        const match = url.match(/braise:\/\/import\?data=(.*)/);
        if (match && match[1]) {
          const encodedData = match[1];
          const decoded = decodeURIComponent(encodedData);
          const recipe = JSON.parse(decoded);

          const state = navigationRef.current?.getState();
          const currentRoute = state?.routes[state.index || 0];
          const isAlreadyOnDetailsScreen =
            currentRoute?.name === 'RecipeDetailsScreen';

          if (isAlreadyOnDetailsScreen && state) {
            // Go back first to remove the old RecipeDetailsScreen from stack
            // Then navigate to the new one to prevent duplicate instances
            navigationRef.current?.dispatch(CommonActions.goBack());
            // Use requestAnimationFrame to ensure goBack completes before navigate
            requestAnimationFrame(() => {
              navigationRef.current?.dispatch(
                CommonActions.navigate({
                  name: 'RecipeDetailsScreen',
                  params: {
                    item: {
                      ...recipe,
                    },
                    shouldAutoSave: true,
                  },
                  key: `RecipeDetailsScreen-${Date.now()}`,
                }),
              );
            });
          } else {
            // Navigate normally if not already on RecipeDetailsScreen
            navigationRef.current?.dispatch(
              CommonActions.navigate({
                name: 'RecipeDetailsScreen',
                params: {
                  item: {
                    ...recipe,
                  },
                  shouldAutoSave: true,
                },
                key: `RecipeDetailsScreen-${Date.now()}`,
              }),
            );
          }
          onConsumeDeepLink?.();
        }
      } catch (err) {
        // Silently fail for deep link parsing errors
      }
    },
    [onConsumeDeepLink],
  );

  useEffect(() => {
    if (!pendingDeepLink) {
      return;
    }

    const url = pendingDeepLink?.url;
    if (url?.includes('reset-password')) {
      processDeepLink(pendingDeepLink);
      onConsumeDeepLink?.();
      return;
    }

    if (!navigationReadyRef.current || !navigationRef.current) {
      pendingDeepLinkRef.current = pendingDeepLink;
      return;
    }

    processDeepLink(pendingDeepLink);
    onConsumeDeepLink?.();
  }, [pendingDeepLink, onConsumeDeepLink, processDeepLink]);

  return (
    <ThemeProvider theme={LightTheme}>
      {isLoadingSession ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.colors.primary} />
        </View>
      ) : authSession?.user && !isRecoverySession ? (
        <OnboardingProvider>
          <GroceryListModalProvider>
            <NavigationContainer
              theme={LightTheme}
              ref={navigationRef}
              onReady={() => {
                navigationReadyRef.current = true;
                if (pendingDeepLinkRef.current) {
                  const deepLink = pendingDeepLinkRef.current;
                  pendingDeepLinkRef.current = null;
                  processDeepLink(deepLink);
                  onConsumeDeepLink?.();
                }
              }}>
              <Stack.Navigator>
                <Stack.Screen
                  name="Home"
                  component={TabNavigator}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="RecipeDetailsScreen"
                  component={RecipeDetailsScreen}
                  options={({navigation}) => ({
                    headerTransparent: true,
                    headerShadowVisible: false,
                    headerTitle: '',
                    headerLeft: () =>
                      BackIcon(navigation, 'RecipeDetailsScreen'),
                    headerLeftContainerStyle: {
                      paddingLeft: 15,
                      marginBottom: 10,
                    },
                    headerRight: () => (
                      <DetailsMenuHeader navigation={navigation} />
                    ),
                    headerRightContainerStyle: {
                      paddingRight: 15,
                      marginBottom: 10,
                    },
                  })}
                />
                <Stack.Screen
                  name="Add"
                  component={AddStackNavigator}
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={({navigation}) => ({
                    headerTitle: 'Settings',
                    headerLeft: () => null,
                    headerRight: () =>
                      CloseIcon(navigation, 'Recipes', '#2D2D2D'),
                    presentation: 'modal',
                    headerShadowVisible: false,
                    headerRightContainerStyle: {paddingRight: 15},
                    headerTitleStyle: {
                      fontFamily: 'Satoshi Variable',
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#2d2d2d',
                    },
                  })}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </GroceryListModalProvider>
        </OnboardingProvider>
      ) : (
        <Auth
          resetPasswordToken={resetPasswordToken}
          onPasswordResetComplete={() => {
            setResetPasswordToken(null);
            setIsRecoverySession(false);
          }}
        />
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.colors.background,
  },
});
