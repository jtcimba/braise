import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ListItem from './ListItem';
import Storage from '../storage';
import {useTheme} from '../../theme/ThemeProvider';
import SearchAndFilters from './SearchAndFilters';
import {recipeService} from '../services';
import HowItWorksModal from './HowItWorksModal';

type RecipesScreenProps = {
  route?: {params?: {refresh?: boolean}};
};

export default function RecipesScreen({route}: RecipesScreenProps) {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const theme = useTheme();

  const categories = useMemo(() => {
    if (!data.length) {
      return [];
    }

    const allCategories = data
      .map(recipe => {
        if (typeof recipe.categories === 'string') {
          return recipe.categories.split(',').map((cat: string) => cat.trim());
        }
        if (Array.isArray(recipe.categories)) {
          return recipe.categories;
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
      const recipes = await recipeService.fetchRecipes();
      setData(recipes);
      setFilteredData(recipes);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch recipes.');
    }
  }, []);

  useEffect(() => {
    if (route?.params?.refresh) {
      fetchRecipes();
    }
  }, [route, fetchRecipes]);

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
      if (typeof recipe.categories === 'string') {
        recipeCategories = recipe.categories
          .split(',')
          .map((cat: string) => cat.trim());
      } else if (Array.isArray(recipe.categories)) {
        recipeCategories = recipe.categories;
      }

      // Check if any of the recipe categories match any of the selected filters
      return filters.some(filter => recipeCategories.includes(filter));
    });
    setFilteredData(filteredResults);
  };

  return (
    <View style={styles(theme).container}>
      <HowItWorksModal
        visible={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
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
          contentContainerStyle={
            filteredData.length === 0
              ? styles(theme).listContentEmpty
              : undefined
          }
          data={filteredData}
          renderItem={({item}) => {
            return <ListItem item={item} navigation={navigation} />;
          }}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            !refreshing ? (
              <View style={styles(theme).noRecipes}>
                <Text style={styles(theme).emptyTitle}>
                  Your recipe library is empty
                </Text>
                <Text style={styles(theme).emptyMessage}>
                  Add recipes from the web using your browser’s share sheet—it
                  only takes a few taps.
                </Text>
                <TouchableOpacity
                  style={styles(theme).howItWorksButton}
                  onPress={() => setShowHowItWorks(true)}>
                  <Text style={styles(theme).howItWorksButtonText}>
                    How it works
                  </Text>
                </TouchableOpacity>
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
      backgroundColor: theme.colors['neutral-100'],
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    noRecipes: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
      textAlign: 'center',
      marginBottom: 12,
    },
    emptyMessage: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    howItWorksButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: theme.colors['rust-600'],
    },
    howItWorksButtonText: {
      ...theme.typography['h3-emphasized'],
      color: theme.colors['rust-600'],
    },
    subtext: {
      color: theme.colors['neutral-800'],
      overflow: 'hidden',
    },
  });
