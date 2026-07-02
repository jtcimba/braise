import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {isTablet, MAX_CONTENT_WIDTH} from '../hooks/useTablet';
import {
  launchImageLibrary,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InstructionsEditor from './InstructionsEditor';
import IngredientEditor from './IngredientEditor';
import CategoryEditor from './CategoryEditor';
import CustomToggle from './CustomToggle';
import TotalTimePickerModal from './TotalTimePickerModal';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {useHeaderHeight} from '@react-navigation/elements';
import {supabase} from '../supabase-client';

export default function RecipeEditor({editingData, onChangeEditingData}: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [totalTimeModalVisible, setTotalTimeModalVisible] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const theme = useTheme() as unknown as Theme;
  const scrollViewRef = useRef<ScrollView>(null);

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
        categories: newCategories.join(','),
      }));
    },
    [onChangeEditingData],
  );

  const handleServingsUpdate = useCallback(
    (servings: string) => {
      onChangeEditingData((prevData: any) => ({
        ...prevData,
        servings: servings,
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

  const handleImageSelection = useCallback(() => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
    };

    launchImageLibrary(options, async (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setIsUploadingImage(true);
          try {
            // Get the current user
            const {
              data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
              throw new Error('User not authenticated');
            }

            // Generate a unique filename
            const fileExt = asset.uri.split('.').pop() || 'jpg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // Convert image URI to ArrayBuffer for Supabase storage
            const imageResponse = await fetch(asset.uri);
            const arrayBuffer = await imageResponse.arrayBuffer();

            // Upload the new image to Supabase storage
            const {error: uploadError} = await supabase.storage
              .from('recipe_images')
              .upload(fileName, arrayBuffer, {
                contentType: asset.type || `image/${fileExt}`,
                upsert: false,
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw uploadError;
            }

            // Get the public URL
            const {
              data: {publicUrl},
            } = supabase.storage.from('recipe_images').getPublicUrl(fileName);

            // Delete the old image if it exists
            if (editingData.image) {
              try {
                // Extract the file path from the URL
                const urlParts = editingData.image.split('/recipe_images/');
                if (urlParts.length > 1) {
                  const oldFilePath = urlParts[1].split('?')[0]; // Remove query params
                  await supabase.storage
                    .from('recipe_images')
                    .remove([oldFilePath]);
                }
              } catch (deleteError) {
                console.log('Failed to delete old image:', deleteError);
                // Don't block the user if deletion fails
              }
            }

            // Update the recipe data with the new image URL
            onChangeEditingData((prevData: any) => ({
              ...prevData,
              image: publicUrl,
            }));
          } catch (error: any) {
            console.error('Error uploading image:', error);
            Alert.alert(
              'Upload Failed',
              error.message || 'Failed to upload image. Please try again.',
              [{text: 'OK'}],
            );
          } finally {
            setIsUploadingImage(false);
          }
        }
      }
    });
  }, [editingData.image, onChangeEditingData]);

  const categoriesArray = useMemo(
    () =>
      editingData.categories
        ? editingData.categories.split(',').filter((cat: string) => cat.trim())
        : [],
    [editingData.categories],
  );

  const tablet = isTablet();
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles(theme).container, {marginTop: headerHeight}]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles(theme).scrollContentContainer}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={tablet ? styles(theme).tabletContentWrapper : undefined}>
          <TouchableOpacity
            style={styles(theme).imageContainer}
            onPress={handleImageSelection}
            disabled={isUploadingImage}
            activeOpacity={0.8}>
            <Image
              style={styles(theme).image}
              source={{
                uri: editingData.image ? editingData.image : null,
              }}
            />
            {isUploadingImage && (
              <View style={styles(theme).uploadingOverlay}>
                <Text style={styles(theme).uploadingText}>Uploading...</Text>
              </View>
            )}
            {!editingData.image && !isUploadingImage && (
              <View style={styles(theme).placeholderOverlay}>
                <Ionicons
                  name="camera-outline"
                  size={40}
                  color={theme.colors['toffee-400']}
                />
                <Text style={styles(theme).placeholderText}>
                  Tap to add image
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles(theme).headerContainer}>
            <TextInput
              style={styles(theme).titleInput}
              value={editingData.title}
              placeholder="Recipe name"
              placeholderTextColor={theme.colors['toffee-400']}
              onChangeText={text =>
                onChangeEditingData({...editingData, title: text})
              }
              multiline
            />
            <TextInput
              style={styles(theme).authorInput}
              value={editingData.author}
              placeholder="Author"
              placeholderTextColor={theme.colors['toffee-400']}
              onChangeText={text =>
                onChangeEditingData({...editingData, author: text})
              }
            />
          </View>
          <View style={styles(theme).bodyContainer}>
            <View style={styles(theme).detailsContainer}>
              <View style={styles(theme).detailsRow}>
                <View style={styles(theme).metadataServingsContainer}>
                  <Text style={styles(theme).metadataText}>Servings</Text>
                  <View style={styles(theme).servingsToggleContainer}>
                    <TouchableOpacity
                      style={styles(theme).servingsToggleButton}
                      onPress={() => {
                        const num = parseInt(
                          editingData.servings?.toString() || '1',
                          10,
                        );
                        if (num > 1) {
                          handleServingsUpdate(String(num - 1));
                        }
                      }}>
                      <Ionicons
                        name="remove-outline"
                        size={16}
                        color={theme.colors['neutral-800']}
                      />
                    </TouchableOpacity>
                    <Text style={styles(theme).servingsValue}>
                      {editingData.servings != null
                        ? editingData.servings.toString()
                        : '-'}
                    </Text>
                    <TouchableOpacity
                      style={styles(theme).servingsToggleButton}
                      onPress={() => {
                        const num = parseInt(
                          editingData.servings?.toString() || '1',
                          10,
                        );
                        handleServingsUpdate(String(num + 1));
                      }}>
                      <Ionicons
                        name="add-outline"
                        size={16}
                        color={theme.colors['neutral-800']}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles(theme).metadataTimeContainer}
                  onPress={() => setTotalTimeModalVisible(true)}>
                  <Text style={styles(theme).metadataText}>Total Time</Text>
                  <Text style={styles(theme).metadataValue}>
                    {editingData.total_time
                      ? editingData.total_time +
                        ' ' +
                        (editingData.total_time_unit || 'min')
                      : '-'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles(theme).aboutInput}
                value={editingData.about}
                placeholder="Add a description or notes about this recipe..."
                placeholderTextColor={theme.colors['toffee-400']}
                onChangeText={(text: any) => {
                  onChangeEditingData({
                    ...editingData,
                    about: text,
                  });
                }}
                multiline
                scrollEnabled={false}
              />
              <CategoryEditor
                categories={categoriesArray}
                onChange={handleCategoryUpdate}
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
              />
            </View>
            <IngredientEditor
              ingredients={editingData.ingredients}
              onChange={(value: string) =>
                onChangeEditingData((prev: any) => ({
                  ...prev,
                  ingredients: value,
                }))
              }
              scrollViewRef={scrollViewRef}
            />

            <InstructionsEditor
              instructions={editingData.instructions}
              handleInstructionsUpdate={handleInstructionUpdate}
              handleModalClose={() => setModalVisible(false)}
              modalVisible={modalVisible}
            />

            <TotalTimePickerModal
              visible={totalTimeModalVisible}
              onClose={() => setTotalTimeModalVisible(false)}
              onConfirm={handleTotalTimeUpdate}
              currentTime={
                editingData.total_time != null
                  ? editingData.total_time.toString()
                  : ''
              }
              currentUnit={editingData.total_time_unit}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors['neutral-100'],
    },
    contentContainer: {
      flex: 1,
    },
    scrollContentContainer: {
      paddingBottom: 40,
    },
    headerContainer: {
      marginBottom: 0,
      paddingHorizontal: 20,
      paddingTop: 0,
    },
    imageContainer: {
      height: 260,
      marginHorizontal: 20,
      marginBottom: 14,
      backgroundColor: theme.colors['neutral-300'],
      borderRadius: 15,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      backgroundColor: theme.colors['neutral-300'],
    },
    uploadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadingText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-100'],
    },
    placeholderOverlay: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
      marginTop: 10,
    },
    bodyContainer: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 20,
      backgroundColor: theme.colors['neutral-100'],
    },
    tabletContentWrapper: {
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      width: '100%',
    },
    detailsContainer: {
      marginBottom: 10,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignContent: 'center',
      marginBottom: 10,
    },
    metadataServingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
    },
    metadataTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metadataText: {
      ...theme.typography.h2,
      color: theme.colors['neutral-800'],
      marginRight: 10,
    },
    metadataValue: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    servingsToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 24,
      minWidth: 70,
    },
    servingsValue: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
      minWidth: 28,
      textAlign: 'center',
    },
    servingsToggleButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    titleInput: {
      ...theme.typography.h1,
      color: theme.colors['neutral-800'],
      marginBottom: 5,
      width: '100%',
      padding: 0,
      backgroundColor: 'transparent',
    },
    authorInput: {
      ...theme.typography.h2,
      color: theme.colors['toffee-400'],
      marginBottom: 5,
      backgroundColor: 'transparent',
    },
    sectionTitle: {
      ...theme.typography.h2,
      marginTop: 25,
      marginBottom: 10,
      color: theme.colors['toffee-400'],
    },
    tabBarContainer: {
      marginBottom: 10,
      width: '100%',
    },
    aboutInput: {
      ...theme.typography.b1,
      color: theme.colors['neutral-800'],
      marginBottom: 5,
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
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
    },
    editLineContainer: {
      flexDirection: 'row',
    },
    lineNumber: {
      ...theme.typography.b1,
      marginRight: 10,
      color: theme.colors['toffee-400'],
    },
    editInstructions: {
      ...theme.typography.h4,
      flex: 1,
      color: theme.colors['neutral-800'],
    },
    placeholder: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
    },
    authorRow: {
      marginBottom: 10,
    },
  });
