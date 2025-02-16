import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';
import {useEditingHandler} from '../context/EditingHandlerContext';
import {RecipeService} from '../api';
import RecipeViewer from './RecipeViewer';
import RecipeEditor from './RecipeEditor';
import Storage from '../storage';

export default function RecipeDetailsScreen({route, navigation}: any) {
  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();
  const {setHandleSavePress, setHandleDeletePress} = useEditingHandler();
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

      const localRecipes = await Storage.loadRecipesFromLocal();
      localRecipes.push(newRecipe[0]);
      Storage.saveRecipesToLocal(localRecipes);
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

      const localRecipes = await Storage.loadRecipesFromLocal();
      const updatedRecipes = localRecipes.map((recipe: {id: any}) =>
        recipe.id === updatedRecipe[0].id ? updatedRecipe[0] : recipe,
      );
      Storage.saveRecipesToLocal(updatedRecipes);
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

      const localRecipes = await Storage.loadRecipesFromLocal();
      const updatedRecipes = localRecipes.filter(
        (recipe: {id: any}) => recipe.id !== editingData.id,
      );
      Storage.saveRecipesToLocal(updatedRecipes);
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

  const handleChangeEditData = useCallback(
    (newData: string) => {
      onChangeEditingData(newData);
    },
    [onChangeEditingData],
  );

  return (
    <View style={styles.container}>
      {viewMode === 'view' && <RecipeViewer data={data} />}
      {viewMode !== 'view' && (
        <RecipeEditor
          editingData={editingData}
          onChangeEditingData={handleChangeEditData}
        />
      )}
      {isLoading && <View style={styles.loadingOverlay} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
