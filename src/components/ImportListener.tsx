// ImportListener.tsx
import {useEffect} from 'react';
import {DeviceEventEmitter} from 'react-native';

export default function ImportListener({
  onImported,
}: {
  onImported?: (recipe: any) => void;
}) {
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ImportCompleted', recipe => {
      try {
        // recipe is a JS object (normalized from Lambda)
        console.log('ImportCompleted event:', recipe);
        // Save to your storage / DB
        saveImportedRecipe(recipe);

        // Optionally navigate to import/recipe screen
        if (onImported) {
          onImported(recipe);
        }
      } catch (e) {
        console.warn('Failed to handle imported recipe', e);
      }
    });

    // If you'd rather poll UserDefaults on app launch, implement native module to read AppGroup directly here

    return () => {
      sub.remove();
    };
  }, [onImported]);

  return null;
}

// Example save function — replace with your DB/storage
async function saveImportedRecipe(recipe: any) {
  // TODO: replace with your storage (realm, sqlite, MMKV, async-storage, etc.)
  console.log('Saving imported recipe', recipe);
  // Example: store in AsyncStorage under "lastImportedRecipe" for quick demo:
  // await AsyncStorage.setItem("lastImportedRecipe", JSON.stringify(recipe));
}
