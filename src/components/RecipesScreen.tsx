import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
} from 'react';
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
import {DrawerActions, useNavigation} from '@react-navigation/native';
import ListItem from './ListItem';
import Storage from '../storage';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import SearchAndFilters from './SearchAndFilters';
import {recipeService} from '../services';
import HowItWorksModal from './HowItWorksModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useCollections} from '../context/CollectionsContext';

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
  const theme = useTheme() as unknown as Theme;
  const {activeCollection, setTotalRecipeCount} = useCollections();

  const toggleSort = () => setSortIndex(i => (i + 1) % sortModes.length);

  useLayoutEffect(() => {
    const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
    const title = activeCollection?.name ?? 'All Recipes';
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={openDrawer}
          style={styles(theme).hamburger}
          activeOpacity={0.7}>
          <Ionicons name="menu" size={24} color={theme.colors['neutral-800']} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <TouchableOpacity onPress={openDrawer} activeOpacity={0.7}>
          <Text style={styles(theme).headerTitle}>{title}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, activeCollection, theme]);

  const getRecipeCategories = (recipe: any): string[] => {
    if (typeof recipe.categories === 'string') {
      return recipe.categories.split(',').map((cat: string) => cat.trim());
    }
    if (Array.isArray(recipe.categories)) {
      return recipe.categories;
    }
    return [];
  };

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
      setTotalRecipeCount(recipes.length);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch recipes.');
    }
  }, [setTotalRecipeCount]);

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
        setTotalRecipeCount(localRecipes.length);
        setLoading(false);
      } else {
        fetchRecipes().then(() => {
          setLoading(false);
        });
      }
    });
  }, [fetchRecipes, route, setTotalRecipeCount]);

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
    const q = query.toLowerCase();
    const searchResults = data.filter(recipe => {
      return [
        recipe.title,
        recipe.author,
        recipe.about,
        recipe.ingredients,
        getRecipeCategories(recipe).join(' '),
      ]
        .filter(Boolean)
        .some((field: string) => field.toLowerCase().includes(q));
    });
    setFilteredData(searchResults);
  };

  return (
    <View style={styles(theme).container}>
      <HowItWorksModal
        visible={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
      <SearchAndFilters
        onSearch={handleSearch}
        sortLabel={sortModes[sortIndex].label}
        onSortPress={toggleSort}
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
    hamburger: {
      paddingLeft: 15,
    },
    headerTitle: {
      ...theme.typography.h1,
      color: theme.colors['neutral-800'],
      paddingTop: 3,
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
      color: theme.colors['toffee-400'],
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    howItWorksButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: theme.colors['toffee-400'],
    },
    howItWorksButtonText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['toffee-400'],
    },
  });
