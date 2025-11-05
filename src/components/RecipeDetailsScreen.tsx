import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Animated,
  Alert,
} from 'react-native';
import {useAppSelector} from '../redux/hooks';
import {useEditingHandler} from '../context/EditingHandlerContext';
import {RecipeService} from '../api';
import RecipeViewer from './RecipeViewer';
import RecipeEditor from './RecipeEditor';
import GroceryListModal from './GroceryListModal';
import Storage from '../storage';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import DetailsMenuHeader from './DetailsMenuHeader';

export default function RecipeDetailsScreen({route, navigation}: any) {
  const viewMode = useAppSelector(state => state.viewMode.value);
  const {setHandleSavePress, setHandleDeletePress} = useEditingHandler();
  const [data, onChangeData] = useState({...route.params.item});
  const [isLoading, setIsLoading] = useState(false);
  const [editingData, onChangeEditingData] = useState({...route.params.item});
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [scaledIngredients, setScaledIngredients] = useState(
    route.params.item.ingredients || '',
  );
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const theme = useTheme() as unknown as Theme;

  const showSavedMessageTemporarily = useCallback(() => {
    setShowSavedMessage(true);
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        speed: 20,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 20,
        bounciness: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(fadeAnim, {
            toValue: 0,
            speed: 20,
            bounciness: 10,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 0.8,
            speed: 20,
            bounciness: 10,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowSavedMessage(false);
        });
      }, 1000);
    });
  }, [fadeAnim, scaleAnim]);

  const handleSavePress = useCallback(async () => {
    setIsLoading(true);
    try {
      const isNewRecipe = !editingData.id || editingData.id === '';

      if (isNewRecipe) {
        const response = await RecipeService.addNewRecipe({
          ...editingData,
          ingredients: editingData.ingredients?.replace(/\\n$/, ''),
        });
        const newRecipe = await RecipeService.getRecipe(response.id);

        const localRecipes = await Storage.loadRecipesFromLocal();
        localRecipes.push(newRecipe[0]);
        await Storage.saveRecipesToLocal(localRecipes);

        onChangeData(newRecipe[0]);
        onChangeEditingData(newRecipe[0]);
      } else {
        await RecipeService.updateRecipe(editingData.id, {
          ...editingData,
          ingredients: editingData.ingredients?.replace(/\\n$/, ''),
        });

        const updatedRecipe = await RecipeService.getRecipe(editingData.id);
        onChangeData(updatedRecipe[0]);
        onChangeEditingData(updatedRecipe[0]);

        const localRecipes = await Storage.loadRecipesFromLocal();
        const updatedRecipes = localRecipes.map((recipe: {id: any}) =>
          recipe.id === updatedRecipe[0].id ? updatedRecipe[0] : recipe,
        );
        await Storage.saveRecipesToLocal(updatedRecipes);
      }

      showSavedMessageTemporarily();
    } catch (e: any) {
      console.log('save error', e.message);
      Alert.alert('Error', 'Failed to save recipe');
    } finally {
      setIsLoading(false);
    }
  }, [editingData, showSavedMessageTemporarily]);

  const handleDeletePress = useCallback(async () => {
    setIsLoading(true);
    try {
      await RecipeService.deleteRecipe(editingData.id);

      const localRecipes = await Storage.loadRecipesFromLocal();
      const updatedRecipes = localRecipes.filter(
        (recipe: {id: any}) => recipe.id !== editingData.id,
      );
      await Storage.saveRecipesToLocal(updatedRecipes);
    } catch (e: any) {
      console.log('delete error', e.message);
      Alert.alert('Error', 'Failed to delete recipe');
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
    if (viewMode === 'view') {
      onChangeEditingData(data);
      setScaledIngredients(data.ingredients || '');
    }
  }, [viewMode, data]);

  const handleChangeEditData = useCallback(
    (newData: string) => {
      onChangeEditingData(newData);
    },
    [onChangeEditingData],
  );

  const headerRightComponent = useMemo(
    () => (
      <DetailsMenuHeader
        navigation={navigation}
        scaledIngredients={scaledIngredients}
      />
    ),
    [navigation, scaledIngredients],
  );

  useEffect(() => {
    if (viewMode === 'view') {
      navigation.setOptions({
        headerRight: () => headerRightComponent,
      });
    }
  }, [navigation, headerRightComponent, viewMode]);

  return (
    <View style={styles(theme).container}>
      {viewMode === 'view' && (
        <RecipeViewer
          data={data}
          onScaledIngredientsChange={setScaledIngredients}
        />
      )}
      {viewMode !== 'view' && (
        <RecipeEditor
          editingData={editingData}
          onChangeEditingData={handleChangeEditData}
        />
      )}
      {isLoading && (
        <View style={styles(theme).loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.subtext} />
        </View>
      )}
      {showSavedMessage && (
        <Animated.View
          style={[
            styles(theme).savedMessageContainer,
            {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
          ]}>
          <View style={styles(theme).saveMessageBackground}>
            <Text style={styles(theme).savedMessageText}>Recipe Saved!</Text>
          </View>
        </Animated.View>
      )}
      <GroceryListModal />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{translateX: -50}, {translateY: -50}],
      width: 100,
      height: 100,
      borderRadius: 20,
      backgroundColor: theme.colors.opaque,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    savedMessageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      zIndex: 100,
      width: '100%',
      height: '100%',
    },
    saveMessageBackground: {
      backgroundColor: theme.colors.opaque,
      borderRadius: 10,
    },
    savedMessageText: {
      paddingHorizontal: 20,
      paddingVertical: 40,
      color: 'white',
      fontSize: 16,
    },
  });
