import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  type TextInput as TextInputType,
} from 'react-native';
import Modal from 'react-native-modal';
import {DrawerActions, useNavigation} from '@react-navigation/native';
import ListItem from './ListItem';
import Storage from '../storage';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import SearchAndFilters from './SearchAndFilters';
import {recipeService} from '../services';
import {collectionsService} from '../services/collectionsService';
import HowItWorksModal from './HowItWorksModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useCollections} from '../context/CollectionsContext';

const sortModes = [
  {key: 'viewed_at', label: 'Last viewed'},
  {key: 'modified_at', label: 'Last modified'},
  {key: 'created_at', label: 'Last added'},
];

const getRecipeCategories = (recipe: any): string[] => {
  if (typeof recipe.categories === 'string') {
    return recipe.categories.split(',').map((cat: string) => cat.trim());
  }
  if (Array.isArray(recipe.categories)) {
    return recipe.categories;
  }
  return [];
};

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
  const [showCollectionOptions, setShowCollectionOptions] = useState(false);
  const [collectionOptionsView, setCollectionOptionsView] = useState<
    'menu' | 'rename'
  >('menu');
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<TextInputType>(null);
  const theme = useTheme() as unknown as Theme;
  const {
    activeCollection,
    setActiveCollection,
    refreshCollections,
    setTotalRecipeCount,
  } = useCollections();

  const toggleSort = useCallback(
    () => setSortIndex(i => (i + 1) % sortModes.length),
    [],
  );

  useEffect(() => {
    if (collectionOptionsView === 'rename') {
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [collectionOptionsView]);

  const handleRename = useCallback(
    async (name: string) => {
      if (!activeCollection) {
        return;
      }
      try {
        await collectionsService.updateCollection(activeCollection.id, {name});
        setActiveCollection({...activeCollection, name});
        await refreshCollections();
      } catch {
        Alert.alert('Error', 'Failed to rename collection.');
      }
    },
    [activeCollection, setActiveCollection, refreshCollections],
  );

  const handleDeleteCollection = useCallback(() => {
    setShowCollectionOptions(false);
    if (!activeCollection) {
      return;
    }
    Alert.alert(
      `Delete "${activeCollection.name}"?`,
      'Recipes stay in your library — only the collection is removed.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await collectionsService.deleteCollection(activeCollection.id);
              setActiveCollection(null);
              await refreshCollections();
            } catch {
              Alert.alert('Error', 'Failed to delete collection.');
            }
          },
        },
      ],
    );
  }, [activeCollection, setActiveCollection, refreshCollections]);

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
      headerRight: activeCollection
        ? () => (
            <TouchableOpacity
              onPress={() => setShowCollectionOptions(true)}
              style={styles(theme).headerRightButton}
              activeOpacity={0.7}>
              <Ionicons
                name="ellipsis-horizontal"
                size={22}
                color={theme.colors['neutral-800']}
              />
            </TouchableOpacity>
          )
        : () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings' as never)}
              activeOpacity={0.7}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={theme.colors['neutral-800']}
              />
            </TouchableOpacity>
          ),
    });
  }, [navigation, activeCollection, theme]);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecipes().then(() => {
      setRefreshing(false);
    });
  }, [fetchRecipes]);

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

  const handleSearch = useCallback(
    (query: string) => {
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
    },
    [data],
  );

  return (
    <View style={styles(theme).container}>
      <HowItWorksModal
        visible={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
      <Modal
        isVisible={showCollectionOptions}
        onBackdropPress={() => setShowCollectionOptions(false)}
        onSwipeComplete={() => setShowCollectionOptions(false)}
        onModalWillShow={() => setCollectionOptionsView('menu')}
        swipeDirection={['down']}
        style={styles(theme).modalOverlay}
        avoidKeyboard>
        <View style={styles(theme).modal}>
          {collectionOptionsView === 'menu' ? (
            <>
              <View style={styles(theme).modalHeader}>
                <Text style={styles(theme).modalTitle}>
                  {activeCollection?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCollectionOptions(false)}>
                  <Ionicons
                    name="close-outline"
                    size={25}
                    color={theme.colors['neutral-800']}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles(theme).modalItem}
                onPress={() => {
                  setRenameValue(activeCollection?.name ?? '');
                  setCollectionOptionsView('rename');
                }}>
                <Ionicons
                  name="pencil"
                  size={18}
                  style={styles(theme).modalIcon}
                />
                <Text style={styles(theme).modalItemText}>Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(theme).modalItem}
                onPress={handleDeleteCollection}>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  style={styles(theme).modalIconDestructive}
                />
                <Text style={styles(theme).modalItemTextDestructive}>
                  Delete collection
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles(theme).modalHeader}>
                <Text style={styles(theme).modalTitle}>Rename collection</Text>
                <TouchableOpacity
                  onPress={() => setCollectionOptionsView('menu')}>
                  <Ionicons
                    name="close-outline"
                    size={25}
                    color={theme.colors['neutral-800']}
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                ref={renameInputRef}
                style={styles(theme).renameInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Collection name"
                placeholderTextColor={theme.colors['toffee-400']}
                returnKeyType="done"
                autoCapitalize="words"
                selectTextOnFocus
              />
              <View style={styles(theme).renameButtons}>
                <TouchableOpacity
                  style={styles(theme).renameCancelButton}
                  onPress={() => setCollectionOptionsView('menu')}
                  activeOpacity={0.7}>
                  <Text style={styles(theme).renameCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles(theme).renameSaveButton,
                    !renameValue.trim() &&
                      styles(theme).renameSaveButtonDisabled,
                  ]}
                  disabled={!renameValue.trim()}
                  onPress={async () => {
                    await handleRename(renameValue.trim());
                    setShowCollectionOptions(false);
                  }}
                  activeOpacity={0.7}>
                  <Text style={styles(theme).renameSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

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

const styles = (theme: Theme) =>
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
    headerRightButton: {
      paddingRight: 15,
    },
    modalOverlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modal: {
      backgroundColor: theme.colors['neutral-100'],
      borderRadius: 25,
      paddingHorizontal: 25,
      paddingTop: 10,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
      marginBottom: 4,
    },
    modalTitle: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      marginTop: 6,
    },
    modalIcon: {
      marginRight: 15,
      color: theme.colors['neutral-800'],
    },
    modalIconDestructive: {
      marginRight: 15,
      color: theme.colors.notification,
    },
    modalItemText: {
      ...theme.typography.h2,
      color: theme.colors['neutral-800'],
    },
    modalItemTextDestructive: {
      ...theme.typography.h2,
      color: theme.colors.notification,
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
    renameInput: {
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginVertical: 16,
      ...theme.typography.h2,
      color: theme.colors['neutral-800'],
    },
    renameButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    renameCancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      alignItems: 'center',
    },
    renameCancelText: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
    },
    renameSaveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.colors['neutral-800'],
      alignItems: 'center',
    },
    renameSaveButtonDisabled: {
      opacity: 0.4,
    },
    renameSaveText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-100'],
      fontWeight: '500',
    },
  });
