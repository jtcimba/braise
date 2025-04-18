import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {RecipeService} from '../api';
import ListItem from './ListItem';
import Storage from '../storage';
import {useTheme} from '../../theme/ThemeProvider';
import SearchAndFilters from './SearchAndFilters';

type Route = {
  route: {params: {refresh: boolean}};
};

export default function RecipesScreen({route}: Route) {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const categories = useMemo(() => {
    if (!data.length) return [];

    const allCategories = data
      .map(recipe => {
        if (typeof recipe.category === 'string') {
          return recipe.category.split(',').map((cat: string) => cat.trim());
        }
        if (Array.isArray(recipe.category)) {
          return recipe.category;
        }
        return [];
      })
      .flat()
      .filter(Boolean);

    return [...new Set(allCategories)];
  }, [data]);

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
      setFilteredData(recipes);
      await Storage.saveRecipesToLocal(recipes);
    } catch (e) {
      console.error('Failed to fetch recipes', e);
      Alert.alert('Error', 'Failed to fetch recipes.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Storage.loadRecipesFromLocal().then(localRecipes => {
      if (localRecipes.length > 0) {
        setData(localRecipes);
        setFilteredData(localRecipes);
        setLoading(false);
      } else {
        fetchRecipes().then(() => {
          setLoading(false);
        });
      }
    });
  }, [fetchRecipes, route]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredData(data);
      return;
    }
    const searchResults = data.filter(recipe =>
      recipe.title.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredData(searchResults);
  };

  const handleFiltersChange = (filters: string[]) => {
    if (filters.length === 0) {
      setFilteredData(data);
      return;
    }
    const filteredResults = data.filter(recipe => {
      // Get recipe categories as an array
      let recipeCategories: string[] = [];
      if (typeof recipe.category === 'string') {
        recipeCategories = recipe.category
          .split(',')
          .map((cat: string) => cat.trim());
      } else if (Array.isArray(recipe.category)) {
        recipeCategories = recipe.category;
      }

      // Check if any of the recipe categories match any of the selected filters
      return filters.some(filter => recipeCategories.includes(filter));
    });
    setFilteredData(filteredResults);
  };

  return (
    <View style={styles(theme).container}>
      <SearchAndFilters
        onSearch={handleSearch}
        onFiltersChange={handleFiltersChange}
        filterOptions={categories}
      />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles(theme).container}
          data={filteredData}
          renderItem={({item}) => {
            return <ListItem item={item} navigation={navigation} />;
          }}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            !refreshing ? (
              <View style={styles(theme).noRecipes}>
                <Text style={styles(theme).subtext}>No recipes found</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    noRecipes: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtext: {
      color: theme.colors.subtext,
      overflow: 'hidden',
    },
  });
