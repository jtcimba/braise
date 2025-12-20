import 'react-native-gesture-handler';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useEffect, useRef, useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Linking} from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
  ParamListBase,
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
import {NativeModules, Platform} from 'react-native';

const {AppGroupStorage} = NativeModules;
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Store Supabase credentials in App Group for share extension
async function storeSupabaseCredentials(session: Session) {
  if (Platform.OS !== 'ios' || !AppGroupStorage) {
    return;
  }

  try {
    const supabaseURL = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const recipeImportAPIURL = process.env.RECIPE_IMPORT_API_URL;

    if (supabaseURL && supabaseAnonKey && session.access_token) {
      await AppGroupStorage.setItem('supabaseURL', supabaseURL);
      await AppGroupStorage.setItem('supabaseAnonKey', supabaseAnonKey);
      await AppGroupStorage.setItem(
        'supabaseAccessToken',
        session.access_token,
      );
      await AppGroupStorage.setItem('supabaseUserId', session.user.id);
      
      // Store API URL if provided
      if (recipeImportAPIURL) {
        await AppGroupStorage.setItem('recipeImportAPIURL', recipeImportAPIURL);
      }
      
      console.log('Stored Supabase credentials in App Group');
    }
  } catch (error) {
    console.error('Failed to store Supabase credentials:', error);
  }
}

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
            CloseIcon(navigation, 'Recipes', theme.colors.secondary),
          headerTitle: 'Add recipe',
          presentation: 'modal',
          headerShadowVisible: false,
          headerRightContainerStyle: {paddingRight: 15, paddingTop: 5},
          headerTitleStyle: {
            ...theme?.typography.h1,
            color: theme.colors.secondary,
          },
          headerStyle: {
            backgroundColor: theme.colors.secondaryLight,
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

export type AppProps = {};

export default function App({}: AppProps): React.JSX.Element {
  const navigationRef = useRef<NavigationContainerRef<ParamListBase>>(null);
  const navigationReadyRef = useRef(false);
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

    // Listen for deep links while app is running
    const linkingSubscription = Linking.addEventListener('url', ({url}) => {
      if (url.includes('reset-password')) {
        setIsRecoverySession(true);
        setResetPasswordToken('recovery');
      }
    });

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
        // Store Supabase credentials and auth token in App Group for share extension
        storeSupabaseCredentials(session);
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
      // Update Supabase credentials when session changes
      if (session) {
        storeSupabaseCredentials(session);
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

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
                      CloseIcon(navigation, 'Recipes', '#4A0B12'),
                    presentation: 'modal',
                    headerShadowVisible: false,
                    headerRightContainerStyle: {paddingRight: 15},
                    headerTitleStyle: {
                      fontFamily: 'Hanken Grotesk',
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#4A0B12',
                    },
                    headerStyle: {
                      backgroundColor: '#E1A898',
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
