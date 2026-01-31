import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {categorizeIngredient} from '../services';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  amount: string;
  recipeId?: string;
  recipeTitle?: string;
}

const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Pantry',
  'Frozen',
  'Bakery',
  'Other',
];

const STORAGE_KEY = 'grocery_list_items';

export default function GroceryListScreen() {
  const theme = useTheme() as unknown as Theme;
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [isCategoryManuallySelected, setIsCategoryManuallySelected] =
    useState(false);
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'category' | 'checked' | 'recipe'>(
    'category',
  );
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const sortButtonRef = useRef<TouchableOpacity>(null);
  const [sortButtonLayout, setSortButtonLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const isInitialLoad = useRef(true);

  useEffect(() => {
    loadItems();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, []),
  );

  useEffect(() => {
    if (!isInitialLoad.current) {
      saveItems(items);
    } else {
      isInitialLoad.current = false;
    }
  }, [items]);

  useEffect(() => {
    if (!isCategoryManuallySelected && newItemName.trim()) {
      const category = categorizeIngredient(newItemName);
      setNewItemCategory(category);
    }
  }, [newItemName, isCategoryManuallySelected]);

  const loadItems = async () => {
    try {
      const storedItems = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading items from AsyncStorage:', error);
      setItems([]);
    }
  };

  const saveItems = async (itemsToSave: GroceryItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave));
    } catch (error) {
      console.error('Error saving items to AsyncStorage:', error);
    }
  };

  const toggleItem = (id: string) => {
    setAnimatingItems(prev => new Set(prev).add(id));

    setTimeout(() => {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === id ? {...item, completed: !item.completed} : item,
        ),
      );
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 500);
  };

  const deleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItemName.trim()) {
      const newItem: GroceryItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        category: newItemCategory,
        completed: false,
        amount: newItemAmount.trim(),
      };
      setItems(prevItems => [...prevItems, newItem]);
      setNewItemName('');
      setNewItemCategory('Other');
      setNewItemAmount('');
      setIsCategoryManuallySelected(false);
      setIsAddModalVisible(false);
    }
  };

  const editItem = () => {
    if (editingItem && newItemName.trim()) {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                name: newItemName.trim(),
                category: newItemCategory,
                amount: newItemAmount.trim(),
              }
            : item,
        ),
      );
      setNewItemName('');
      setNewItemCategory('Other');
      setNewItemAmount('');
      setIsCategoryManuallySelected(false);
      setEditingItem(null);
      setIsEditModalVisible(false);
    }
  };

  const startEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemAmount(item.amount);
    setIsCategoryManuallySelected(true);
    setIsEditModalVisible(true);
  };

  const clearCompletedItems = () => {
    setItems(prevItems => prevItems.filter(item => !item.completed));
  };

  const hasCompletedItems = items.some(item => item.completed);

  const getItemsByCategory = (itemsToGroup: GroceryItem[]) => {
    const groupedItems: {[key: string]: GroceryItem[]} = {};
    itemsToGroup.forEach(item => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });
    return Object.entries(groupedItems).sort(([a], [b]) => {
      const aIndex = CATEGORIES.indexOf(a);
      const bIndex = CATEGORIES.indexOf(b);
      return aIndex - bIndex;
    });
  };

  const getItemsByRecipe = (itemsToGroup: GroceryItem[]) => {
    const otherKey = 'Other';
    const groupedItems: {[key: string]: GroceryItem[]} = {};
    itemsToGroup.forEach(item => {
      const groupKey =
        item.recipeId && item.recipeTitle ? item.recipeTitle : otherKey;
      if (!groupedItems[groupKey]) {
        groupedItems[groupKey] = [];
      }
      groupedItems[groupKey].push(item);
    });
    const entries = Object.entries(groupedItems);
    const otherEntries = entries.filter(([key]) => key === otherKey);
    const recipeEntries = entries
      .filter(([key]) => key !== otherKey)
      .sort(([a], [b]) => a.localeCompare(b));
    return [...recipeEntries, ...otherEntries];
  };

  const getItemsByChecked = (itemsToGroup: GroceryItem[]) => {
    const groupedItems: {[key: string]: GroceryItem[]} = {};
    const uncheckedItems: GroceryItem[] = [];
    const checkedItems: GroceryItem[] = [];
    itemsToGroup.forEach(item => {
      if (item.completed) {
        checkedItems.push(item);
      } else {
        uncheckedItems.push(item);
      }
    });
    if (uncheckedItems.length > 0) {
      groupedItems.Unchecked = uncheckedItems;
    }
    if (checkedItems.length > 0) {
      groupedItems.Checked = checkedItems;
    }
    return Object.entries(groupedItems);
  };

  const getItemsBySort = () => {
    if (sortBy === 'category') {
      return getItemsByCategory(items);
    }
    if (sortBy === 'recipe') {
      return getItemsByRecipe(items);
    }
    return getItemsByChecked(items);
  };

  const renderCategorySection = ({item}: {item: [string, GroceryItem[]]}) => {
    const [category, categoryItems] = item;
    return (
      <View style={styles(theme).categorySection}>
        <Text style={styles(theme).categoryHeader}>{category}</Text>
        {categoryItems.map(groceryItem => (
          <TouchableOpacity
            key={groceryItem.id}
            style={styles(theme).itemContainer}
            onPress={() => startEdit(groceryItem)}>
            <View style={styles(theme).itemContent}>
              <TouchableOpacity
                style={styles(theme).checkbox}
                onPress={e => {
                  e.stopPropagation();
                  toggleItem(groceryItem.id);
                }}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                {(groceryItem.completed ||
                  animatingItems.has(groceryItem.id)) && (
                  <Text style={styles(theme).checkmark}>✓</Text>
                )}
              </TouchableOpacity>
              <View style={styles(theme).itemTextContainer}>
                <Text
                  style={[
                    styles(theme).itemText,
                    (groceryItem.completed ||
                      animatingItems.has(groceryItem.id)) &&
                      styles(theme).completedText,
                  ]}>
                  {groceryItem.name}
                </Text>
                {groceryItem.amount && (
                  <Text
                    style={[
                      styles(theme).amountText,
                      (groceryItem.completed ||
                        animatingItems.has(groceryItem.id)) &&
                        styles(theme).completedText,
                    ]}>
                    {groceryItem.amount}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles(theme).deleteButton}
                onPress={e => {
                  e.stopPropagation();
                  deleteItem(groceryItem.id);
                }}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.subtext}
                  style={styles(theme).deleteIcon}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderItemModal = () => {
    const isVisible = isAddModalVisible || isEditModalVisible;
    const isEdit = isEditModalVisible;
    const title = isEdit ? 'Edit Item' : 'Add New Item';
    const buttonText = isEdit ? 'Save changes' : 'Add item';
    const onSave = isEdit ? editItem : addItem;
    const onCancel = () => {
      if (isEdit) {
        setIsEditModalVisible(false);
        setEditingItem(null);
      } else {
        setIsAddModalVisible(false);
      }
      setNewItemName('');
      setNewItemCategory('Other');
      setNewItemAmount('');
      setIsCategoryManuallySelected(false);
    };

    return (
      <Modal visible={isVisible} transparent={true} onRequestClose={onCancel}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles(theme).modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : -30}
              style={styles(theme).keyboardAvoidingContainer}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles(theme).modalContainer}>
                  <View style={styles(theme).header}>
                    <Text style={styles(theme).modalTitle}>{title}</Text>
                  </View>
                  <ScrollView
                    contentContainerStyle={styles(theme).modalScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <TextInput
                      style={styles(theme).textInput}
                      placeholder="Item name"
                      value={newItemName}
                      onChangeText={setNewItemName}
                      autoFocus
                    />
                    <TextInput
                      style={styles(theme).textInput}
                      placeholder="Amount (e.g., 2 lbs, 1 dozen)"
                      value={newItemAmount}
                      onChangeText={setNewItemAmount}
                    />
                    <View style={styles(theme).categoryContainer}>
                      <Text style={styles(theme).categoryLabel}>Category:</Text>
                      <View style={styles(theme).categoryButtons}>
                        {CATEGORIES.map(category => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles(theme).categoryButton,
                              newItemCategory === category &&
                                styles(theme).selectedCategoryButton,
                            ]}
                            onPress={() => {
                              setNewItemCategory(category);
                              setIsCategoryManuallySelected(true);
                            }}>
                            <Text
                              style={[
                                styles(theme).categoryButtonText,
                                newItemCategory === category &&
                                  styles(theme).selectedCategoryButtonText,
                              ]}>
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                  <View style={styles(theme).buttonContainer}>
                    <TouchableOpacity
                      style={styles(theme).cancelButton}
                      onPress={onCancel}>
                      <Text style={styles(theme).cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles(theme).confirmButton}
                      onPress={onSave}>
                      <Text
                        style={styles(theme).confirmButtonText}
                        numberOfLines={1}>
                        {buttonText}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const getSortModalStyle = () => {
    return {
      top: sortButtonLayout.y + sortButtonLayout.height + 8,
      left: 20,
    };
  };

  const renderSortModal = () => {
    return (
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsSortModalVisible(false)}>
          <View style={styles(theme).sortModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[styles(theme).sortModalContainer, getSortModalStyle()]}>
                <TouchableOpacity
                  style={[
                    styles(theme).sortOption,
                    sortBy === 'category' && styles(theme).sortOptionSelected,
                  ]}
                  onPress={() => {
                    setSortBy('category');
                    setIsSortModalVisible(false);
                  }}>
                  <Text
                    style={[
                      styles(theme).sortOptionText,
                      sortBy === 'category' &&
                        styles(theme).sortOptionTextSelected,
                    ]}>
                    Category
                  </Text>
                  {sortBy === 'category' && (
                    <Text style={styles(theme).sortCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles(theme).sortOption,
                    sortBy === 'recipe' && styles(theme).sortOptionSelected,
                  ]}
                  onPress={() => {
                    setSortBy('recipe');
                    setIsSortModalVisible(false);
                  }}>
                  <Text
                    style={[
                      styles(theme).sortOptionText,
                      sortBy === 'recipe' &&
                        styles(theme).sortOptionTextSelected,
                    ]}>
                    Recipe
                  </Text>
                  {sortBy === 'recipe' && (
                    <Text style={styles(theme).sortCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles(theme).sortOption,
                    sortBy === 'checked' && styles(theme).sortOptionSelected,
                  ]}
                  onPress={() => {
                    setSortBy('checked');
                    setIsSortModalVisible(false);
                  }}>
                  <Text
                    style={[
                      styles(theme).sortOptionText,
                      sortBy === 'checked' &&
                        styles(theme).sortOptionTextSelected,
                    ]}>
                    Checked
                  </Text>
                  {sortBy === 'checked' && (
                    <Text style={styles(theme).sortCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const groupedItems = getItemsBySort();

  return (
    <View style={styles(theme).container}>
      {groupedItems.length === 0 ? (
        <View style={styles(theme).emptyState}>
          <Text style={styles(theme).emptyText}>
            Your grocery list is empty
          </Text>
          <Text style={styles(theme).emptySubtext}>
            Tap the + button to add items
          </Text>
        </View>
      ) : (
        <>
          <View style={styles(theme).controlsContainer}>
            <TouchableOpacity
              ref={sortButtonRef}
              style={styles(theme).sortButton}
              onPress={() => {
                sortButtonRef.current?.measure(
                  (x, y, width, height, pageX, pageY) => {
                    setSortButtonLayout({
                      x: pageX,
                      y: pageY,
                      width,
                      height,
                    });
                    setIsSortModalVisible(true);
                  },
                );
              }}>
              <Text style={styles(theme).sortButtonText}>
                Sort by:{' '}
                {sortBy === 'category'
                  ? 'Category'
                  : sortBy === 'recipe'
                  ? 'Recipe'
                  : 'Checked'}
              </Text>
            </TouchableOpacity>
            {hasCompletedItems && (
              <TouchableOpacity
                style={styles(theme).clearButton}
                onPress={clearCompletedItems}>
                <Text style={styles(theme).clearButtonText}>
                  Clear checked items
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={groupedItems}
            renderItem={renderCategorySection}
            keyExtractor={([category]) => category}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles(theme).listContainer}
          />
        </>
      )}

      <TouchableOpacity
        style={styles(theme).floatingAddButton}
        onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles(theme).floatingAddButtonText}>+</Text>
      </TouchableOpacity>

      {renderItemModal()}
      {renderSortModal()}
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    floatingAddButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    floatingAddButtonText: {
      color: theme.colors.card,
      fontSize: 28,
      fontWeight: 'bold',
    },
    listContainer: {
      paddingBottom: 100,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 10,
    },
    clearButton: {
      backgroundColor: theme.colors.card,
      alignItems: 'flex-end',
    },
    clearButtonText: {
      ...theme.typography.h5,
      color: theme.colors.primary,
    },
    sortButton: {
      backgroundColor: theme.colors.card,
      paddingVertical: 8,
      paddingEnd: 12,
      borderRadius: 8,
    },
    sortButtonText: {
      ...theme.typography.h5,
      color: theme.colors.primary,
    },
    categorySection: {
      marginTop: 20,
    },
    categoryHeader: {
      ...theme.typography.h3,
      color: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    checkbox: {
      width: 28,
      height: 28,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 4,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    itemTextContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemText: {
      ...theme.typography.h4,
      color: theme.colors.text,
    },
    amountText: {
      ...theme.typography.h5,
      color: theme.colors.subtext,
      marginLeft: 8,
    },
    deleteButton: {
      padding: 4,
      opacity: 0.5,
    },
    deleteIcon: {
      opacity: 1,
    },
    completedText: {
      textDecorationLine: 'line-through',
      color: theme.colors.subtext,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      ...theme.typography.h2,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      ...theme.typography.h5,
      color: theme.colors.subtext,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboardAvoidingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      padding: 20,
      width: '85%',
      maxWidth: 350,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    modalScrollContent: {
      flexGrow: 1,
    },
    modalTitle: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 20,
      ...theme.typography.h4,
      color: theme.colors.text,
    },
    categoryContainer: {
      marginBottom: 20,
    },
    categoryLabel: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: 10,
    },
    categoryButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    selectedCategoryButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryButtonText: {
      ...theme.typography.h5,
      color: theme.colors.text,
      fontSize: 12,
    },
    selectedCategoryButtonText: {
      color: theme.colors.card,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      ...theme.typography.h4,
      color: theme.colors.subtext,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      ...theme.typography.h4,
      color: theme.colors.background,
      fontWeight: '500',
    },
    sortModalOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    sortModalContainer: {
      position: 'absolute',
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      paddingVertical: 8,
      minWidth: 150,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    sortOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    sortOptionSelected: {
      backgroundColor: theme.colors.background,
    },
    sortOptionText: {
      ...theme.typography.h4,
      color: theme.colors.text,
    },
    sortOptionTextSelected: {
      color: theme.colors.primary,
    },
    sortCheckmark: {
      ...theme.typography.h4,
      color: theme.colors.primary,
      marginLeft: 8,
    },
  });
