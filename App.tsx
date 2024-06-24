import 'react-native-gesture-handler';
import {withAuthenticator} from '@aws-amplify/ui-react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import RecipesScreen from './src/components/RecipesScreen';
import ProfileScreen from './src/components/ProfileScreen';
import AddScreen from './src/components/AddScreen';
import {createStackNavigator} from '@react-navigation/stack';
import RecipeDetailsScreen from './src/components/RecipeDetailsScreen';
import {createDrawerNavigator} from '@react-navigation/drawer';
import DiscoverScreen from './src/components/DiscoverScreen';
import TabBarIcon from './src/components/TabBarIcon';
import SettingsIcon from './src/components/SettingsIcon';
import BackIcon from './src/components/BackIcon';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
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

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={ProfileScreen}
      screenOptions={{headerShown: false, drawerPosition: 'right'}}>
      <Drawer.Screen name="Home" component={TabNavigator} />
    </Drawer.Navigator>
  );
}

export function App(): React.JSX.Element {
  return (
    <NavigationContainer theme={LightTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="DrawerNavigator"
          component={DrawerNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="RecipeDetailsScreen"
          component={RecipeDetailsScreen}
          options={({navigation}) => ({
            headerStyle: {
              shadowColor: 'transparent',
            },
            headerTitle: '',
            headerLeft: () => BackIcon(navigation),
            headerLeftContainerStyle: {paddingLeft: 10},
          })}
        />
        <Stack.Screen
          name="Add"
          component={AddScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default withAuthenticator(App);
