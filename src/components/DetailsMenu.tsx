import React, {useState} from 'react';
import {TouchableOpacity, StyleSheet, View, Text} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAppDispatch, useAppSelector} from '../hooks';
import {changeViewMode} from '../features/viewModeSlice';
import {useTheme} from '@react-navigation/native';
import {useEditingHandler} from '../EditingHandlerContext';

export default function DetailsMenu() {
  const {colors} = useTheme();
  const [modalVisible, setmodalVisible] = useState(false);
  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();
  const {handleSavePress} = useEditingHandler();

  const handleEditPress = () => {
    setmodalVisible(false);
    dispatch(changeViewMode('edit'));
  };

  const handleDeletePress = () => {
    setmodalVisible(false);
    console.log('Delete option pressed');
  };

  const onPress = () => {
    handleSavePress();
    dispatch(changeViewMode('view'));
  };

  const handleCancelPress = () => {
    dispatch(changeViewMode('view'));
    console.log('Cancel option pressed');
  };

  return (
    <>
      {viewMode === 'view' && (
        <View style={styles(colors).container}>
          <TouchableOpacity onPress={() => setmodalVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={22} color="white" />
          </TouchableOpacity>
        </View>
      )}
      {viewMode === 'edit' && (
        <View style={styles(colors).editContainer}>
          <View style={styles(colors).container}>
            <TouchableOpacity onPress={handleCancelPress}>
              <Text style={[styles(colors).text, styles(colors).cancel]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[styles(colors).container, styles(colors).saveContainer]}>
            <TouchableOpacity onPress={onPress}>
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
            <TouchableOpacity onPress={() => setmodalVisible(false)}>
              <Ionicons name="close-circle" size={25} color="gray" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles(colors).modalItem}
            onPress={handleEditPress}>
            <Ionicons name="pencil" size={16} style={styles(colors).icon} />
            <Text style={styles(colors).editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles(colors).modalItem]}
            onPress={handleDeletePress}>
            <Ionicons
              name="trash-outline"
              size={16}
              color="red"
              style={styles(colors).icon}
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
      backgroundColor: colors.opaque,
      borderRadius: 50,
      paddingTop: 2,
      paddingLeft: 1,
      paddingBottom: 2,
      paddingRight: 3,
    },
    saveContainer: {
      marginLeft: 10,
      backgroundColor: colors.primary,
      color: 'white',
    },
    editContainer: {
      flexDirection: 'row',
    },
    text: {
      paddingTop: 2,
      paddingLeft: 7,
      paddingBottom: 2,
      paddingRight: 5,
    },
    cancel: {
      color: 'white',
    },
    save: {
      color: 'white',
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
      borderBottomColor: '#D4D4D4',
      paddingBottom: 10,
    },
    borderTop: {
      borderTopWidth: 1,
      borderTopColor: '#D4D4D4',
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
    },
    editText: {
      fontSize: 16,
    },
    deleteText: {
      fontSize: 16,
      color: 'red',
    },
    icon: {
      marginRight: 15,
    },
  });
