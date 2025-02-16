import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import InstructionsEditor from './InstructionsEditor';

export default function RecipeEditor({editingData, onChangeEditingData}: any) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleInstructionUpdate = useCallback(
    (newInstructions: string) => {
      onChangeEditingData((prevData: any) => ({
        ...prevData,
        instructions: newInstructions,
      }));
    },
    [onChangeEditingData],
  );

  return (
    <KeyboardAwareScrollView style={styles.editContainer}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Image
            style={styles.editImage}
            source={{
              uri: editingData.image ? editingData.image : null,
            }}
          />
          <View style={styles.itemBody}>
            <Text style={styles.subtext}>{editingData.author}</Text>
            {editingData.host && <Text style={styles.dot}>•</Text>}
            <Text style={styles.subtext}>{editingData.host}</Text>
          </View>
          <TextInput
            style={[styles.editText, styles.editTitle]}
            value={editingData.title}
            multiline={true}
            placeholder="Recipe name"
            onChangeText={text =>
              onChangeEditingData({...editingData, title: text})
            }
          />
          <TextInput
            style={styles.editText}
            value={editingData.total_time?.toString()}
            placeholder="Time to cook"
            onChangeText={text =>
              onChangeEditingData({...editingData, total_time: text})
            }
          />
          <TextInput
            style={styles.editText}
            value={editingData.yields}
            placeholder="Servings"
            onChangeText={text =>
              onChangeEditingData({...editingData, yields: text})
            }
          />
          <TextInput
            style={styles.editText}
            value={editingData.ingredients}
            placeholder="Ingredients, one per line"
            onChangeText={(text: any) => {
              onChangeEditingData({
                ...editingData,
                ingredients: text,
              });
            }}
            multiline
            scrollEnabled={false}
          />
          <TouchableOpacity
            style={styles.editInstructionContainer}
            onPress={() => setModalVisible(true)}>
            <View style={styles.editLineContainer}>
              {editingData.instructions && (
                <View>
                  <Text style={styles.lineNumber}>1.</Text>
                  <Text
                    style={[styles.editInstructions]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {editingData.instructions.split('\n')[0]}
                  </Text>
                </View>
              )}
              {!editingData.instructions && (
                <Text style={styles.placeholder}>1. Add instructions</Text>
              )}
            </View>
          </TouchableOpacity>
          <InstructionsEditor
            instructions={editingData.instructions}
            handleInstructionsUpdate={handleInstructionUpdate}
            handleModalClose={() => setModalVisible(false)}
            modalVisible={modalVisible}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  editContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemBody: {
    flex: 1,
    flexDirection: 'row',
  },
  subtext: {
    color: '#666',
    overflow: 'hidden',
  },
  dot: {
    marginHorizontal: 5,
  },
  editImage: {
    width: '100%',
    height: 235,
    marginTop: 100,
    marginBottom: 15,
    resizeMode: 'cover',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  editText: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  editTitle: {
    fontSize: 16,
    paddingTop: 10,
  },
  editInstructions: {
    lineHeight: 30,
    paddingRight: 15,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  editLineContainer: {
    flexDirection: 'row',
  },
  lineNumber: {
    lineHeight: 30,
    marginRight: 10,
    color: '#666',
  },
  editInstructionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
    borderRadius: 10,
    marginTop: 15,
  },
  placeholder: {
    color: 'rgba(0, 0, 0, 0.2)',
  },
});
