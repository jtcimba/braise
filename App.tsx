import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Pressable, SafeAreaView} from 'react-native';
import {generateClient} from 'aws-amplify/api';
import {createTodo} from './src/graphql/mutations';
import {listTodos} from './src/graphql/queries';
import {
  withAuthenticator,
  useAuthenticator,
} from '@aws-amplify/ui-react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RecipesScreen from './src/components/RecipesScreen';

const Stack = createNativeStackNavigator();


const userSelector = (context: any) => [context.user];

const SignOutButton = () => {
  const {user, signOut} = useAuthenticator(userSelector);
  return (
    <Pressable onPress={signOut}>
      <Text>
        Hello, {user.username}! Click here to sign out!
      </Text>
    </Pressable>
  );
};

// const initialState = {name: '', description: ''};
// const client = generateClient();

const App = () => {
  // const [formState, setFormState] = useState(initialState);
  // const [todos, setTodos] = useState<any[]>([]);

  // useEffect(() => {
  //   fetchTodos();
  // }, []);

  // function setInput(key: any, value: any) {
  //   setFormState({...formState, [key]: value});
  // }

  // async function fetchTodos() {
  //   try {
  //     const todoData = await client.graphql({
  //       query: listTodos,
  //     });
  //     const temp_todos = todoData.data.listTodos.items;
  //     setTodos(temp_todos);
  //   } catch (err) {
  //     console.log('error fetching todos');
  //   }
  // }

  // async function addTodo() {
  //   try {
  //     if (!formState.name || !formState.description) return;
  //     const todo = {...formState};
  //     setTodos([...todos, todo]);
  //     setFormState(initialState);
  //     await client.graphql({
  //       query: createTodo,
  //       variables: {
  //         input: todo,
  //       },
  //     });
  //   } catch (err) {
  //     console.log('error creating todo:', err);
  //   }
  // }

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <Stack.Navigator screenOptions={{headerShown: false }}>
          <Stack.Screen name="Recipes" component={RecipesScreen} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default withAuthenticator(App);

const styles = StyleSheet.create({
  container: {width: 400, flex: 1, padding: 20, alignSelf: 'center'}
});
