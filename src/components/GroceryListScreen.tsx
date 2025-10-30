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
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  amount: string;
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
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
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
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 500);
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
      setEditingItem(null);
      setIsEditModalVisible(false);
    }
  };

  const startEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemAmount(item.amount);
    setIsEditModalVisible(true);
  };

  const getItemsByCategory = () => {
    const activeItems = items.filter(item => !item.completed);
    const groupedItems: {[key: string]: GroceryItem[]} = {};

    activeItems.forEach(item => {
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
                }}>
                {(groceryItem.completed ||
                  animatingItems.has(groceryItem.id)) && (
                  <Text style={styles(theme).checkmark}>✓</Text>
                )}
              </TouchableOpacity>
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
                            onPress={() => setNewItemCategory(category)}>
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

  const groupedItems = getItemsByCategory();

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
        <FlatList
          data={groupedItems}
          renderItem={renderCategorySection}
          keyExtractor={([category]) => category}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles(theme).listContainer}
        />
      )}

      <TouchableOpacity
        style={styles(theme).floatingAddButton}
        onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles(theme).floatingAddButtonText}>+</Text>
      </TouchableOpacity>

      {renderItemModal()}
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
    },
    checkbox: {
      width: 24,
      height: 24,
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
    itemText: {
      ...theme.typography.h4,
      color: theme.colors.text,
      flex: 1,
    },
    amountText: {
      ...theme.typography.h5,
      color: theme.colors.subtext,
      marginLeft: 8,
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
      borderRadius: 20,
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
      borderRadius: 16,
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
      borderRadius: 10,
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
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      ...theme.typography.h4,
      color: theme.colors.background,
      fontWeight: '500',
    },
  });
