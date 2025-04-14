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
import {useTheme} from '../../theme/ThemeProvider';

export default function RecipeEditor({editingData, onChangeEditingData}: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const theme = useTheme();

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
    <KeyboardAwareScrollView style={styles(theme).editContainer}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Image
            style={styles(theme).editImage}
            source={{
              uri: editingData.image ? editingData.image : null,
            }}
          />
          <View style={styles(theme).itemBody}>
            <Text style={styles(theme).subtext}>{editingData.author}</Text>
            {editingData.host && <Text style={styles(theme).dot}>•</Text>}
            <Text style={styles(theme).subtext}>{editingData.host}</Text>
          </View>
          <TextInput
            style={[styles(theme).editText]}
            value={editingData.title}
            multiline={true}
            placeholder="Recipe name"
            onChangeText={text =>
              onChangeEditingData({...editingData, title: text})
            }
          />
          <TextInput
            style={styles(theme).editText}
            value={editingData.total_time?.toString()}
            placeholder="Time to cook"
            onChangeText={text =>
              onChangeEditingData({...editingData, total_time: text})
            }
          />
          <TextInput
            style={styles(theme).editText}
            value={editingData.yields}
            placeholder="Servings"
            onChangeText={text =>
              onChangeEditingData({...editingData, yields: text})
            }
          />
          <TextInput
            style={styles(theme).editText}
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
            style={styles(theme).editInstructionContainer}
            onPress={() => setModalVisible(true)}>
            {editingData.instructions && (
              <View style={styles(theme).editLineContainer}>
                <Text style={styles(theme).lineNumber}>1.</Text>
                <Text
                  style={[styles(theme).editInstructions]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {editingData.instructions.split('\n')[0]}
                </Text>
              </View>
            )}
            {!editingData.instructions && (
              <Text style={styles(theme).placeholder}>1. Add instructions</Text>
            )}
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

const styles = (theme: any) =>
  StyleSheet.create({
    editContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    itemBody: {
      flex: 1,
      flexDirection: 'row',
    },
    subtext: {
      color: theme.colors.subtext,
      overflow: 'hidden',
    },
    dot: {
      marginHorizontal: 5,
      color: theme.colors.subtext,
    },
    editImage: {
      width: '100%',
      height: 235,
      marginTop: 100,
      marginBottom: 15,
      resizeMode: 'cover',
      borderRadius: 10,
      backgroundColor: theme.colors.backgroundText,
    },
    editText: {
      width: '100%',
      backgroundColor: theme.colors.backgroundText,
      borderRadius: 10,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 15,
      marginTop: 15,
      color: theme.colors.text,
    },
    editTitle: {
      fontSize: 16,
      paddingTop: 10,
      color: theme.colors.text,
    },
    editInstructions: {
      lineHeight: 30,
      paddingRight: 15,
      backgroundColor: 'transparent',
      color: theme.colors.text,
    },
    editLineContainer: {
      flexDirection: 'row',
    },
    lineNumber: {
      lineHeight: 30,
      marginRight: 10,
      color: theme.colors.subtext,
    },
    editInstructionContainer: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginBottom: 30,
      backgroundColor: theme.colors.backgroundText,
      width: '100%',
      borderRadius: 10,
      marginTop: 15,
    },
    placeholder: {
      color: theme.colors.subtext,
    },
  });
