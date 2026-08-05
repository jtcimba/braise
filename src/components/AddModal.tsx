import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
  NativeModules,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAppDispatch} from '../redux/hooks';
import {changeViewMode} from '../redux/slices/viewModeSlice';
import {supabase} from '../supabase-client';
import {recipeService, ingredientRowsFromText} from '../services';

function isTikTokUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'tiktok.com' ||
      host === 'vm.tiktok.com' ||
      host.endsWith('.tiktok.com')
    );
  } catch {
    return false;
  }
}

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddModal({visible, onClose}: AddModalProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme() as unknown as Theme;
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [isImporting, setIsImporting] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const newRecipe = {
    id: '',
    title: '',
    author: '',
    host_url: '',
    host_name: '',
    image: '',
    total_time: undefined,
    total_time_unit: '',
    servings: undefined,
    ingredients: '',
    instructions: '',
    categories: '',
  };

  const handleClose = () => {
    setShowUrlInput(false);
    setRecipeUrl('');
    onClose();
  };

  const handleImagesSelected = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }
    if (!response.assets || response.assets.length === 0) {
      return;
    }

    const images = response.assets
      .filter(a => a.base64)
      .map(a => a.base64 as string);

    if (images.length === 0) {
      return;
    }

    setIsImporting(true);
    try {
      const {data, error} = await supabase.functions.invoke(
        'import-recipe-from-image',
        {body: {images}},
      );

      if (error || !data) {
        throw new Error(error?.message || 'Failed to extract recipe');
      }

      const savedRecipe = await recipeService.createRecipe({
        ...data,
        id: '',
        ingredientRows: ingredientRowsFromText(data.ingredients),
      });

      handleClose();
      dispatch(changeViewMode('view'));
      navigation.navigate('RecipeDetailsScreen', {item: savedRecipe});
    } catch (err: any) {
      console.error('Photo import error:', err.message);
      Alert.alert(
        'Import Failed',
        "We couldn't extract a recipe from that photo. Try a clearer image or add the recipe manually.",
        [
          {text: 'Try Again', onPress: handleSnapPhoto},
          {text: 'Cancel', style: 'cancel'},
        ],
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSnapPhoto = () => {
    const pickerOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
    };

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Take Photo', 'Choose from Library'],
        cancelButtonIndex: 0,
      },
      buttonIndex => {
        if (buttonIndex === 1) {
          launchCamera(pickerOptions, handleImagesSelected);
        } else if (buttonIndex === 2) {
          launchImageLibrary(
            {...pickerOptions, selectionLimit: 3},
            handleImagesSelected,
          );
        }
      },
    );
  };

  const handleUrlImport = async () => {
    const trimmed = recipeUrl.trim();
    if (!trimmed) {
      return;
    }

    setIsImporting(true);
    try {
      if (isTikTokUrl(trimmed)) {
        const {data, error} = await supabase.functions.invoke(
          'process-social-video',
          {body: {url: trimmed, platform: 'tiktok'}},
        );
        if (error || !data?.job_id) {
          throw new Error('Failed to start import');
        }
        const jobId: string = data.job_id;
        const {AppGroupStorage} = NativeModules;
        if (Platform.OS === 'ios' && AppGroupStorage) {
          await AppGroupStorage.setItem('pendingSocialJobId', jobId);
        }

        // Poll for job completion while the user stays in the app.
        // AppState-based polling in App.tsx only fires on foreground transitions,
        // which never happens when the import is triggered from within the app.
        const deadline = Date.now() + 60_000;
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 3_000));
          try {
            const {data: rows} = await supabase
              .from('video_import_jobs')
              .select('status, extracted_recipe, low_confidence, platform')
              .eq('id', jobId)
              .limit(1);
            const job = rows?.[0];
            if (!job) continue;

            if (job.status === 'ready_for_review') {
              if (Platform.OS === 'ios' && AppGroupStorage) {
                await AppGroupStorage.removeItem('pendingSocialJobId');
              }
              const extracted = job.extracted_recipe ?? {};
              const savedRecipe = await recipeService.createRecipe({
                ...extracted,
                id: '',
                ingredientRows: ingredientRowsFromText(extracted.ingredients),
              });
              handleClose();
              dispatch(changeViewMode('view'));
              navigation.navigate('RecipeDetailsScreen', {
                item: savedRecipe,
                lowConfidence: job.low_confidence,
                sourceUrl: extracted.host_url ?? '',
                sourcePlatform: job.platform,
              });
              return;
            }

            if (job.status === 'failed') {
              if (Platform.OS === 'ios' && AppGroupStorage) {
                await AppGroupStorage.removeItem('pendingSocialJobId');
              }
              Alert.alert(
                'Import Failed',
                "We couldn't find a recipe in that video. The creator may not have included the recipe in their caption.",
                [{text: 'OK', style: 'cancel'}],
              );
              return;
            }
          } catch {
            // Network hiccup during poll — keep trying
          }
        }

        // Timed out: leave pendingSocialJobId stored so the AppState handler
        // can pick it up if the user backgrounds and re-foregrounds the app.
        handleClose();
        Alert.alert(
          'Import Started',
          "Your TikTok recipe is taking a moment to process. Open Braise in a bit to see it.",
        );
        return;
      }

      let html: string;
      try {
        const pageResponse = await fetch(trimmed, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (!pageResponse.ok) {
          throw new Error(`HTTP ${pageResponse.status}`);
        }
        html = await pageResponse.text();
      } catch (fetchErr: any) {
        throw new Error(`Could not load that page: ${fetchErr.message}`);
      }

      const {data, error} = await supabase.functions.invoke('import-recipe', {
        body: {html, url: trimmed},
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to extract recipe');
      }

      const savedRecipe = await recipeService.createRecipe({
        ...data,
        id: '',
        ingredientRows: ingredientRowsFromText(data.ingredients),
      });

      handleClose();
      dispatch(changeViewMode('view'));
      navigation.navigate('RecipeDetailsScreen', {item: savedRecipe});
    } catch (err: any) {
      console.error('URL import error:', err.message);
      Alert.alert(
        'Import Failed',
        "We couldn't import a recipe from that link. Make sure it's a recipe page and try again.",
        [{text: 'Try Again', style: 'cancel'}],
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection={['down']}
      style={styles(theme).modalOverlay}>
      <View
        style={[
          styles(theme).modalContainer,
          showUrlInput && keyboardHeight > 0 && {paddingBottom: keyboardHeight},
        ]}>
        <TouchableOpacity
          style={styles(theme).closeButton}
          onPress={handleClose}>
          <Ionicons
            name="close-outline"
            size={24}
            color={theme.colors['toffee-400']}
          />
        </TouchableOpacity>

        {showUrlInput ? (
          <>
            <TouchableOpacity
              style={styles(theme).backButton}
              onPress={() => {
                setShowUrlInput(false);
                setRecipeUrl('');
              }}>
              <Ionicons
                name="arrow-back-outline"
                size={20}
                color={theme.colors['toffee-400']}
              />
            </TouchableOpacity>
            <Text style={styles(theme).modalTitle}>Paste a link</Text>
            <View style={styles(theme).urlInputContainer}>
              <TextInput
                style={styles(theme).urlInput}
                placeholder="https://..."
                placeholderTextColor={theme.colors['toffee-400']}
                value={recipeUrl}
                onChangeText={setRecipeUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleUrlImport}
                autoFocus
              />
              <TouchableOpacity
                style={[
                  styles(theme).importButton,
                  (!recipeUrl.trim() || isImporting) &&
                    styles(theme).importButtonDisabled,
                ]}
                onPress={handleUrlImport}
                disabled={!recipeUrl.trim() || isImporting}>
                {isImporting ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors['neutral-100']}
                  />
                ) : (
                  <Text style={styles(theme).importButtonText}>Import</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles(theme).modalTitle}>Add Recipe</Text>
            <TouchableOpacity
              style={styles(theme).modalButtonContainer}
              onPress={() => setShowUrlInput(true)}>
              <View style={styles(theme).modalButtonIcon}>
                <Ionicons
                  name="link-outline"
                  size={24}
                  color={theme.colors['neutral-800']}
                />
              </View>
              <View style={styles(theme).modalButtonTextContainer}>
                <Text style={styles(theme).modalButtonText}>Paste a link</Text>
                <Text style={styles(theme).modalButtonSubtext}>
                  Import a recipe by pasting its URL
                </Text>
              </View>
              <Ionicons
                name="arrow-forward-outline"
                size={24}
                color={theme.colors['neutral-800']}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles(theme).modalButtonContainer}
              onPress={handleSnapPhoto}
              disabled={isImporting}>
              <View style={styles(theme).modalButtonIcon}>
                {isImporting ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors['neutral-800']}
                  />
                ) : (
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={theme.colors['neutral-800']}
                  />
                )}
              </View>
              <View style={styles(theme).modalButtonTextContainer}>
                <Text style={styles(theme).modalButtonText}>Snap a photo</Text>
                <Text style={styles(theme).modalButtonSubtext}>
                  Turn recipe cards and cookbook pages into digital recipes
                </Text>
              </View>
              {isImporting ? null : (
                <Ionicons
                  name="arrow-forward-outline"
                  size={24}
                  color={theme.colors['neutral-800']}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles(theme).modalButtonContainer}
              onPress={() => {
                handleClose();
                dispatch(changeViewMode('edit'));
                navigation.navigate('RecipeDetailsScreen', {
                  item: newRecipe,
                });
              }}>
              <View style={styles(theme).modalButtonIcon}>
                <Ionicons
                  name="pencil-outline"
                  size={24}
                  color={theme.colors['neutral-800']}
                />
              </View>
              <View style={styles(theme).modalButtonTextContainer}>
                <Text style={styles(theme).modalButtonText}>
                  Write your own
                </Text>
                <Text style={styles(theme).modalButtonSubtext}>
                  Add custom ingredients and cooking steps from scratch
                </Text>
              </View>
              <Ionicons
                name="arrow-forward-outline"
                size={24}
                color={theme.colors['neutral-800']}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalContainer: {
      backgroundColor: theme.colors['neutral-100'],
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      maxHeight: '95%',
      paddingBottom: 20,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors['neutral-300'],
      marginBottom: 8,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginLeft: 30,
      marginRight: 30,
      marginBottom: 25,
    },
    modalButtonIcon: {
      width: 48,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      ...theme.typography.h1,
      color: theme.colors['neutral-800'],
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 8,
    },
    modalButtonTextContainer: {
      flex: 1,
    },
    modalButtonText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    modalButtonSubtext: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
    },
    closeButton: {
      position: 'absolute',
      right: 12,
      top: 10,
      padding: 6,
      zIndex: 1,
    },
    backButton: {
      position: 'absolute',
      left: 12,
      top: 10,
      padding: 6,
      zIndex: 1,
    },
    urlInputContainer: {
      marginHorizontal: 30,
      marginBottom: 30,
      gap: 12,
    },
    urlInput: {
      ...theme.typography.h3,
      color: theme.colors['neutral-800'],
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors['neutral-100'],
    },
    importButton: {
      backgroundColor: theme.colors['neutral-800'],
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    importButtonDisabled: {
      opacity: 0.4,
    },
    importButtonText: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-100'],
    },
  });
