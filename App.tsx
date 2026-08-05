import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createDrawerNavigator} from '@react-navigation/drawer';
import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Linking, AppState, Alert} from 'react-native';
import BraiseLogoDark from './src/assets/images/braise-logo-dark.svg';
import {
  NavigationContainer,
  NavigationContainerRef,
  ParamListBase,
} from '@react-navigation/native';
import RecipesScreen from './src/components/RecipesScreen';
import SettingsScreen from './src/components/SettingsScreen';
import {createStackNavigator} from '@react-navigation/stack';
import RecipeDetailsScreen from './src/components/RecipeDetailsScreen';
import GroceryListScreen from './src/components/GroceryListScreen';
import TabBarIcon from './src/components/TabBarIcon';
import SettingsIcon from './src/components/SettingsIcon';
import BackIcon from './src/components/BackIcon';
import CloseIcon from './src/components/CloseIcon';
import DetailsMenuHeader from './src/components/DetailsMenuHeader';
import AddModal from './src/components/AddModal';
import CollectionsDrawer from './src/components/CollectionsDrawer';
import PaywallScreen from './src/components/PaywallScreen';
import {CollectionsProvider} from './src/context/CollectionsContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme, useAppearance} from './theme/ThemeProvider';
import {LightTheme, DarkTheme} from './theme/theme';
import {GroceryListModalProvider} from './src/context/GroceryListModalContext';
import {AddToCollectionModalProvider} from './src/context/AddToCollectionModalContext';
import {Theme} from './theme/types';
import {supabase} from './src/supabase-client';
import {Session} from '@supabase/supabase-js';
import Auth from './src/components/Auth';
import {NativeModules, Platform, DeviceEventEmitter} from 'react-native';
import Purchases, {
  LOG_LEVEL,
  CustomerInfoUpdateListener,
} from 'react-native-purchases';
import {useSubscription} from './src/hooks/useSubscription';
import {isTablet, useHeaderStatusBarHeight} from './src/hooks/useTablet';
import store from './src/redux/store';
import {changeViewMode} from './src/redux/slices/viewModeSlice';
import {recipeService, ingredientRowsFromText} from './src/services';

const {AppGroupStorage} = NativeModules;
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Store Supabase credentials in App Group for share extension
async function storeSupabaseCredentials(session: Session): Promise<void> {
  try {
    await Purchases.logIn(session.user.id);
  } catch (error) {
    console.error('Failed to log in to RevenueCat:', error);
  }

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

      // Write isPro for share extension subscription gate
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = !!customerInfo.entitlements.active.pro;
        await AppGroupStorage.setItem('isPro', String(isPro));
      } catch {
        // Non-fatal — share extension will default to no access
      }

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

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <BraiseLogoDark width={160} height={160} />
    </View>
  );
}

function TabNavigator({navigation}: {navigation: any}) {
  const theme = useTheme() as unknown as Theme;
  const {isPro, isLoading: isSubscriptionLoading} = useSubscription();
  const headerStatusBarHeight = useHeaderStatusBarHeight();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const openAddModal = () => {
    if (!isSubscriptionLoading && !isPro) {
      navigation.navigate('Paywall', {dismissible: true});
      return;
    }
    setIsAddModalVisible(true);
  };
  const closeAddModal = () => setIsAddModalVisible(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({color, size}) => {
            return (
              <TabBarIcon
                name={route.name}
                color={color}
                size={size}
                onPressFunction={() => {
                  if (route.name === 'Add') {
                    openAddModal();
                    return;
                  }
                  navigation.navigate(route.name);
                }}
              />
            );
          },
          tabBarActiveTintColor: theme.colors['neutral-800'],
          tabBarInactiveTintColor: theme.colors['toffee-400'],
          tabBarShowLabel: false,
          tabBarStyle: isTablet()
            ? {height: 90, maxWidth: 600, alignSelf: 'center', width: '100%'}
            : undefined,
        })}>
        <Tab.Screen
          name="Recipes"
          component={RecipesScreen as React.ComponentType<any>}
          options={{
            headerTitleAlign: 'left',
            headerRight: () => SettingsIcon(navigation),
            headerRightContainerStyle: {paddingRight: 15},
            headerShadowVisible: false,
            headerStatusBarHeight,
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddComponent}
          listeners={() => ({
            tabPress: e => {
              e.preventDefault();
              openAddModal();
            },
          })}
        />
        <Tab.Screen
          name="Grocery List"
          component={GroceryListScreen}
          options={{
            headerTitleAlign: 'left',
            headerShadowVisible: false,
            headerStatusBarHeight,
            headerTitleStyle: {
              ...theme?.typography.h1,
              color: theme.colors['neutral-800'],
            },
          }}
        />
      </Tab.Navigator>

      <AddModal visible={isAddModalVisible} onClose={closeAddModal} />
    </>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={CollectionsDrawer}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.3)',
        drawerStyle: {width: 280},
      }}>
      <Drawer.Screen name="Main" component={TabNavigator} />
    </Drawer.Navigator>
  );
}

