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
import Ionicons from 'react-native-vector-icons/Ionicons';

const sortModes = [
  {key: 'viewed_at', label: 'Last viewed'},
  {key: 'modified_at', label: 'Last modified'},
  {key: 'created_at', label: 'Last added'},
];

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
  const [sortIndex, setSortIndex] = useState(0);
  const theme = useTheme() as any;

  const toggleSort = () => setSortIndex(i => (i + 1) % sortModes.length);

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

  const sortedData = useMemo(() => {
    const key = sortModes[sortIndex].key;
    return [...filteredData].sort((a, b) => {
      const dateA = a[key] ? new Date(a[key]).getTime() : 0;
      const dateB = b[key] ? new Date(b[key]).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredData, sortIndex]);

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
      let recipeCategories: string[] = [];
      if (typeof recipe.categories === 'string') {
        recipeCategories = recipe.categories
          .split(',')
          .map((cat: string) => cat.trim());
      } else if (Array.isArray(recipe.categories)) {
        recipeCategories = recipe.categories;
      }
      return filters.some(filter => recipeCategories.includes(filter));
    });
    setFilteredData(filteredResults);
  };

  const listHeader = (
    <View style={styles(theme).listHeader}>
      <TouchableOpacity onPress={toggleSort} activeOpacity={0.5}>
        <View style={styles(theme).listHeaderSort}>
          <Text style={styles(theme).listHeaderSortLabel}>
            {sortModes[sortIndex].label}
          </Text>
          <Ionicons
            name="swap-vertical"
            size={14}
            color={theme.colors['neutral-400']}
          />
        </View>
      </TouchableOpacity>
      <Text style={styles(theme).listHeaderCount}>
        {sortedData.length} recipes
      </Text>
    </View>
  );

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
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles(theme).container}
          contentContainerStyle={
            sortedData.length === 0 ? styles(theme).listContentEmpty : undefined
          }
          data={sortedData}
          renderItem={({item, index}) => (
            <ListItem
              item={item}
              navigation={navigation}
              isFirst={index === 0}
            />
          )}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            !refreshing ? (
              <View style={styles(theme).noRecipes}>
                <Text style={styles(theme).emptyTitle}>
                  Your recipe library is empty
                </Text>
                <Text style={styles(theme).emptyMessage}>
                  Add recipes from the web using your browser's share sheet—it
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
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    listHeaderCount: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
    },
    listHeaderSort: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    listHeaderSortLabel: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
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
  });
