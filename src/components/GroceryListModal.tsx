import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useGroceryListModal} from '../context/GroceryListModalContext';
import {
  parseIngredient,
  combineAmounts,
  categorizeIngredient,
} from '../services';

interface Ingredient {
  id: string;
  name: string;
  amount?: string;
}

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  amount: string;
}

const STORAGE_KEY = 'grocery_list_items';

export default function GroceryListModal() {
  const theme = useTheme() as unknown as Theme;
  const {isVisible: visible, ingredients, hideModal} = useGroceryListModal();
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set(),
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const parseIngredients = (ingredientsString: string): Ingredient[] => {
    if (!ingredientsString) {
      return [];
    }

    return ingredientsString
      .split('\n')
      .filter((ingredient: string) => ingredient.trim())
      .map((ingredient: string, index: number) => {
        const {quantity, unit, text} = parseIngredient(ingredient);
        return {
          id: `ingredient-${index}`,
          name: text,
          amount: quantity && unit ? `${quantity} ${unit}` : quantity || '',
        };
      });
  };

  const parsedIngredients = parseIngredients(ingredients);

  useEffect(() => {
    if (visible) {
      setSelectedIngredients(new Set());
    }
  }, [visible]);

  const toggleIngredient = (id: string) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleClose = () => {
    hideModal();
  };

  const handleConfirm = async () => {
    const ingredientsToAdd =
      selectedIngredients.size === 0
        ? parsedIngredients
        : parsedIngredients.filter(ingredient =>
            selectedIngredients.has(ingredient.id),
          );

    try {
      const storedItems = await AsyncStorage.getItem(STORAGE_KEY);
      const existingItems: GroceryItem[] = storedItems
        ? JSON.parse(storedItems)
        : [];

      const existingItemsMap = new Map<string, GroceryItem>();
      existingItems.forEach(item => {
        const normalizedName = item.name.toLowerCase().trim();
        existingItemsMap.set(normalizedName, item);
      });

      const updatedItems = [...existingItems];
      const newItems: GroceryItem[] = [];

      ingredientsToAdd.forEach(ingredient => {
        const normalizedName = ingredient.name.toLowerCase().trim();
        const existingItem = existingItemsMap.get(normalizedName);

        if (existingItem && ingredient.amount) {
          const combinedAmount = combineAmounts(
            existingItem.amount,
            ingredient.amount,
          );
          existingItem.amount = combinedAmount;
        } else if (!existingItem) {
          const newItem: GroceryItem = {
            id: Date.now().toString() + Math.random().toString(),
            name: ingredient.name.trim(),
            category: categorizeIngredient(ingredient.name),
            completed: false,
            amount: ingredient.amount || '',
          };
          newItems.push(newItem);
        }
      });

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...updatedItems, ...newItems]),
      );

      handleClose();
    } catch (error) {
      console.error('Error adding to grocery list:', error);
      handleClose();
    }
  };

  const renderIngredient = ({item}: {item: Ingredient}) => (
    <TouchableOpacity
      style={styles(theme).ingredientItem}
      onPress={() => toggleIngredient(item.id)}>
      <View style={styles(theme).ingredientContent}>
        <View style={styles(theme).checkbox}>
          {selectedIngredients.has(item.id) && (
            <Text style={styles(theme).checkmark}>✓</Text>
          )}
        </View>
        <View style={styles(theme).ingredientText}>
          <Text style={styles(theme).ingredientName}>{item.name}</Text>
          {item.amount && (
            <Text style={styles(theme).ingredientAmount}>{item.amount}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles(theme).overlay}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles(theme).overlayBackground} />
      </TouchableWithoutFeedback>
      <View style={styles(theme).modalWrapper}>
        <Animated.View
          style={[
            styles(theme).modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles(theme).header}>
            <Text style={styles(theme).title}>Add to Grocery List</Text>
          </View>

          <View style={styles(theme).ingredientsContainer}>
            <Text style={styles(theme).subtitle}>
              Select ingredients to add, or add all:
            </Text>
            <FlatList
              data={parsedIngredients}
              renderItem={({item}) => renderIngredient({item})}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              style={styles(theme).ingredientsList}
            />
          </View>

          <View style={styles(theme).buttonContainer}>
            <TouchableOpacity
              style={styles(theme).cancelButton}
              onPress={handleClose}>
              <Text style={styles(theme).cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles(theme).confirmButton}
              onPress={handleConfirm}>
              <Text
                style={styles(theme).confirmButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}>
                {selectedIngredients.size === 0
                  ? 'Add all'
                  : `Add selected (${selectedIngredients.size})`}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    overlayBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.h4,
      color: theme.colors.subtext,
      marginBottom: 15,
    },
    ingredientsContainer: {
      marginBottom: 20,
    },
    ingredientsList: {
      maxHeight: 300,
    },
    ingredientItem: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    ingredientContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 4,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    ingredientText: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ingredientName: {
      ...theme.typography.h4,
      color: theme.colors.text,
      flex: 1,
      marginRight: 10,
      flexWrap: 'wrap',
    },
    ingredientAmount: {
      ...theme.typography.h5,
      color: theme.colors.subtext,
      flexShrink: 0,
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