function NavigationStack({
  navigationRef,
  navigationReadyRef,
}: {
  navigationRef: React.RefObject<NavigationContainerRef<ParamListBase>>;
  navigationReadyRef: React.MutableRefObject<boolean>;
}) {
  const headerStatusBarHeight = useHeaderStatusBarHeight();
  const {isDark} = useAppearance();
  const navTheme = isDark ? DarkTheme : LightTheme;

  return (
    <NavigationContainer
      theme={navTheme}
      ref={navigationRef}
      onReady={() => {
        navigationReadyRef.current = true;
      }}>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={DrawerNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="RecipeDetailsScreen"
          component={RecipeDetailsScreen}
          options={({navigation: nav}) => ({
            headerTransparent: true,
            headerShadowVisible: false,
            headerStatusBarHeight,
            headerTitle: () => null,
            headerLeft: () =>
              BackIcon(
                nav,
                'RecipeDetailsScreen',
                navTheme.colors['neutral-800'],
              ),
            headerLeftContainerStyle: {
              paddingLeft: 5,
              marginBottom: 10,
            },
            headerRight: () => <DetailsMenuHeader navigation={nav} />,
            headerRightContainerStyle: {
              paddingRight: 10,
              marginBottom: 10,
            },
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={({navigation: nav}) => ({
            headerTitle: 'Settings',
            headerLeft: () => null,
            headerRight: () =>
              CloseIcon(nav, 'Recipes', navTheme.colors['neutral-800']),
            presentation: 'modal',
            headerShadowVisible: false,
            headerRightContainerStyle: {paddingRight: 10},
            headerTitleStyle: {
              fontFamily: 'TAYTommyTokyoRegular',
              fontSize: 22,
              fontWeight: '600',
              color: navTheme.colors['neutral-800'],
            },
            headerStyle: {
              backgroundColor: navTheme.colors['neutral-100'],
            },
          })}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={({route}: {route: any}) => ({
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: route.params?.dismissible !== false,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
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
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({apiKey: process.env.REVENUECAT_API_KEY!});

    const handleResetPasswordUrl = async (url: string) => {
      if (!url.includes('reset-password')) {
        return;
      }
      setIsRecoverySession(true);
      setResetPasswordToken('recovery');

      // Extract tokens from URL hash (implicit flow) and establish Supabase
      // recovery session so onAuthStateChange fires PASSWORD_RECOVERY
      const hash = url.split('#')[1] ?? '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    };

    const checkInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleResetPasswordUrl(initialUrl);
      }
    };
    checkInitialURL();

    // Listen for deep links while app is running
    const linkingSubscription = Linking.addEventListener('url', ({url}) => {
      handleResetPasswordUrl(url);
    });

    // Sync isPro to App Group whenever subscription changes
    const syncIsPro: CustomerInfoUpdateListener = async info => {
      if (Platform.OS === 'ios' && AppGroupStorage) {
        try {
          const isPro = !!info.entitlements.active.pro;
          await AppGroupStorage.setItem('isPro', String(isPro));
        } catch {
          // Non-fatal
        }
      }
    };
    Purchases.addCustomerInfoUpdateListener(syncIsPro);

    // Check for pending social import job on foreground
    const handleAppStateChange = async (nextState: string) => {
      if (nextState !== 'active') {
        return;
      }
      if (!AppGroupStorage || Platform.OS !== 'ios') {
        return;
      }

      // Check for pending social video import job
      const pendingJobId = await AppGroupStorage.getItem('pendingSocialJobId');
      if (pendingJobId) {
        try {
          const response = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/video_import_jobs?id=eq.${pendingJobId}&select=*`,
            {
              headers: {
                apikey: process.env.SUPABASE_ANON_KEY!,
                Authorization: `Bearer ${
                  (
                    await supabase.auth.getSession()
                  ).data.session?.access_token ?? ''
                }`,
              },
            },
          );
          const jobs = await response.json();
          const job = jobs?.[0];
          if (job?.status === 'ready_for_review') {
            await AppGroupStorage.removeItem('pendingSocialJobId');
            try {
              const extracted = job.extracted_recipe || {};
              const savedRecipe = await recipeService.createRecipe({
                ...extracted,
                id: '',
                ingredientRows: ingredientRowsFromText(extracted.ingredients),
              });
              store.dispatch(changeViewMode('view'));
              if (navigationRef.current?.isReady()) {
                navigationRef.current.navigate('RecipeDetailsScreen', {
                  item: savedRecipe,
                  lowConfidence: job.low_confidence,
                  sourceUrl: extracted.original_url ?? '',
                  sourcePlatform: job.platform,
                });
              }
            } catch (err) {
              console.error('Failed to save social recipe:', err);
              Alert.alert(
                'Import Failed',
                "We couldn't save the recipe. Please try again.",
              );
            }
          } else if (job?.status === 'failed') {
            await AppGroupStorage.removeItem('pendingSocialJobId');
            Alert.alert(
              'Import Failed',
              "We couldn't find a recipe in that video. The creator may not have included the recipe in their caption.",
            );
          }
          // job null (stale key) or status === 'processing': fall through to importedRecipe check
        } catch (err) {
          console.error('Failed to check social import job:', err);
        }
      }

      // Check for auto-saved recipe from share extension
      const importedRecipeJson = await AppGroupStorage.getItem(
        'importedRecipe',
      );
      if (importedRecipeJson) {
        try {
          const recipe = JSON.parse(importedRecipeJson);
          await AppGroupStorage.removeItem('importedRecipe');
          store.dispatch(changeViewMode('view'));
          if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate('RecipeDetailsScreen', {
              item: recipe,
            });
          }
        } catch (err) {
          console.error('Failed to parse importedRecipe:', err);
          await AppGroupStorage.removeItem('importedRecipe');
        }
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    const importSubscription = DeviceEventEmitter.addListener(
      'ImportCompleted',
      (recipe: any) => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('RecipeDetailsScreen', {item: recipe});
        }
      },
    );

    supabase.auth.getSession().then(async ({data: {session}}) => {
      setAuthSession(session);
      if (session) {
        // Link RevenueCat to the user before rendering so isPro is accurate on first render
        await storeSupabaseCredentials(session);
      }
      setIsLoadingSession(false);
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
      appStateSubscription.remove();
      importSubscription.remove();
      Purchases.removeCustomerInfoUpdateListener(syncIsPro);
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          {isLoadingSession ? (
            <LoadingScreen />
          ) : authSession?.user && !isRecoverySession ? (
            <GroceryListModalProvider>
              <AddToCollectionModalProvider>
                <CollectionsProvider>
                  <NavigationStack
                    navigationRef={navigationRef}
                    navigationReadyRef={navigationReadyRef}
                  />
                </CollectionsProvider>
              </AddToCollectionModalProvider>
            </GroceryListModalProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: LightTheme.colors['yellow-400'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
