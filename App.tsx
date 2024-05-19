import {withAuthenticator} from '@aws-amplify/ui-react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RecipesScreen from './src/components/RecipesScreen';
import ProfileScreen from './src/components/ProfileScreen';
import AddScreen from './src/components/AddScreen';
export const Tab = createBottomTabNavigator();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
  },
};

const AddScreenComponent = () => {
  return null;
};

export function App(): React.JSX.Element {
  return (
    <NavigationContainer theme={LightTheme}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({color, size}) => {
            let iconName = '';

            if (route.name === 'Recipes') {
              iconName = 'file-tray-full-outline';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarStyle: {
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: 'gray',
        })}>
        <Tab.Screen name="Recipes" component={RecipesScreen} />
        <Tab.Screen
          name="Add"
          component={AddScreenComponent}
          options={{
            tabBarButton: () => <AddScreen />,
          }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default withAuthenticator(App);
