import AsyncStorage from '@react-native-async-storage/async-storage';

class Storage {
  async saveRecipesToLocal(recipes: any) {
    try {
      const jsonValue = JSON.stringify(recipes);
      await AsyncStorage.setItem('@recipes', jsonValue);
    } catch (e) {
      console.error('Failed to save recipes to local storage', e);
    }
  }

  async loadRecipesFromLocal() {
    try {
      const jsonValue = await AsyncStorage.getItem('@recipes');
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load recipes from local storage', e);
      return [];
    }
  }
}

export default new Storage();
