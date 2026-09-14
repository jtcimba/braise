import {Alert, NativeModules, Platform} from 'react-native';
import {ingredientRowsFromText, recipeService} from './recipeService';

const {AppGroupStorage} = NativeModules;

export type SocialImportResult = 'completed' | 'failed' | 'pending';

export async function clearPendingSocialImport(): Promise<void> {
  if (Platform.OS !== 'ios' || !AppGroupStorage) {
    return;
  }
  await AppGroupStorage.removeItem('pendingSocialJobId');
  await AppGroupStorage.removeItem('pendingRecipeId');
}

export async function finalizeSocialImport(
  job: {status: string; extracted_recipe: any} | null | undefined,
  stubId: string | null,
  onNavigate: () => void,
): Promise<SocialImportResult> {
  // Job no longer exists in the DB — stale import; clean up silently.
  if (!job) {
    await clearPendingSocialImport();
    if (stubId) {
      try {
        await recipeService.deleteRecipe(stubId);
      } catch {
        // stub may already be gone
      }
    }
    onNavigate();
    return 'failed';
  }

  if (job.status === 'ready_for_review') {
    await clearPendingSocialImport();
    const extracted = job.extracted_recipe ?? {};
    if (stubId) {
      await recipeService.updateRecipe({
        id: stubId,
        ...extracted,
        import_status: 'complete',
        ingredientRows: ingredientRowsFromText(extracted.ingredients),
      });
    } else {
      await recipeService.createRecipe({
        ...extracted,
        id: '',
        ingredientRows: ingredientRowsFromText(extracted.ingredients),
      });
    }
    onNavigate();
    return 'completed';
  }

  if (job?.status === 'failed') {
    await clearPendingSocialImport();
    if (stubId) {
      try {
        await recipeService.deleteRecipe(stubId);
      } catch {
        // stub may already be gone
      }
    }
    onNavigate();
    Alert.alert(
      'Import Failed',
      "We couldn't find a recipe in that video. The creator may not have included the recipe in their caption.",
      [{text: 'OK'}],
    );
    return 'failed';
  }

  return 'pending';
}
