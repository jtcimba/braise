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
import CategoryEditor from './CategoryEditor';
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

  const handleCategoryUpdate = useCallback(
    (newCategories: string[]) => {
      onChangeEditingData((prevData: any) => ({
        ...prevData,
        category: newCategories.join(','),
      }));
    },
    [onChangeEditingData],
  );

  const categoriesArray = editingData.category
    ? editingData.category.split(',').filter((cat: string) => cat.trim())
    : [];

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
            {editingData.host && editingData.author && (
              <Text style={styles(theme).dot}>•</Text>
            )}
            <Text style={styles(theme).subtext}>{editingData.host}</Text>
          </View>
          <Text style={styles(theme).fieldLabel}>Recipe Name</Text>
          <TextInput
            style={[styles(theme).editText]}
            value={editingData.title}
            multiline={true}
            placeholder="Recipe name"
            onChangeText={text =>
              onChangeEditingData({...editingData, title: text})
            }
          />
          <Text style={styles(theme).fieldLabel}>Cooking Time</Text>
          <TextInput
            style={styles(theme).editText}
            value={editingData.total_time?.toString()}
            placeholder="Time to cook"
            onChangeText={text =>
              onChangeEditingData({...editingData, total_time: text})
            }
          />
          <Text style={styles(theme).fieldLabel}>Servings</Text>
          <TextInput
            style={styles(theme).editText}
            value={editingData.yields}
            placeholder="Servings"
            onChangeText={text =>
              onChangeEditingData({...editingData, yields: text})
            }
          />
          <Text style={styles(theme).fieldLabel}>Categories</Text>
          <CategoryEditor
            categories={categoriesArray}
            onChange={handleCategoryUpdate}
          />
          <Text style={styles(theme).fieldLabel}>Ingredients</Text>
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
          <Text style={styles(theme).fieldLabel}>Instructions</Text>
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
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 15,
      marginBottom: 5,
      color: theme.colors.text,
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
      // backgroundColor: theme.colors.backgroundText,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 15,
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
      paddingVertical: 5,
      marginBottom: 35,
      width: '100%',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    placeholder: {
      color: theme.colors.subtext,
      lineHeight: 30,
    },
  });
