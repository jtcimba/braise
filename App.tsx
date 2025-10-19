import 'react-native-gesture-handler';
import {withAuthenticator} from '@aws-amplify/ui-react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RecipesScreen from './src/components/RecipesScreen';
import SettingsScreen from './src/components/SettingsScreen';
import AddScreen from './src/components/AddScreen';
import {createStackNavigator} from '@react-navigation/stack';
import RecipeDetailsScreen from './src/components/RecipeDetailsScreen';
import DiscoverScreen from './src/components/DiscoverScreen';
import TabBarIcon from './src/components/TabBarIcon';
import SettingsIcon from './src/components/SettingsIcon';
import BackIcon from './src/components/BackIcon';
import CloseIcon from './src/components/CloseIcon';
import DetailsMenu from './src/components/DetailsMenu';
import AddFromUrlScreen from './src/components/AddFromUrlScreen';
import {ThemeProvider} from './theme/ThemeProvider';
import {LightTheme} from './theme/theme';
import {useTheme} from './theme/ThemeProvider';
import {Theme} from './theme/types';
import {
  OnboardingProvider,
  useOnboarding,
} from './src/context/OnboardingContext';
import {useOnboardingTarget} from './src/hooks/useOnboardingTarget';
import OnboardingTooltip from './src/components/OnboardingTooltip';

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
          headerRight: () => CloseIcon(navigation, 'Recipes'),
          headerTitle: 'Add recipe',
          presentation: 'modal',
          headerShadowVisible: false,
          headerRightContainerStyle: {paddingRight: 15, paddingTop: 5},
          headerTitleStyle: {
            ...theme?.typography.h1,
            color: theme.colors.card,
          },
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
        })}
      />
      <Stack.Screen
        name="AddFromUrl"
        component={AddFromUrlScreen}
        options={({navigation}) => ({
          headerTitle: 'Add from URL',
          headerLeft: () => BackIcon(navigation, null, theme.colors.card),
          headerLeftContainerStyle: {paddingLeft: 15, paddingTop: 5},
          headerRight: () => CloseIcon(navigation, 'Recipes'),
          headerShadowVisible: false,
          headerRightContainerStyle: {paddingRight: 15, paddingTop: 5},
          headerTitleStyle: {
            ...theme.typography.h1,
            color: theme.colors.card,
          },
          headerStyle: {
            backgroundColor: theme.colors.secondary,
          },
        })}
      />
    </Stack.Navigator>
  );
}

function TabNavigator({navigation}: {navigation: any}) {
  const theme = useTheme() as unknown as Theme;
  const {isOnboardingActive, currentStep, steps, nextStep, skipOnboarding} =
    useOnboarding();
  const {targetRef: addButtonTargetRef, measureTarget: measureAddButtonTarget} =
    useOnboardingTarget('welcome');

  // Measure add button target when onboarding step 0 is active
  React.useEffect(() => {
    if (isOnboardingActive && currentStep === 0) {
      setTimeout(() => {
        measureAddButtonTarget();
      }, 500);
    }
  }, [isOnboardingActive, currentStep, measureAddButtonTarget]);

  const currentStepData = steps[currentStep];
  const showAddButtonTooltip = isOnboardingActive && currentStep === 0;

  return (
    <>
      <Tab.Navigator
        screenOptions={({route}) => ({
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({color, size}) => {
            return (
              <TabBarIcon
                ref={route.name === 'Add' ? addButtonTargetRef : undefined}
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
          name="Grocery Lists"
          component={DiscoverScreen}
          options={{
            headerTitleAlign: 'left',
            headerRight: () => SettingsIcon(navigation),
            headerRightContainerStyle: {paddingRight: 15},
            headerShadowVisible: false,
          }}
        />
      </Tab.Navigator>

      {showAddButtonTooltip && currentStepData?.targetPosition && (
        <OnboardingTooltip
          visible={true}
          title={currentStepData.title}
          description={currentStepData.description}
          targetPosition={currentStepData.targetPosition}
          onNext={nextStep}
          onSkip={skipOnboarding}
          isLastStep={currentStep === steps.length - 1}
        />
      )}
    </>
  );
}

export function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={LightTheme}>
      <OnboardingProvider>
        <NavigationContainer theme={LightTheme}>
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
                headerLeft: () => BackIcon(navigation, 'RecipeDetailsScreen'),
                headerLeftContainerStyle: {paddingLeft: 15, marginBottom: 10},
                headerRight: () => DetailsMenu(navigation),
                headerRightContainerStyle: {paddingRight: 15, marginBottom: 10},
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
                headerRight: () => CloseIcon(navigation, 'Recipes', '#2D2D2D'),
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
      </OnboardingProvider>
    </ThemeProvider>
  );
}

export default withAuthenticator(App);
