import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import {generateClient} from 'aws-amplify/api';
import {listRecipes} from '../graphql/queries';

const initialState = {name: '', description: ''};
const client = generateClient();

function RecipeScreen() {
  const [formState, setFormState] = useState(initialState);
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    try {
      const recipeData = await client.graphql({
        query: listRecipes,
      });
      const temp_recipes = recipeData?.data?.listRecipes?.items || [];
      setRecipes(temp_recipes);
    } catch (err) {
      console.log('error fetching todos');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipes</Text>
      <FlatList
        data={recipes}
        renderItem={({item}) => <Text>{item.title}</Text>}
      />
    </View>
  );
}

export default RecipeScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flex: 1 },
  title: {
    fontFamily: 'Poppins-Medium',
    alignSelf: 'center',
    fontSize: 20,
    padding: 20,
  }
});