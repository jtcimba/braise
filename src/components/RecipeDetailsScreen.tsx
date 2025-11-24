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
  const autoSaveTriggeredRef = useRef(false);
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
      const savedRecipe = isNewRecipe
        ? await recipeService.createRecipe(editingData)
        : await recipeService.updateRecipe(editingData);

      onChangeData(savedRecipe);
      onChangeEditingData(savedRecipe);
      setScaledIngredients(savedRecipe.ingredients || '');
      showSavedMessageTemporarily();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save recipe');
    } finally {
      setIsLoading(false);
    }
  }, [editingData, showSavedMessageTemporarily]);

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
      backgroundColor: theme.colors.opaque,
      borderRadius: 16,
    },
    savedMessageText: {
      paddingHorizontal: 20,
      paddingVertical: 40,
      color: 'white',
      fontSize: 16,
    },
  });
