import React, {useCallback, useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useAppDispatch, useAppSelector} from '../hooks';
import {changeViewMode} from '../features/viewModeSlice';
import InstructionsEditor from './InstructionsEditor';
import {useEditingHandler} from '../EditingHandlerContext';
import {RecipeService} from '../api';

export default function DetailsScreen({route}: any) {
  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();
  const {setHandleSavePress} = useEditingHandler();
  const [data, onChangeData] = useState({...route.params.item});
  const [isLoading, setIsLoading] = useState(false);
  const [editingData, onChangeEditingData] = useState({...route.params.item});

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

  useEffect(() => {
    setHandleSavePress(() => handleSavePress);
  }, [setHandleSavePress, handleSavePress, editingData]);

  useEffect(() => {
    if (route.params.newRecipe) {
      dispatch(changeViewMode('edit'));
      return;
    }
    dispatch(changeViewMode('view'));
  }, [dispatch, route.params.item, route.params.newRecipe]);

  const handleInstructionUpdate = useCallback(
    (newInstructions: string) => {
      onChangeEditingData((prevData: any) => ({
        ...prevData,
        instructions: newInstructions,
      }));
    },
    [onChangeEditingData],
  );

  function renderImage() {
    if (viewMode === 'view') {
      return (
        <Image
          style={styles.image}
          source={{uri: data.image}}
          defaultSource={require('../assets/images/placeholder.png')}
        />
      );
    } else {
      return <Image style={styles.image} source={{uri: data.image}} />;
    }
  }

  function renderTitle() {
    if (viewMode === 'view') {
      return <Text style={styles.title}>{data.title}</Text>;
    } else {
      return (
        <TextInput
          style={styles.title}
          value={editingData.title}
          multiline={true}
          placeholder="Recipe name"
          onChangeText={text =>
            onChangeEditingData({...editingData, title: text})
          }
        />
      );
    }
  }

  function renderTime() {
    if (viewMode === 'view') {
      return <Text style={styles.time}>{data.total_time}</Text>;
    } else {
      return (
        <View>
          <Text style={styles.sectionTitle}>Total Time</Text>
          <TextInput
            style={styles.lineText}
            value={editingData.total_time.toString()}
            placeholder="Time to cook"
            onChangeText={text =>
              onChangeEditingData({...editingData, total_time: text})
            }
          />
        </View>
      );
    }
  }

  function renderYields() {
    if (viewMode === 'view') {
      return <Text style={styles.subtext}>{data.yields}</Text>;
    } else {
      return (
        <View>
          <Text style={styles.sectionTitle}>Servings</Text>
          <TextInput
            style={styles.lineText}
            value={editingData.yields}
            placeholder="Yields"
            onChangeText={text =>
              onChangeEditingData({...editingData, yields: text})
            }
          />
        </View>
      );
    }
  }

  function renderIngredients() {
    if (viewMode === 'view') {
      return <Text style={styles.lineText}>{data.ingredients}</Text>;
    } else {
      return (
        <TextInput
          style={styles.lineText}
          value={editingData.ingredients}
          placeholder="Enter ingredients, one per line"
          onChangeText={(text: any) => {
            onChangeEditingData({
              ...editingData,
              ingredients: text,
            });
          }}
          multiline
        />
      );
    }
  }

  const renderInstructions = () => {
    if (viewMode === 'view') {
      return data.instructions
        .split('\n')
        .map((instruction: any, index: any) => {
          return (
            <View style={styles.lineContainer} key={index}>
              <Text style={styles.lineNumber}>{index + 1}.</Text>
              <Text style={styles.lineText}>{instruction}</Text>
            </View>
          );
        });
    } else {
      return (
        <InstructionsEditor
          instructions={data.instructions}
          onUpdate={handleInstructionUpdate}
        />
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Animated.ScrollView automaticallyAdjustKeyboardInsets={true}>
        {renderImage()}
        <View style={styles.bodyContainer}>
          {renderTitle()}
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
            {renderTime()}
            {renderYields()}
          </View>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientsContainer}>{renderIngredients()}</View>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsContainer}>
            {renderInstructions()}
          </View>
        </View>
      </Animated.ScrollView>
      {isLoading && <View style={styles.loadingOverlay} />}
    </KeyboardAvoidingView>
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
    width: '100%',
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
    height: 215,
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
    paddingBottom: 25,
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
});
