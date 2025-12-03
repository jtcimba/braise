import React, {useState} from 'react';
import {TouchableOpacity, StyleSheet, View, Text, Alert} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';
import {useEditingHandler} from '../context/EditingHandlerContext';
import {useGroceryListModal} from '../context/GroceryListModalContext';
import {Theme} from '../../theme/types';
import {useTheme} from '../../theme/ThemeProvider';

interface DetailsMenuProps {
  navigation: any;
  ingredients?: string;
  routeData?: any;
}

export default function DetailsMenu({
  navigation,
  ingredients = '',
  routeData = {},
}: DetailsMenuProps) {
  const theme = useTheme() as unknown as Theme;
  const [modalVisible, setmodalVisible] = useState(false);
  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();
  const {handleSavePress, handleDeletePress} = useEditingHandler();
  const {showModal} = useGroceryListModal();

  const onEditPress = () => {
    setmodalVisible(false);
    dispatch(changeViewMode('edit'));
  };

  const onDeletePress = () => {
    setmodalVisible(false);
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: handleDeletePress,
        },
      ],
    );
  };

  const onSavePress = () => {
    handleSavePress();
    dispatch(changeViewMode('view'));
  };

  const onCancelPress = () => {
    const isNewRecipe = !routeData.id || routeData.id === '';

    if (viewMode === 'new' || isNewRecipe) {
      navigation.navigate('Recipes');
    } else {
      dispatch(changeViewMode('view'));
    }
  };

  const onAddToGroceryListPress = () => {
    setmodalVisible(false);
    showModal(ingredients);
  };

  return (
    <>
      {viewMode === 'view' && (
        <View style={styles(theme).container}>
          <TouchableOpacity onPress={() => setmodalVisible(true)}>
            <Ionicons
              name="ellipsis-horizontal"
              size={25}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      )}
      {viewMode !== 'view' && (
        <View style={styles(theme).editContainer}>
          <View
            style={[styles(theme).container, styles(theme).buttonContainer]}>
            <TouchableOpacity onPress={onCancelPress}>
              <Text style={[styles(theme).text, styles(theme).cancel]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles(theme).container, styles(theme).saveContainer]}>
            <TouchableOpacity onPress={onSavePress}>
              <Text style={[styles(theme).text, styles(theme).save]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setmodalVisible(false)}
        onSwipeComplete={() => setmodalVisible(false)}
        swipeDirection={['down']}
        style={styles(theme).modalOverlay}>
        <View style={styles(theme).modal}>
          <View style={[styles(theme).optionsView, styles(theme).borderBottom]}>
            <Text style={styles(theme).optionsText}>Options</Text>
            <View style={[styles(theme).iconContainer]}>
              <TouchableOpacity onPress={() => setmodalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={25}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles(theme).modalItem}
            onPress={onAddToGroceryListPress}>
            <Ionicons name="list" size={18} style={styles(theme).icon} />
            <Text style={styles(theme).editText}>Add to Grocery List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles(theme).modalItem}
            onPress={onEditPress}>
            <Ionicons name="pencil" size={18} style={styles(theme).icon} />
            <Text style={styles(theme).editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles(theme).modalItem]}
            onPress={onDeletePress}>
            <Ionicons
              name="trash-outline"
              size={18}
              style={[styles(theme).icon, styles(theme).deleteIcon]}
            />
            <Text style={styles(theme).deleteText}>Delete Recipe</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      borderRadius: 48,
      paddingTop: 2,
      paddingLeft: 1,
      paddingBottom: 2,
      paddingRight: 3,
    },
    buttonContainer: {
      minWidth: 70,
      backgroundColor: theme.colors.border,
    },
    saveContainer: {
      marginLeft: 10,
      backgroundColor: theme.colors.primary,
      color: 'white',
      minWidth: 70,
    },
    editContainer: {
      flexDirection: 'row',
    },
    text: {
      paddingTop: 2,
      paddingLeft: 7,
      paddingBottom: 2,
      paddingRight: 7,
      textAlign: 'center',
      ...theme.typography.h5,
    },
    cancel: {
      color: theme.colors.text,
    },
    save: {
      color: theme.colors.background,
    },
    modalOverlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modal: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.background,
      position: 'absolute',
      top: 450,
      zIndex: 12000,
      borderRadius: 25,
      paddingStart: 25,
      paddingEnd: 20,
      paddingTop: 10,
    },
    optionsView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 10,
    },
    borderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 10,
    },
    borderTop: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 10,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
    },
    optionsText: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    editText: {
      ...theme.typography.h5,
      color: theme.colors.text,
    },
    deleteText: {
      ...theme.typography.h5,
      color: theme.colors.notification,
    },
    deleteIcon: {
      color: theme.colors.notification,
    },
    icon: {
      marginRight: 15,
      color: theme.colors.text,
    },
    iconContainer: {
      borderRadius: 48,
      padding: 2,
    },
  });
