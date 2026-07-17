import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react';
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
import RecipeViewer from './RecipeViewer';
import RecipeEditor from './RecipeEditor';
import GroceryListModal from './GroceryListModal';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import DetailsMenuHeader from './DetailsMenuHeader';
import {recipeService} from '../services';
import {RecipeIngredient} from '../models';

const withIngredientRows = (item: any) => {
  if (item.ingredientRows?.length || !item.ingredients) {
    return {...item};
  }
  const ingredientRows = item.ingredients
    .split('\n')
    .filter((l: string) => l.trim())
    .map((line: string, i: number) => ({
      id: `import-${i}`,
      amount: '',
      name: line.trim(),
    }));
  return {...item, ingredientRows};
};

export default function RecipeDetailsScreen({route, navigation}: any) {
  const viewMode = useAppSelector(state => state.viewMode.value);
  const {setHandleSavePress, setHandleDeletePress} = useEditingHandler();
  const [data, onChangeData] = useState({...route.params.item});
  const [isLoading, setIsLoading] = useState(false);
  const [editingData, onChangeEditingData] = useState(
    withIngredientRows({...route.params.item}),
  );
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [structuredIngredients, setStructuredIngredients] = useState<
    RecipeIngredient[]
  >([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(!!data.id);
  const autoSaveTriggeredRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
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

  const loadRecipeData = useCallback(async (recipeId: string) => {
    try {
      const {recipe, ingredients} =
        await recipeService.fetchRecipeWithIngredients(recipeId);
      onChangeData(recipe);
      setStructuredIngredients(ingredients);
    } catch (e: any) {
      console.error('Failed to load recipe data:', e.message);
    } finally {
      setIsLoadingIngredients(false);
    }
  }, []);

  const refreshIngredients = useCallback(async (recipeId: string) => {
    const rows = await recipeService.fetchRecipeIngredients(recipeId);
    setStructuredIngredients(rows);
  }, []);

  useEffect(() => {
    if (data.id) {
      loadRecipeData(data.id);
    }
  }, [data.id, loadRecipeData]);

  const handleSavePress = useCallback(async () => {
    setIsLoading(true);
    try {
      const isNewRecipe = !editingData.id || editingData.id === '';
      const savedRecipe = isNewRecipe
        ? await recipeService.createRecipe(editingData)
        : await recipeService.updateRecipe(editingData);

      onChangeData(savedRecipe);
      onChangeEditingData(savedRecipe);
      showSavedMessageTemporarily();

      if (savedRecipe.id) {
        await refreshIngredients(savedRecipe.id);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save recipe');
    } finally {
      setIsLoading(false);
    }
  }, [editingData, showSavedMessageTemporarily, refreshIngredients]);

  const handleDeletePress = useCallback(async () => {
    setIsLoading(true);
    try {
      await recipeService.deleteRecipe(editingData.id);
      navigation.navigate('Recipes', {refresh: true});
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete recipe');
    } finally {
      setIsLoading(false);
    }
  }, [editingData.id, navigation]);

  useEffect(() => {
    if (data.id) {
      recipeService.updateViewedAt(data.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        structuredIngredients={structuredIngredients}
      />
    ),
    [navigation, structuredIngredients],
  );

  useEffect(() => {
    if (viewMode === 'view') {
      navigation.setOptions({
        headerRight: () => headerRightComponent,
      });
    }
  }, [navigation, headerRightComponent, viewMode]);

  useEffect(() => {
    if (
      route?.params?.shouldAutoSave &&
      !autoSaveTriggeredRef.current &&
      (!editingData.id || editingData.id === '')
    ) {
      // Only auto-save if this is a new recipe (no ID)
      // This prevents duplicate saves of existing recipes
      autoSaveTriggeredRef.current = true;
      handleSavePress();
      navigation.setParams({
        ...route.params,
        shouldAutoSave: false,
      });
    }
  }, [
    route.params?.shouldAutoSave,
    handleSavePress,
    navigation,
    route.params,
    editingData.id,
  ]);

  return (
    <View style={styles(theme).container}>
      {viewMode === 'view' && (
        <RecipeViewer
          data={data}
          structuredIngredients={structuredIngredients}
          isLoadingIngredients={isLoadingIngredients}
        />
      )}
      {viewMode !== 'view' && (
        <RecipeEditor
          editingData={editingData}
          onChangeEditingData={handleChangeEditData}
          structuredIngredients={structuredIngredients}
        />
      )}
      {isLoading && (
        <View style={styles(theme).loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.subtext} />
        </View>
      )}
      <Animated.View
        pointerEvents={showSavedMessage ? 'box-none' : 'none'}
        style={[
          styles(theme).savedMessageContainer,
          {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
        ]}>
        <View style={styles(theme).saveMessageBackground}>
          <Text style={styles(theme).savedMessageText}>Recipe Saved!</Text>
        </View>
      </Animated.View>
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
      borderRadius: 16,
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
      backgroundColor: theme.colors['neutral-300'],
      borderRadius: 16,
    },
    savedMessageText: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
  });
