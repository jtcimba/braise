import React, {useCallback, useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';
import {useEditingHandler} from '../context/EditingHandlerContext';
import {RecipeService} from '../api';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import InstructionsEditor from './InstructionsEditor';

export default function RecipeDetailsScreen({route, navigation}: any) {
  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();
  const {setHandleSavePress, setHandleDeletePress} = useEditingHandler();
  const [data, onChangeData] = useState({...route.params.item});
  const [isLoading, setIsLoading] = useState(false);
  const [editingData, onChangeEditingData] = useState({...route.params.item});
  const [modalVisible, setModalVisible] = useState(false);

  const handleSaveNewRecipe = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await RecipeService.addNewRecipe({
        ...editingData,
        ingredients: editingData.ingredients.replace(/\\n$/, ''),
      });
      const newRecipe = await RecipeService.getRecipe(response.id);
      onChangeData(newRecipe[0]);
      onChangeEditingData(newRecipe[0]);
    } catch (e: any) {
      console.log('save error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [editingData]);

  const handleSavePress = useCallback(async () => {
    if (route.params.newRecipe) {
      handleSaveNewRecipe();
      return;
    }
    setIsLoading(true);
    try {
      await RecipeService.updateRecipe(editingData.id, {
        ...editingData,
        ingredients: editingData.ingredients.replace(/\\n$/, ''),
      });

      const updatedRecipe = await RecipeService.getRecipe(editingData.id);
      onChangeData(updatedRecipe[0]);
      onChangeEditingData(updatedRecipe[0]);
    } catch (e: any) {
      console.log('save error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [editingData, handleSaveNewRecipe, route.params.newRecipe]);

  const handleDeletePress = useCallback(async () => {
    setIsLoading(true);
    try {
      await RecipeService.deleteRecipe(editingData.id);
    } catch (e: any) {
      console.log('delete error', e.message);
    } finally {
      setIsLoading(false);
      navigation.navigate('Recipes', {refresh: true});
    }
  }, [editingData.id, navigation]);

  useEffect(() => {
    setHandleSavePress(() => handleSavePress);
    setHandleDeletePress(() => handleDeletePress);
  }, [
    setHandleSavePress,
    handleSavePress,
    setHandleDeletePress,
    handleDeletePress,
    editingData,
  ]);

  useEffect(() => {
    if (route.params.newRecipe) {
      dispatch(changeViewMode('new'));
      return;
    }
    dispatch(changeViewMode('view'));
  }, [dispatch, route.params.item, route.params.newRecipe]);

  useEffect(() => {
    if (viewMode === 'view') {
      onChangeEditingData(data);
    }
  }, [viewMode, data]);

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
    <View style={styles.container}>
      {viewMode === 'view' && (
        <ScrollView automaticallyAdjustKeyboardInsets={true}>
          <Image
            style={styles.image}
            source={{uri: data.image}}
            defaultSource={require('../assets/images/placeholder.png')}
          />
          <View style={styles.bodyContainer}>
            <Text style={styles.title}>{data.title}</Text>
            <View style={styles.subheader}>
              <View style={styles.itemBody}>
                <Text style={styles.subtext}>{data.author}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.subtext}>{data.host}</Text>
              </View>
            </View>
            <View
              style={
                viewMode === 'view' ? styles.subheader : styles.editSubHeader
              }>
              <Text style={styles.time}>{data.total_time}</Text>
              <Text style={styles.subtext}>{data.yields}</Text>
            </View>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsContainer}>
              <Text style={styles.lineText}>{data.ingredients}</Text>
            </View>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsContainer}>
              {data.instructions
                .split('\n')
                .map((instruction: any, index: any) => {
                  return (
                    <View style={styles.lineContainer} key={index}>
                      <Text style={styles.lineNumber}>{index + 1}.</Text>
                      <Text style={styles.lineText}>{instruction}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        </ScrollView>
      )}
      {viewMode !== 'view' && (
        <KeyboardAwareScrollView style={styles.editContainer}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Image style={styles.editImage} source={{uri: data.image}} />
              <View style={styles.itemBody}>
                <Text style={styles.subtext}>{data.author}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.subtext}>{data.host}</Text>
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
                  <Text style={styles.lineNumber}>1.</Text>
                  <Text
                    style={[styles.editInstructions]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {editingData.instructions.split('\n')[0]}
                  </Text>
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
      )}
      {isLoading && <View style={styles.loadingOverlay} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemBody: {
    flex: 1,
    flexDirection: 'row',
  },
  title: {
    fontSize: 20,
    marginTop: 10,
    width: '100%',
  },
  subtext: {
    color: '#666',
    overflow: 'hidden',
  },
  time: {
    color: '#666',
    overflow: 'hidden',
    paddingRight: 5,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  subheader: {
    flexDirection: 'row',
    alignContent: 'center',
    marginTop: 5,
    width: '100%',
  },
  dot: {
    marginHorizontal: 5,
  },
  ingredientsContainer: {
    flex: 1,
  },
  lineContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 5,
  },
  lineNumber: {
    lineHeight: 30,
    marginRight: 10,
    color: '#666',
  },
  lineText: {
    lineHeight: 30,
    flex: 1,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 25,
    color: '#666',
  },
  instructionsContainer: {
    flex: 1,
    marginBottom: 25,
  },
  editSubHeader: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    alignItems: 'center',
  },
  editImage: {
    width: '100%',
    height: 235,
    marginTop: 100,
    marginBottom: 15,
    resizeMode: 'cover',
    borderRadius: 10,
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
  editInstructionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
    borderRadius: 10,
    marginTop: 15,
  },
});
