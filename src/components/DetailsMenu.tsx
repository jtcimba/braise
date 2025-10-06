import React, {useState} from 'react';
import {TouchableOpacity, StyleSheet, View, Text, Alert} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';
import {useEditingHandler} from '../context/EditingHandlerContext';
import {Theme} from '../../theme/types';
import {useTheme} from '../../theme/ThemeProvider';

export default function DetailsMenu(navigation: any) {
  const {colors} = useTheme() as unknown as Theme;
  const [modalVisible, setmodalVisible] = useState(false);
  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();
  const {handleSavePress, handleDeletePress} = useEditingHandler();

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
    if (viewMode === 'new') {
      navigation.navigate('Recipes');
    } else {
      dispatch(changeViewMode('view'));
    }
  };

  return (
    <>
      {viewMode === 'view' && (
        <View style={styles(colors).container}>
          <TouchableOpacity onPress={() => setmodalVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={25} color="#2D2D2D" />
          </TouchableOpacity>
        </View>
      )}
      {viewMode !== 'view' && (
        <View style={styles(colors).editContainer}>
          <View
            style={[styles(colors).container, styles(colors).buttonContainer]}>
            <TouchableOpacity onPress={onCancelPress}>
              <Text style={[styles(colors).text, styles(colors).cancel]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[styles(colors).container, styles(colors).saveContainer]}>
            <TouchableOpacity onPress={onSavePress}>
              <Text style={[styles(colors).text, styles(colors).save]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setmodalVisible(false)}
        onSwipeComplete={() => setmodalVisible(false)}
        swipeDirection={['down']}
        style={styles(colors).modalOverlay}>
        <View style={styles(colors).modal}>
          <View
            style={[styles(colors).optionsView, styles(colors).borderBottom]}>
            <Text style={styles(colors).optionsText}>Options</Text>
            <View style={[styles(colors).iconContainer]}>
              <TouchableOpacity onPress={() => setmodalVisible(false)}>
                <Ionicons name="close-outline" size={25} color="#2D2D2D" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles(colors).modalItem}
            onPress={onEditPress}>
            <Ionicons name="pencil" size={18} style={styles(colors).icon} />
            <Text style={styles(colors).editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles(colors).modalItem]}
            onPress={onDeletePress}>
            <Ionicons
              name="trash-outline"
              size={18}
              style={[styles(colors).icon, styles(colors).deleteIcon]}
            />
            <Text style={styles(colors).deleteText}>Delete Recipe</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = (colors: any) =>
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
      backgroundColor: colors.border,
    },
    saveContainer: {
      marginLeft: 10,
      backgroundColor: colors.primary,
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
    },
    cancel: {
      color: colors.text,
    },
    save: {
      color: colors.background,
    },
    modalOverlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modal: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.background,
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
      borderBottomColor: colors.border,
      paddingBottom: 10,
    },
    borderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
    },
    optionsText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    editText: {
      fontSize: 16,
      color: colors.text,
    },
    deleteText: {
      fontSize: 16,
      color: colors.notification,
    },
    deleteIcon: {
      color: colors.notification,
    },
    icon: {
      marginRight: 15,
      color: colors.text,
    },
    iconContainer: {
      borderRadius: 48,
      padding: 2,
    },
  });
