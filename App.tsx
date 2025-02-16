import 'react-native-gesture-handler';
import {withAuthenticator} from '@aws-amplify/ui-react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#D95931',
    background: '#EBE9E5',
    card: '#EBE9E5',
    text: '#323232',
    border: '#D4D4D4',
    opaque: 'rgba(0, 0, 0, 0.3)',
  },
  fonts: {
    regular: {
      fontFamily: 'Poppins-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Poppins-Medium',
      fontWeight: 'medium',
    },
    light: {
      fontFamily: 'Poppins-Light',
      fontWeight: 'light',
    },
    thin: {
      fontFamily: 'Poppins-Thin',
      fontWeight: 'thin',
    },
  },
};

function AddComponent() {
  return null;
}

function AddStackNavigator() {
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
          headerRightContainerStyle: {paddingRight: 10},
        })}
      />
      <Stack.Screen
        name="AddFromUrl"
        component={AddFromUrlScreen}
        options={({navigation}) => ({
          headerTitle: 'Add from URL',
          headerLeft: () => BackIcon(navigation),
          headerLeftContainerStyle: {paddingLeft: 10},
          headerRight: () => CloseIcon(navigation, 'Recipes'),
          headerShadowVisible: false,
          headerRightContainerStyle: {paddingRight: 10},
        })}
      />
    </Stack.Navigator>
  );
}

function TabNavigator({navigation}: {navigation: any}) {
  return (
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
          headerRightContainerStyle: {paddingRight: 10},
          headerShadowVisible: false,
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
        name="Discover"
        component={DiscoverScreen}
        options={{
          headerTitleAlign: 'left',
          headerRight: () => SettingsIcon(navigation),
          headerRightContainerStyle: {paddingRight: 10},
          headerShadowVisible: false,
        }}
      />
    </Tab.Navigator>
  );
}

export function App(): React.JSX.Element {
  return (
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
            headerLeftContainerStyle: {paddingLeft: 10},
            headerRight: () => DetailsMenu(navigation),
            headerRightContainerStyle: {paddingRight: 10},
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
            headerLeft: () => null,
            headerRight: () => CloseIcon(navigation, 'Recipes'),
            presentation: 'modal',
            headerShadowVisible: false,
            headerRightContainerStyle: {paddingRight: 10},
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default withAuthenticator(App);
