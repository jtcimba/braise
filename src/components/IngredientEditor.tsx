import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {TouchableOpacity, ScrollView} from 'react-native-gesture-handler';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {RecipeIngredient} from '../models';

type IngredientRow = {
  id: string;
  amount: string;
  name: string;
};

const fromRecipeIngredients = (
  ingredients: RecipeIngredient[],
): IngredientRow[] =>
  ingredients.map(r => ({
    id: r.id,
    amount: [r.amount, r.unit].filter(Boolean).join(' '),
    name: r.name,
  }));

export default function IngredientEditor({
  ingredients,
  onChange,
  scrollViewRef,
}: {
  ingredients: RecipeIngredient[];
  onChange: (rows: IngredientRow[]) => void;
  scrollViewRef?: React.RefObject<ScrollView>;
}) {
  const theme = useTheme() as unknown as Theme;

  const initialRows = fromRecipeIngredients(ingredients);
  const [rows, setRows] = useState<IngredientRow[]>(initialRows);
  const nextId = useRef(initialRows.length);
  const amountRefs = useRef<Map<string, TextInput | null>>(new Map());
  const textRefs = useRef<Map<string, TextInput | null>>(new Map());

  const commit = useCallback(
    (newRows: IngredientRow[]) => {
      setRows(newRows);
      onChange(newRows);
    },
    [onChange],
  );

  const updateField = useCallback(
    (id: string, field: keyof Omit<IngredientRow, 'id'>, value: string) => {
      commit(rows.map(r => (r.id === id ? {...r, [field]: value} : r)));
    },
    [rows, commit],
  );

  const deleteRow = useCallback(
    (id: string) => {
      amountRefs.current.delete(id);
      textRefs.current.delete(id);
      commit(rows.filter(r => r.id !== id));
    },
    [rows, commit],
  );

  const addRow = useCallback(() => {
    const id = String(Date.now()) + String(nextId.current++);
    const newRows = [...rows, {id, amount: '', name: ''}];
    commit(newRows);
    // Defer focus until after the new row has mounted
    setTimeout(() => amountRefs.current.get(id)?.focus(), 50);
  }, [rows, commit]);

  const focusNext = useCallback(
    (id: string, field: 'amount' | 'name') => {
      if (field === 'amount') {
        textRefs.current.get(id)?.focus();
      } else {
        const idx = rows.findIndex(r => r.id === id);
        if (idx < rows.length - 1) {
          amountRefs.current.get(rows[idx + 1].id)?.focus();
        } else {
          addRow();
        }
      }
    },
    [rows, addRow],
  );

  const renderItem = useCallback(
    ({item, drag, isActive, getIndex}: RenderItemParams<IngredientRow>) => {
      const isLast = (getIndex() ?? 0) === rows.length - 1;
      const isRaw = item.id.startsWith('raw-');
      return (
        <ScaleDecorator>
          <View
            style={[
              styles(theme).row,
              isActive && styles(theme).rowActive,
              !isLast && styles(theme).rowDivider,
            ]}>
            <TouchableOpacity
              onLongPress={drag}
              hitSlop={8}
              style={styles(theme).dragHandle}>
              <Ionicons
                name="reorder-three-outline"
                size={22}
                color={theme.colors['neutral-300']}
              />
            </TouchableOpacity>
            {!isRaw && (
              <>
                <TextInput
                  ref={ref => amountRefs.current.set(item.id, ref)}
                  style={styles(theme).amountInput}
                  value={item.amount}
                  placeholder="Amount"
                  placeholderTextColor={theme.colors['neutral-300']}
                  onChangeText={v => updateField(item.id, 'amount', v)}
                  returnKeyType="next"
                  onSubmitEditing={() => focusNext(item.id, 'amount')}
                  blurOnSubmit={false}
                />
                <View style={styles(theme).separator} />
              </>
            )}
            <TextInput
              ref={ref => textRefs.current.set(item.id, ref)}
              style={styles(theme).nameInput}
              value={item.name}
              placeholder="Ingredient"
              placeholderTextColor={theme.colors['neutral-300']}
              onChangeText={v => {
                if (v.includes('\n')) {
                  focusNext(item.id, 'name');
                } else {
                  updateField(item.id, 'name', v);
                }
              }}
              multiline
              scrollEnabled={false}
              blurOnSubmit={false}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles(theme).deleteButton}
              onPress={() => deleteRow(item.id)}>
              <Ionicons
                name="close-outline"
                size={20}
                color={theme.colors['neutral-300']}
              />
            </TouchableOpacity>
          </View>
        </ScaleDecorator>
      );
    },
    [theme, rows, updateField, deleteRow, focusNext],
  );

  return (
    <View style={styles(theme).container}>
      <DraggableFlatList
        data={rows}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onDragEnd={({data}) => commit(data)}
        scrollEnabled={false}
        activationDistance={10}
        simultaneousHandlers={scrollViewRef}
      />
      <TouchableOpacity style={styles(theme).addButton} onPress={addRow}>
        <Ionicons
          name="add-outline"
          size={18}
          color={theme.colors['toffee-400']}
        />
        <Text style={styles(theme).addButtonText}>Add ingredient</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 8,
      marginBottom: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
    },
    rowActive: {
      backgroundColor: theme.colors['neutral-300'],
      opacity: 0.9,
    },
    dragHandle: {
      paddingRight: 8,
      justifyContent: 'center',
    },
    separator: {
      width: 1,
      height: 18,
      backgroundColor: theme.colors['neutral-300'],
      marginHorizontal: 8,
    },
    amountInput: {
      ...theme.typography['h4-emphasized'],
      color: theme.colors['neutral-800'],
      width: 60,
      padding: 0,
    },
    nameInput: {
      ...theme.typography.b1,
      color: theme.colors['neutral-800'],
      flex: 1,
      padding: 0,
      marginTop: -4,
    },
    deleteButton: {
      paddingLeft: 8,
      justifyContent: 'center',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors['neutral-300'],
    },
    addButtonText: {
      ...theme.typography.b1,
      color: theme.colors['toffee-400'],
      marginLeft: 4,
    },
  });
