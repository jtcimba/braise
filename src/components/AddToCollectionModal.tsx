import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  FlatList,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useAddToCollectionModal} from '../context/AddToCollectionModalContext';
import {useCollections} from '../context/CollectionsContext';
import {collectionsService} from '../services/collectionsService';
import {isTablet, MODAL_MAX_WIDTH} from '../hooks/useTablet';
import CollectionNameSheet from './CollectionNameSheet';
import {Collection} from '../models';

export default function AddToCollectionModal() {
  const theme = useTheme() as unknown as Theme;
  const {isVisible: visible, recipeId, hideModal} = useAddToCollectionModal();
  const {collections, refreshCollections} = useCollections();
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [showNewSheet, setShowNewSheet] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible && recipeId) {
      collectionsService
        .fetchRecipeCollections(recipeId)
        .then(cols => setMemberIds(new Set(cols.map(c => c.id))))
        .catch(() => {});
    }
  }, [visible, recipeId]);

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

  const toggleMembership = async (collection: Collection) => {
    if (!recipeId) {
      return;
    }
    const isMember = memberIds.has(collection.id);
    try {
      if (isMember) {
        await collectionsService.removeRecipeFromCollection(
          recipeId,
          collection.id,
        );
        setMemberIds(prev => {
          const next = new Set(prev);
          next.delete(collection.id);
          return next;
        });
      } else {
        await collectionsService.addRecipeToCollection(recipeId, collection.id);
        setMemberIds(prev => new Set([...prev, collection.id]));
      }
      await refreshCollections();
    } catch {
      Alert.alert('Error', 'Failed to update collection.');
    }
  };

  const handleCreate = async (name: string) => {
    try {
      const newCollection = await collectionsService.createCollection(name);
      await refreshCollections();
      if (recipeId) {
        await collectionsService.addRecipeToCollection(
          recipeId,
          newCollection.id,
        );
        setMemberIds(prev => new Set([...prev, newCollection.id]));
        await refreshCollections();
      }
    } catch {
      Alert.alert('Error', 'Failed to create collection.');
    }
  };

  const renderCollection = ({item}: {item: Collection}) => {
    const isMember = memberIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles(theme).row}
        onPress={() => toggleMembership(item)}
        activeOpacity={0.7}>
        <Text style={styles(theme).rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <View
          style={[
            styles(theme).checkbox,
            isMember && styles(theme).checkboxChecked,
          ]}>
          {isMember && (
            <Ionicons
              name="checkmark"
              size={14}
              color={theme.colors['neutral-100']}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles(theme).overlay}>
      <TouchableWithoutFeedback onPress={hideModal}>
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
            <Text style={styles(theme).title}>Add to collection</Text>
          </View>
          <FlatList
            data={collections}
            keyExtractor={item => item.id}
            renderItem={renderCollection}
            style={styles(theme).list}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <TouchableOpacity
                style={[styles(theme).row, styles(theme).newCollectionRow]}
                onPress={() => setShowNewSheet(true)}
                activeOpacity={0.7}>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors['toffee-400']}
                  style={styles(theme).addIcon}
                />
                <Text style={styles(theme).newCollectionText}>
                  New collection
                </Text>
              </TouchableOpacity>
            }
          />
          <TouchableOpacity
            style={styles(theme).doneButton}
            onPress={hideModal}
            activeOpacity={0.7}>
            <Text style={styles(theme).doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <CollectionNameSheet
        visible={showNewSheet}
        onClose={() => setShowNewSheet(false)}
        onSubmit={handleCreate}
      />
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
      borderRadius: 25,
      padding: 20,
      width: '85%',
      maxWidth: isTablet() ? MODAL_MAX_WIDTH : 350,
    },
    header: {
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    list: {
      maxHeight: isTablet() ? 400 : 280,
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    rowName: {
      ...theme.typography.b1,
      color: theme.colors['neutral-800'],
      flex: 1,
      marginRight: 12,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.colors['neutral-800'],
      borderColor: theme.colors['neutral-800'],
    },
    newCollectionRow: {
      borderBottomWidth: 0,
      justifyContent: 'flex-start',
    },
    addIcon: {
      marginRight: 10,
    },
    newCollectionText: {
      ...theme.typography.h2,
      color: theme.colors['toffee-400'],
    },
    doneButton: {
      backgroundColor: theme.colors['neutral-800'],
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
    },
    doneButtonText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-100'],
    },
  });
