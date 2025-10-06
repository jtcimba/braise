import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InstructionsEditor from './InstructionsEditor';
import CategoryEditor from './CategoryEditor';
import CustomToggle from './CustomToggle';
import ServingsPickerModal from './ServingsPickerModal';
import TotalTimePickerModal from './TotalTimePickerModal';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

export default function RecipeEditor({editingData, onChangeEditingData}: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [servingsModalVisible, setServingsModalVisible] = useState(false);
  const [totalTimeModalVisible, setTotalTimeModalVisible] = useState(false);
  const theme = useTheme() as unknown as Theme;

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

  const handleServingsUpdate = useCallback(
    (servings: string) => {
      onChangeEditingData((prevData: any) => ({
        ...prevData,
        yields: servings,
      }));
    },
    [onChangeEditingData],
  );

  const handleTotalTimeUpdate = useCallback(
    (time: string, unit: string) => {
      onChangeEditingData((prevData: any) => ({
        ...prevData,
        total_time: time,
        total_time_unit: unit,
      }));
    },
    [onChangeEditingData],
  );

  const categoriesArray = editingData.category
    ? editingData.category?.split(',').filter((cat: string) => cat.trim())
    : [];

  return (
    <KeyboardAvoidingView
      style={styles(theme).container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles(theme).contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles(theme).scrollContentContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <View style={styles(theme).headerContainer}>
              <TextInput
                style={styles(theme).titleInput}
                value={editingData.title}
                placeholder="Recipe name"
                placeholderTextColor={theme.colors.subtext}
                onChangeText={text =>
                  onChangeEditingData({...editingData, title: text})
                }
                multiline
              />
              <TextInput
                style={styles(theme).authorInput}
                value={editingData.author}
                placeholder="Author"
                placeholderTextColor={theme.colors.subtext}
                onChangeText={text =>
                  onChangeEditingData({...editingData, author: text})
                }
              />
            </View>
            <Image
              style={styles(theme).image}
              source={{
                uri: editingData.image ? editingData.image : null,
              }}
            />
            <View style={styles(theme).bodyContainer}>
              <View style={styles(theme).detailsContainer}>
                <View style={styles(theme).detailsRow}>
                  <TouchableOpacity
                    style={styles(theme).detailsTimeContainer}
                    onPress={() => setTotalTimeModalVisible(true)}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles(theme).detailsText}>
                      {editingData.total_time
                        ? editingData.total_time +
                          ' ' +
                          (editingData.total_time_unit || 'min')
                        : '-'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles(theme).detailsTimeContainer}
                    onPress={() => setServingsModalVisible(true)}>
                    <Ionicons
                      name="speedometer-outline"
                      size={20}
                      color={theme.colors.primary}
                      style={styles(theme).detailsIcon}
                    />
                    <Text style={styles(theme).detailsText}>
                      {editingData.yields || '-'} servings
                    </Text>
                  </TouchableOpacity>
                </View>
                <CategoryEditor
                  categories={categoriesArray}
                  onChange={handleCategoryUpdate}
                />
                <TextInput
                  style={styles(theme).aboutInput}
                  value={editingData.about}
                  placeholder="Add a description or notes about this recipe..."
                  placeholderTextColor={theme.colors.subtext}
                  onChangeText={(text: any) => {
                    onChangeEditingData({
                      ...editingData,
                      about: text,
                    });
                  }}
                  multiline
                  scrollEnabled={false}
                />
              </View>
              <View style={styles(theme).tabBarContainer}>
                <CustomToggle
                  value={false}
                  onValueChange={v => {
                    if (v) {
                      setModalVisible(true);
                    }
                  }}
                  leftLabel="Ingredients"
                  rightLabel="Directions"
                  textStyle="header"
                />
              </View>
              <View style={styles(theme).ingredientsContainer}>
                <TextInput
                  style={styles(theme).ingredientsInput}
                  value={editingData.ingredients}
                  placeholder="Enter ingredients, one per line..."
                  placeholderTextColor={theme.colors.subtext}
                  onChangeText={(text: any) => {
                    onChangeEditingData({
                      ...editingData,
                      ingredients: text,
                    });
                  }}
                  multiline
                  scrollEnabled={false}
                />
              </View>

              <InstructionsEditor
                instructions={editingData.instructions}
                handleInstructionsUpdate={handleInstructionUpdate}
                handleModalClose={() => setModalVisible(false)}
                modalVisible={modalVisible}
              />

              <ServingsPickerModal
                visible={servingsModalVisible}
                onClose={() => setServingsModalVisible(false)}
                onConfirm={handleServingsUpdate}
                currentValue={editingData.yields}
              />

              <TotalTimePickerModal
                visible={totalTimeModalVisible}
                onClose={() => setTotalTimeModalVisible(false)}
                onConfirm={handleTotalTimeUpdate}
                currentTime={editingData.total_time}
                currentUnit={editingData.total_time_unit}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flex: 1,
      marginTop: 105,
    },
    scrollContentContainer: {
      paddingBottom: 40,
    },
    headerContainer: {
      marginBottom: 10,
      paddingHorizontal: 25,
      paddingTop: 5,
    },
    image: {
      width: '100%',
      height: 325,
      resizeMode: 'cover',
      backgroundColor: theme.colors.border,
    },
    bodyContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 18,
      backgroundColor: theme.colors.background,
      minHeight: '100%',
    },
    detailsContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 7,
      padding: 15,
      marginBottom: 10,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      alignContent: 'center',
    },
    detailsTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
    },
    detailsText: {
      ...theme.typography.h5,
      color: theme.colors.text,
      marginLeft: 5,
    },
    detailsIcon: {
      marginRight: 3,
    },
    titleInput: {
      ...theme.typography.h1,
      color: theme.colors.text,
      marginBottom: 5,
      width: '100%',
      padding: 0,
      backgroundColor: 'transparent',
    },
    authorInput: {
      ...theme.typography.b1,
      color: theme.colors.primary,
      marginBottom: 5,
      backgroundColor: 'transparent',
    },
    sectionTitle: {
      ...theme.typography.h3,
      marginTop: 25,
      marginBottom: 10,
      color: theme.colors.subtext,
    },
    tabBarContainer: {
      marginTop: 10,
      marginBottom: 10,
    },
    ingredientsContainer: {
      flex: 1,
      marginBottom: 20,
    },
    ingredientsInput: {
      ...theme.typography.b1,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 15,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    aboutInput: {
      ...theme.typography.b2,
      color: theme.colors.text,
      marginTop: 5,
    },
    instructionsContainer: {
      flex: 1,
      marginTop: 8,
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
    editLineContainer: {
      flexDirection: 'row',
    },
    lineNumber: {
      ...theme.typography.b1,
      marginRight: 10,
      color: theme.colors.subtext,
    },
    editInstructions: {
      ...theme.typography.b1,
      flex: 1,
      color: theme.colors.text,
    },
    placeholder: {
      ...theme.typography.b1,
      color: theme.colors.subtext,
    },
    authorRow: {
      marginBottom: 10,
    },
  });
