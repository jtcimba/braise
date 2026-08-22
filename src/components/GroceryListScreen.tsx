import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {categorizeIngredient} from '../services';
import FilterChip from './FilterChip';
import {isTablet, MODAL_MAX_WIDTH} from '../hooks/useTablet';
import {useHousehold} from '../hooks/useHousehold';
import {supabase} from '../supabase-client';

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

export default function GroceryListScreen() {
  const theme = useTheme() as unknown as Theme;
  const {householdId} = useHousehold();
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isCategoryManuallySelected && newItemName.trim()) {
      const category = categorizeIngredient(newItemName);
      setNewItemCategory(category);
    }
  }, [newItemName, isCategoryManuallySelected]);

  const loadItems = useCallback(async () => {
    if (!householdId) {
      return;
    }
    try {
      const {data, error} = await supabase
        .from('grocery_list_items')
        .select('id, name, category, completed, amount')
        .eq('household_id', householdId)
        .order('updated_at', {ascending: true});

      if (!error && data) {
        setItems(
          data.map(row => ({
            ...row,
            amount: row.amount ?? '',
            category: row.category ?? 'Other',
          })),
        );
      }
    } catch (error) {
      console.error('Error loading grocery list:', error);
    }
  }, [householdId]);

  useEffect(() => {
    if (householdId) {
      loadItems();
    }
  }, [householdId, loadItems]);

  useFocusEffect(
    useCallback(() => {
      if (householdId) {
        loadItems();
      }
    }, [householdId, loadItems]),
  );

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) {
      return;
    }
    const newCompleted = !item.completed;

    setAnimatingItems(prev => new Set(prev).add(id));
    setTimeout(() => {
      setItems(prev =>
        prev.map(i => (i.id === id ? {...i, completed: newCompleted} : i)),
      );
      setAnimatingItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 500);

    await supabase
      .from('grocery_list_items')
      .update({completed: newCompleted, updated_at: new Date().toISOString()})
      .eq('id', id);
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('grocery_list_items').delete().eq('id', id);
  };

  const addItem = async () => {
    if (!newItemName.trim() || !householdId) {
      return;
    }

    const {data, error} = await supabase
      .from('grocery_list_items')
      .insert({
        household_id: householdId,
        name: newItemName.trim(),
        category: newItemCategory,
        completed: false,
        amount: newItemAmount.trim() || null,
      })
      .select('id, name, category, completed, amount')
      .single();

    if (!error && data) {
      setItems(prev => [
        ...prev,
        {
          ...data,
          amount: data.amount ?? '',
          category: data.category ?? 'Other',
        },
      ]);
    }

    setNewItemName('');
    setNewItemCategory('Other');
    setNewItemAmount('');
    setIsCategoryManuallySelected(false);
    setIsAddModalVisible(false);
  };

  const editItem = async () => {
    if (!editingItem || !newItemName.trim()) {
      return;
    }

    const updated = {
      name: newItemName.trim(),
      category: newItemCategory,
      amount: newItemAmount.trim() || null,
      updated_at: new Date().toISOString(),
    };

    setItems(prev =>
      prev.map(i =>
        i.id === editingItem.id
          ? {...i, ...updated, amount: updated.amount ?? ''}
          : i,
      ),
    );

    await supabase
      .from('grocery_list_items')
      .update(updated)
      .eq('id', editingItem.id);

    setNewItemName('');
    setNewItemCategory('Other');
    setNewItemAmount('');
    setIsCategoryManuallySelected(false);
    setEditingItem(null);
    setIsEditModalVisible(false);
  };

  const startEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemAmount(item.amount);
    setIsCategoryManuallySelected(true);
    setIsEditModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  }, [loadItems]);

  const clearCompletedItems = async () => {
    setItems(prev => prev.filter(i => !i.completed));
    if (householdId) {
      await supabase
        .from('grocery_list_items')
        .delete()
        .eq('household_id', householdId)
        .eq('completed', true);
    }
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
      <View>
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
                  color={theme.colors['toffee-400']}
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
              keyboardVerticalOffset={
                Platform.OS === 'ios' ? (isTablet() ? 0 : -50) : -30
              }
              style={styles(theme).keyboardAvoidingContainer}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View
                  style={[
                    styles(theme).modalContainer,
                    isTablet() && styles(theme).modalContainerTablet,
                  ]}>
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
                      placeholderTextColor={theme.colors['toffee-400']}
                      value={newItemName}
                      onChangeText={setNewItemName}
                      autoFocus
                    />
                    <TextInput
                      style={styles(theme).textInput}
                      placeholder="Amount (e.g., 2 lbs, 1 dozen)"
                      placeholderTextColor={theme.colors['toffee-400']}
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
                    <Pressable
                      style={({pressed}) => [
                        styles(theme).confirmButton,
                        pressed && {
                          backgroundColor: theme.colors['yellow-400'],
                        },
                      ]}
                      onPress={onSave}>
                      <Text
                        style={styles(theme).confirmButtonText}
                        numberOfLines={1}>
                        {buttonText}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const groupedItems = getItemsBySort();

  return (
    <View style={styles(theme).container}>
      {groupedItems.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles(theme).emptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors['toffee-400']}
            />
          }>
          <Text style={styles(theme).emptyText}>
            Your grocery list is empty
          </Text>
          <Text style={styles(theme).emptySubtext}>
            Your list is shared with your household
          </Text>
        </ScrollView>
      ) : (
        <>
          <View style={styles(theme).controlsContainer}>
            <FilterChip
              label="Category"
              selected={sortBy === 'category'}
              onPress={() => setSortBy('category')}
            />
            <FilterChip
              label="Checked"
              selected={sortBy === 'checked'}
              onPress={() => setSortBy('checked')}
            />
          </View>
          {hasCompletedItems && (
            <TouchableOpacity
              style={[styles(theme).clearButton]}
              onPress={clearCompletedItems}
              disabled={!hasCompletedItems}>
              <Text style={styles(theme).clearButtonText}>
                Clear checked items
              </Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={groupedItems}
            renderItem={renderCategorySection}
            keyExtractor={([category]) => category}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles(theme).listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors['toffee-400']}
              />
            }
          />
        </>
      )}

      <TouchableOpacity
        style={styles(theme).floatingAddButton}
        onPress={() => setIsAddModalVisible(true)}>
        <Ionicons name="add" size={28} color={theme.colors['on-yellow']} />
      </TouchableOpacity>
      {renderItemModal()}
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors['neutral-100'],
    },
    floatingAddButton: {
      position: 'absolute',
      bottom: 15,
      right: 15,
      backgroundColor: theme.colors['yellow-400'],
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      paddingBottom: 75,
    },
    controlsContainer: {
      flexDirection: 'row',
      marginHorizontal: 15,
      marginTop: 10,
      marginBottom: 5,
    },
    clearButton: {
      alignSelf: 'flex-end',
      marginRight: 15,
      marginTop: 5,
      paddingTop: 10,
      paddingBottom: 5,
    },
    clearButtonText: {
      ...theme.typography.h4,
      color: '#c0392b',
    },
    categoryHeader: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
      marginHorizontal: 15,
      marginTop: 15,
      marginBottom: 5,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 15,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
    },
    itemContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: theme.colors['yellow-400'],
      borderRadius: 14,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: theme.colors['yellow-400'],
      fontSize: 16,
      fontWeight: 'bold',
    },
    itemTextContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemText: {
      ...theme.typography['h4-emphasized'],
      color: theme.colors['neutral-800'],
    },
    amountText: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
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
      color: theme.colors['toffee-400'],
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
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
    modalContainerTablet: {
      maxWidth: MODAL_MAX_WIDTH,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    modalScrollContent: {
      flexGrow: 1,
    },
    modalTitle: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
    },
    categoryContainer: {
      marginBottom: 20,
    },
    categoryLabel: {
      ...theme.typography['h4-emphasized'],
      color: theme.colors['neutral-800'],
      marginBottom: 10,
    },
    categoryButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    categoryButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
    },
    selectedCategoryButton: {
      backgroundColor: theme.colors['yellow-400'],
      borderColor: theme.colors['yellow-400'],
    },
    categoryButtonText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
      fontSize: 12,
    },
    selectedCategoryButtonText: {
      color: theme.colors['on-yellow'],
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
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      alignItems: 'center',
    },
    cancelButtonText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      backgroundColor: theme.colors['neutral-800'],
      alignItems: 'center',
    },
    confirmButtonText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-100'],
      fontWeight: '500',
    },
    clearButtonHidden: {
      opacity: 0,
      pointerEvents: 'none',
    },
  });
