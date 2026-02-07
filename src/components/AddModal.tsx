import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Linking} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAppDispatch} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';
import {Recipe} from '../models/index';

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddModal({visible, onClose}: AddModalProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme() as unknown as Theme;
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const newRecipe: Recipe = {
    id: '',
    title: '',
    author: '',
    host: '',
    image: '',
    total_time: '',
    total_time_unit: '',
    yields: '',
    ingredients: '',
    instructions: '',
    categories: '',
  };

  const handleOpenBrowser = () => {
    onClose();
    Linking.openURL('http://');
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      style={styles(theme).modalOverlay}>
      <View style={styles(theme).modalContainer}>
        {/* <View style={styles(theme).modalHandle} /> */}
        <TouchableOpacity style={styles(theme).closeButton} onPress={onClose}>
          <Ionicons
            name="close-outline"
            size={24}
            color={theme.colors['neutral-400']}
          />
        </TouchableOpacity>
        <Text style={styles(theme).modalTitle}>Add Recipe</Text>
        <TouchableOpacity
          style={styles(theme).modalButtonContainer}
          onPress={handleOpenBrowser}>
          <View style={styles(theme).modalButtonIcon}>
            <Ionicons
              name="globe-outline"
              size={24}
              color={theme.colors['neutral-800']}
            />
          </View>
          <View style={styles(theme).modalButtonTextContainer}>
            <Text style={styles(theme).modalButtonText}>Open browser</Text>
            <Text style={styles(theme).modalButtonSubtext}>
              Import recipes from your browser via share sheet
            </Text>
          </View>
          <Ionicons
            name="arrow-forward-outline"
            size={24}
            color={theme.colors['neutral-800']}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles(theme).modalButtonContainer}
          onPress={() => {
            onClose();
            dispatch(changeViewMode('edit'));
            navigation.navigate('RecipeDetailsScreen', {
              item: newRecipe,
            });
          }}>
          <View style={styles(theme).modalButtonIcon}>
            <Ionicons
              name="pencil-outline"
              size={24}
              color={theme.colors['neutral-800']}
            />
          </View>
          <View style={styles(theme).modalButtonTextContainer}>
            <Text style={styles(theme).modalButtonText}>Write your own</Text>
            <Text style={styles(theme).modalButtonSubtext}>
              Add custom ingredients and cooking steps from scratch
            </Text>
          </View>
          <Ionicons
            name="arrow-forward-outline"
            size={24}
            color={theme.colors['neutral-800']}
          />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalContainer: {
      backgroundColor: theme.colors['neutral-100'],
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      maxHeight: '95%',
      paddingBottom: 20,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors['neutral-300'],
      marginBottom: 8,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginLeft: 30,
      marginRight: 30,
      marginBottom: 25,
    },
    modalButtonIcon: {
      width: 48,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      ...theme.typography.h1,
      color: theme.colors['neutral-800'],
      textAlign: 'center',
      marginBottom: 20,
    },
    modalButtonTextContainer: {
      flex: 1,
    },
    modalButtonText: {
      ...theme.typography['h3-emphasized'],
      color: theme.colors['neutral-800'],
    },
    modalButtonSubtext: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
    },
    closeButton: {
      position: 'absolute',
      right: 12,
      top: 10,
      padding: 6,
      zIndex: 1,
    },
  });
