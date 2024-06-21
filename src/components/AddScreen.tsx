import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function AddScreen(size: number, color: string) {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}
        onPressIn={() => {}}
        activeOpacity={0.7}>
        <>
          <Ionicons name={'add-circle-outline'} color={color} size={size} />
        </>
      </TouchableOpacity>
      <View>
        <Modal
          backdropOpacity={0.3}
          isVisible={modalVisible}
          onBackdropPress={() => setModalVisible(false)}
          style={styles.contentView}>
          <View style={styles.content}>
            <Text style={styles.contentTitle}>Add recipe</Text>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
  },
  contentTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  contentView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});
