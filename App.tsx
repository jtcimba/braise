import 'react-native-gesture-handler';
import {withAuthenticator} from '@aws-amplify/ui-react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DrawerActions,
} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RecipesScreen from './src/components/RecipesScreen';
import ProfileScreen from './src/components/ProfileScreen';
import AddScreen from './src/components/AddScreen';
export const Tab = createBottomTabNavigator();
import {createStackNavigator} from '@react-navigation/stack';
import RecipeDetailsScreen from './src/components/RecipeDetailsScreen';
import {createDrawerNavigator} from '@react-navigation/drawer';
import DiscoverScreen from './src/components/DiscoverScreen';
import {Text, TouchableOpacity, View} from 'react-native';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

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

function AddScreenComponent() {
  return (
    <View>
      <Text>Add recipe</Text>
    </View>
  );
}

function tabBarIcon(name: string, color: string, size: number) {
  let iconName = '';
  if (name === 'Recipes') {
    iconName = 'file-tray-full-outline';
  } else if (name === 'Discover') {
    iconName = 'compass-outline';
  } else if (name === 'Add') {
    iconName = 'add-circle-outline';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

function settingsIcon(navigation: any) {
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.dispatch(DrawerActions.openDrawer());
      }}>
      <Ionicons name={'settings-outline'} size={25} color={'gray'} />
    </TouchableOpacity>
  );
}

function Home({navigation}: {navigation: any}) {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => tabBarIcon(route.name, color, size),
        tabBarActiveTintColor: '#323232',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{
          headerTitleAlign: 'left',
          headerRight: () => settingsIcon(navigation),
          headerRightContainerStyle: {paddingRight: 10},
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreenComponent}
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
          headerRight: () => settingsIcon(navigation),
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
      <Drawer.Screen name="Home" component={Home} />
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
          options={{
            headerStyle: {
              shadowColor: 'transparent',
            },
            headerTitle: '',
          }}
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
