import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {Collection} from '../models';
import {useCollections} from '../context/CollectionsContext';

export default function CollectionsDrawer({
  navigation,
}: DrawerContentComponentProps) {
  const theme = useTheme() as unknown as Theme;
  const {collections, activeCollection, setActiveCollection, totalRecipeCount} =
    useCollections();

  const select = (collection: Collection | null) => {
    setActiveCollection(collection);
    navigation.closeDrawer();
  };

  const isAllActive = activeCollection === null;

  return (
    <SafeAreaView
      style={styles(theme).container}
      edges={['top', 'left', 'bottom']}>
      <View style={styles(theme).list}>
        <TouchableOpacity
          style={styles(theme).row}
          onPress={() => select(null)}
          activeOpacity={0.6}>
          <Text
            style={[
              styles(theme).rowLabel,
              isAllActive && styles(theme).rowLabelActive,
            ]}>
            All Recipes
          </Text>
          <View style={styles(theme).rowRight}>
            {totalRecipeCount > 0 && (
              <Text style={styles(theme).rowCount}>{totalRecipeCount}</Text>
            )}
            {isAllActive && (
              <Ionicons
                name="checkmark"
                size={16}
                color={theme.colors['neutral-800']}
              />
            )}
          </View>
        </TouchableOpacity>

        {collections.map(collection => {
          const isActive = activeCollection?.id === collection.id;
          return (
            <TouchableOpacity
              key={collection.id}
              style={styles(theme).row}
              onPress={() => select(collection)}
              activeOpacity={0.6}>
              <Text
                style={[
                  styles(theme).rowLabel,
                  isActive && styles(theme).rowLabelActive,
                ]}
                numberOfLines={1}>
                {collection.name}
              </Text>
              <View style={styles(theme).rowRight}>
                {!!collection.recipe_count && collection.recipe_count > 0 && (
                  <Text style={styles(theme).rowCount}>
                    {collection.recipe_count}
                  </Text>
                )}
                {isActive && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme.colors['neutral-800']}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* New collection — stub until Phase 3 */}
      <TouchableOpacity
        style={styles(theme).newRow}
        disabled
        activeOpacity={0.6}>
        <Ionicons name="add" size={18} color={theme.colors['toffee-400']} />
        <Text style={styles(theme).newRowLabel}>New collection</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors['neutral-100'],
    },
    list: {
      flex: 1,
      paddingTop: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    rowLabel: {
      flex: 1,
      ...theme.typography.h2,
      color: theme.colors['toffee-400'],
    },
    rowLabelActive: {
      color: theme.colors['neutral-800'],
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rowCount: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
    },
    newRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors['neutral-300'],
    },
    newRowLabel: {
      ...theme.typography.h2,
      color: theme.colors['toffee-400'],
    },
  });
