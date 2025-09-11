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
        contentContainerStyle={styles(theme).scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <View style={styles(theme).imageContainer}>
              <Image
                style={styles(theme).image}
                source={{
                  uri: editingData.image ? editingData.image : null,
                }}
              />
            </View>
            <View style={styles(theme).bodyContainer}>
              <View style={styles(theme).headerRow}>
                <View style={styles(theme).flex}>
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
                    style={styles(theme).subtextInput}
                    value={editingData.author}
                    placeholder="Author"
                    placeholderTextColor={theme.colors.subtext}
                    onChangeText={text =>
                      onChangeEditingData({...editingData, author: text})
                    }
                  />
                  <TextInput
                    style={styles(theme).subtextInput}
                    value={editingData.host}
                    placeholder="Source website"
                    placeholderTextColor={theme.colors.subtext}
                    onChangeText={text =>
                      onChangeEditingData({...editingData, host: text})
                    }
                  />
                </View>
                <View style={styles(theme).metaBadgeCol}>
                  <TouchableOpacity
                    style={styles(theme).metaBadgeRect}
                    onPress={() => setServingsModalVisible(true)}>
                    <Text style={styles(theme).metaBadgeValue}>
                      {editingData.yields || '-'}
                    </Text>
                    <Text style={styles(theme).metaBadgeLabel}>servings</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles(theme).metaBadgeRect}
                    onPress={() => setTotalTimeModalVisible(true)}>
                    <Text style={styles(theme).metaBadgeValue}>
                      {editingData.total_time || '-'}
                    </Text>
                    <Text style={styles(theme).metaBadgeLabel}>
                      {editingData.total_time_unit || '-'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
              <View style={styles(theme).tabBarContainer}>
                <CustomToggle
                  type="tab"
                  value={false}
                  onValueChange={v => {
                    if (v) {
                      setModalVisible(true);
                    }
                  }}
                  leftLabel="Ingredients"
                  rightLabel="Directions"
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
    scrollContent: {
      flexGrow: 1,
    },
    imageContainer: {
      overflow: 'hidden',
      marginTop: -50,
    },
    image: {
      width: '100%',
      height: 475,
      resizeMode: 'cover',
      backgroundColor: theme.colors.border,
    },
    bodyContainer: {
      flex: 1,
      paddingHorizontal: 20,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      marginTop: -75,
      paddingTop: 18,
      backgroundColor: theme.colors.background,
      minHeight: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    flex: {
      flex: 1,
    },
    titleInput: {
      ...theme.typography.h1,
      color: theme.colors.text,
      marginBottom: 5,
      width: '100%',
      padding: 0,
      backgroundColor: 'transparent',
    },
    subtextInput: {
      ...theme.typography.bodyMedium,
      color: theme.colors.text,
      marginBottom: 5,
      backgroundColor: 'transparent',
    },
    metaBadgeCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 5,
    },
    metaBadgeRect: {
      width: 64,
      height: 60,
      borderRadius: 13,
      backgroundColor: theme.colors.badgeBackground,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    metaBadgeValue: {
      ...theme.typography.bodyLarge,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: -2,
    },
    metaBadgeLabel: {
      ...theme.typography.caption,
      color: theme.colors.text,
      textAlign: 'center',
      opacity: 0.7,
      marginTop: -2,
      flexWrap: 'wrap',
      width: '100%',
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
      ...theme.typography.bodyMedium,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 15,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    aboutInput: {
      ...theme.typography.bodyMedium,
      color: theme.colors.text,
      marginTop: 5,
      marginBottom: 10,
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
      ...theme.typography.bodyMedium,
      marginRight: 10,
      color: theme.colors.subtext,
    },
    editInstructions: {
      ...theme.typography.bodyMedium,
      flex: 1,
      color: theme.colors.text,
    },
    placeholder: {
      ...theme.typography.bodyMedium,
      color: theme.colors.subtext,
    },
    authorRow: {
      marginBottom: 10,
    },
  });
