import React, {useCallback, useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {RecipeService} from '../api';
import ListItem from './ListItem';
import Storage from '../storage';

export default function RecipesScreen({route}: any) {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes().then(() => {
      setRefreshing(false);
    });
  };

  const fetchRecipes = useCallback(async () => {
    try {
      const recipes = await RecipeService.getRecipes();
      setData(recipes);
      Storage.saveRecipesToLocal(recipes);
    } catch (e) {
      console.error('Failed to fetch recipes', e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Storage.loadRecipesFromLocal().then(localRecipes => {
      if (localRecipes.length > 0) {
        setData(localRecipes);
        setLoading(false);
      } else {
        fetchRecipes().then(() => {
          setLoading(false);
        });
      }
    });
  }, [fetchRecipes, route.params?.refresh]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.container}
          data={data}
          renderItem={({item}) => {
            return <ListItem item={item} navigation={navigation} />;
          }}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            !refreshing ? (
              <View style={styles.noRecipes}>
                <Text style={styles.subtext}>No recipes found</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noRecipes: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtext: {
    color: '#666',
    overflow: 'hidden',
  },
});
