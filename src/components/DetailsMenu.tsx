import React, {useState} from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAppDispatch, useAppSelector} from '../hooks';
import {changeViewMode} from '../features/viewModeSlice';
import {useTheme} from '@react-navigation/native';

export default function DetailsMenu() {
  const {colors} = useTheme();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();

  const handleEditPress = () => {
    setDropdownVisible(false);
    dispatch(changeViewMode('edit'));
    console.log('Edit option pressed');
  };

  const handleDeletePress = () => {
    setDropdownVisible(false);
    console.log('Delete option pressed');
  };

  const handleSavePress = () => {
    dispatch(changeViewMode('view'));
    console.log('Save option pressed');
  };

  const handleUndoPress = () => {
    dispatch(changeViewMode('view'));
    console.log('Undo option pressed');
  };

  return (
    <>
      {viewMode === 'view' && (
        <View style={styles(colors).container}>
          <TouchableOpacity onPress={() => setDropdownVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={22} color="gray" />
          </TouchableOpacity>
        </View>
      )}
      {viewMode === 'edit' && (
        <View style={styles(colors).editContainer}>
          <View style={styles(colors).container}>
            <TouchableOpacity onPress={handleUndoPress}>
              <Text style={[styles(colors).text, styles(colors).undo]}>
                Undo
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[styles(colors).container, styles(colors).saveContainer]}>
            <TouchableOpacity onPress={handleSavePress}>
              <Text style={[styles(colors).text, styles(colors).save]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {dropdownVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={dropdownVisible}
          onRequestClose={() => setDropdownVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
            <View style={styles(colors).modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles(colors).dropdown}>
            <TouchableOpacity
              style={styles(colors).dropdownItem}
              onPress={handleEditPress}>
              <Text style={styles(colors).dropdownItemText}>Edit</Text>
              <Ionicons
                name="pencil"
                size={16}
                style={styles(colors).icon}
                color="gray"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles(colors).dropdownItem}
              onPress={handleDeletePress}>
              <Text
                style={[
                  styles(colors).dropdownItemText,
                  styles(colors).deleteText,
                ]}>
                Delete Recipe
              </Text>
              <Ionicons
                name="trash-outline"
                size={16}
                color="red"
                style={styles(colors).icon}
              />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#EBE9E5',
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
    undo: {
      color: 'gray',
    },
    save: {
      color: 'white',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dropdown: {
      position: 'absolute',
      right: 10,
      top: 30,
      backgroundColor: 'white',
      borderRadius: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
    },
    dropdownItemText: {
      fontSize: 16,
      color: 'gray',
    },
    deleteText: {
      color: 'red',
      marginRight: 5,
    },
    icon: {
      marginLeft: 5,
    },
  });
