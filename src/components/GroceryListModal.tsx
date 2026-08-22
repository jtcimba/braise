import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  FlatList,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useGroceryListModal} from '../context/GroceryListModalContext';
import {combineAmounts, categorizeIngredient} from '../services';
import {isTablet, MODAL_MAX_WIDTH} from '../hooks/useTablet';
import {RecipeIngredient} from '../models';
import {useHousehold} from '../hooks/useHousehold';
import {supabase} from '../supabase-client';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
}

function toGroceryIngredients(rows: RecipeIngredient[]): Ingredient[] {
  return rows.map(row => ({
    id: row.id,
    name: row.base_name,
    amount:
      row.amount && row.unit ? `${row.amount} ${row.unit}` : row.amount || '',
  }));
}

export default function GroceryListModal() {
  const theme = useTheme() as unknown as Theme;
  const {householdId} = useHousehold();
  const {
    isVisible: visible,
    structuredIngredients,
    hideModal,
  } = useGroceryListModal();
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set(),
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  const parsedIngredients = useMemo(
    () => toGroceryIngredients(structuredIngredients),
    [structuredIngredients],
  );

  useEffect(() => {
    if (visible && structuredIngredients.length > 0) {
      setSelectedIngredients(
        new Set(parsedIngredients.map(ingredient => ingredient.id)),
      );
    }
  }, [visible, structuredIngredients, parsedIngredients]);

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
        ? []
        : parsedIngredients.filter(ingredient =>
            selectedIngredients.has(ingredient.id),
          );

    if (ingredientsToAdd.length === 0 || !householdId) {
      handleClose();
      return;
    }

    try {
      const {data: existingRows} = await supabase
        .from('grocery_list_items')
        .select('id, name, amount')
        .eq('household_id', householdId);

      const existingItems: GroceryItem[] = (existingRows ?? []).map(row => ({
        id: row.id,
        name: row.name,
        amount: row.amount ?? '',
      }));

      const existingMap = new Map<string, GroceryItem>();
      existingItems.forEach(item => {
        existingMap.set(item.name.toLowerCase().trim(), item);
      });

      const toUpdate: {id: string; amount: string}[] = [];
      const toInsert: {
        household_id: string;
        name: string;
        amount: string | null;
        category: string;
        completed: boolean;
      }[] = [];
      const newItemNames = new Map<string, (typeof toInsert)[0]>();

      ingredientsToAdd.forEach(ingredient => {
        const key = ingredient.name.toLowerCase().trim();
        const existingItem = existingMap.get(key);

        if (existingItem && ingredient.amount) {
          const combined = combineAmounts(
            existingItem.amount,
            ingredient.amount,
          );
          toUpdate.push({id: existingItem.id, amount: combined});
          existingItem.amount = combined;
        } else if (!existingItem) {
          const existingNew = newItemNames.get(key);
          if (existingNew && ingredient.amount) {
            existingNew.amount = combineAmounts(
              existingNew.amount ?? '',
              ingredient.amount,
            );
          } else if (!existingNew) {
            const newItem = {
              household_id: householdId,
              name: ingredient.name.trim(),
              category: categorizeIngredient(ingredient.name),
              completed: false,
              amount: ingredient.amount || null,
            };
            toInsert.push(newItem);
            newItemNames.set(key, newItem);
          }
        }
      });

      await Promise.all([
        ...toUpdate.map(({id, amount}) =>
          supabase
            .from('grocery_list_items')
            .update({amount, updated_at: new Date().toISOString()})
            .eq('id', id),
        ),
        toInsert.length > 0
          ? supabase.from('grocery_list_items').insert(toInsert)
          : Promise.resolve(),
      ]);

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
          {item.amount ? (
            <Text style={styles(theme).ingredientAmount}>{item.amount}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
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
      }).start(({finished}) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible, fadeAnim]);

  if (!shouldRender) {
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
            <Text style={styles(theme).title}>Add to grocery list</Text>
          </View>

          <View style={styles(theme).ingredientsContainer}>
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
            <Pressable
              style={({pressed}) => [
                styles(theme).confirmButton,
                pressed && {backgroundColor: theme.colors['yellow-400']},
              ]}
              onPress={handleConfirm}>
              <Text
                style={styles(theme).confirmButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}>
                {selectedIngredients.size === parsedIngredients.length &&
                parsedIngredients.length > 0
                  ? 'Add all'
                  : `Add (${selectedIngredients.size})`}
              </Text>
            </Pressable>
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
      borderRadius: 16,
      padding: 20,
      width: '85%',
      maxWidth: isTablet() ? MODAL_MAX_WIDTH : 350,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    ingredientsContainer: {
      marginBottom: 20,
    },
    ingredientsList: {
      maxHeight: isTablet() ? 450 : 300,
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
      borderColor: theme.colors['yellow-400'],
      borderRadius: 4,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: theme.colors['yellow-400'],
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
      ...theme.typography.b1,
      color: theme.colors['neutral-800'],
      flex: 1,
      marginRight: 10,
      flexWrap: 'wrap',
    },
    ingredientAmount: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
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
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      alignItems: 'center',
    },
    cancelButtonText: {
      ...theme.typography.h2,
      color: theme.colors['neutral-800'],
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 26,
      backgroundColor: theme.colors['neutral-800'],
      alignItems: 'center',
    },
    confirmButtonText: {
      ...theme.typography.h2,
      color: theme.colors['neutral-100'],
      fontWeight: '500',
    },
  });
