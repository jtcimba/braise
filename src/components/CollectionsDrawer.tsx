import React, {useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {Swipeable} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {Collection} from '../models';
import {useCollections} from '../context/CollectionsContext';
import {collectionsService} from '../services/collectionsService';
import CollectionNameSheet from './CollectionNameSheet';

export default function CollectionsDrawer({
  navigation,
}: DrawerContentComponentProps) {
  const theme = useTheme() as unknown as Theme;
  const {
    collections,
    activeCollection,
    setActiveCollection,
    refreshCollections,
    totalRecipeCount,
  } = useCollections();
  const [showNewSheet, setShowNewSheet] = useState(false);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const select = (collection: Collection | null) => {
    setActiveCollection(collection);
    navigation.closeDrawer();
  };

  const handleCreate = async (name: string) => {
    try {
      const newCollection = await collectionsService.createCollection(name);
      await refreshCollections();
      setActiveCollection(newCollection);
      navigation.closeDrawer();
    } catch {
      Alert.alert('Error', 'Failed to create collection.');
    }
  };

  const confirmDelete = (collection: Collection) => {
    swipeableRefs.current.get(collection.id)?.close();
    Alert.alert(
      `Delete "${collection.name}"?`,
      'Recipes stay in your library — only the collection is removed.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await collectionsService.deleteCollection(collection.id);
              if (activeCollection?.id === collection.id) {
                setActiveCollection(null);
              }
              await refreshCollections();
            } catch {
              Alert.alert('Error', 'Failed to delete collection.');
            }
          },
        },
      ],
    );
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
            <Swipeable
              key={collection.id}
              ref={ref => {
                if (ref) {
                  swipeableRefs.current.set(collection.id, ref);
                } else {
                  swipeableRefs.current.delete(collection.id);
                }
              }}
              renderRightActions={() => (
                <TouchableOpacity
                  style={styles(theme).deleteAction}
                  onPress={() => confirmDelete(collection)}
                  activeOpacity={0.8}>
                  <Text style={styles(theme).deleteActionText}>Delete</Text>
                </TouchableOpacity>
              )}>
              <TouchableOpacity
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
            </Swipeable>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles(theme).newRow}
        onPress={() => setShowNewSheet(true)}
        activeOpacity={0.6}>
        <Ionicons name="add" size={18} color={theme.colors['toffee-400']} />
        <Text style={styles(theme).newRowLabel}>New collection</Text>
      </TouchableOpacity>

      <CollectionNameSheet
        visible={showNewSheet}
        onClose={() => setShowNewSheet(false)}
        onSubmit={handleCreate}
      />
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
      backgroundColor: theme.colors['neutral-100'],
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
    deleteAction: {
      backgroundColor: theme.colors.notification ?? '#FF3B30',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    deleteActionText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-100'],
      fontWeight: '600',
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
