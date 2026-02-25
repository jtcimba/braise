import {supabase} from '../supabase-client';
import Storage from '../storage';

const processNewlines = (recipe: any) => {
  if (recipe.ingredients) {
    recipe.ingredients = recipe.ingredients.replace(/\\n/g, '\n');
  }
  if (recipe.instructions) {
    recipe.instructions = recipe.instructions.replace(/\\n/g, '\n');
  }
  return recipe;
};

const processForSave = (recipe: any) => {
  return {
    ...recipe,
    ingredients: recipe.ingredients?.replace(/\\n$/, ''),
    total_time: recipe.total_time ? parseInt(recipe.total_time, 10) : null,
    servings: recipe.servings ? parseInt(recipe.servings, 10) : null,
  };
};

export const recipeService = {
  async fetchRecipes() {
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const {data: recipes, error} = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {ascending: false});

      if (error) {
        throw error;
      }

      const processedRecipes = (recipes || []).map(processNewlines);
      await Storage.saveRecipesToLocal(processedRecipes);
      return processedRecipes;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch recipes');
    }
  },

  async createRecipe(recipe: any) {
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const recipeForSave = processForSave(recipe);
      const {data: newRecipe, error} = await supabase
        .from('recipes')
        .insert({
          ...recipeForSave,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const processedRecipe = processNewlines(newRecipe);
      const localRecipes = await Storage.loadRecipesFromLocal();
      await Storage.saveRecipesToLocal([...localRecipes, processedRecipe]);
      return processedRecipe;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create recipe');
    }
  },

  async updateRecipe(recipe: any) {
    try {
      if (!recipe.id) {
        throw new Error('Recipe ID is required');
      }

      const recipeForSave = processForSave(recipe);
      const {error: updateError} = await supabase
        .from('recipes')
        .update(recipeForSave)
        .eq('id', recipe.id);

      if (updateError) {
        throw updateError;
      }

      const {data: updatedRecipe, error: fetchError} = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipe.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const processedRecipe = processNewlines(updatedRecipe);
      const localRecipes = await Storage.loadRecipesFromLocal();
      const updatedRecipes = localRecipes.map((r: any) =>
        r.id === processedRecipe.id ? processedRecipe : r,
      );
      await Storage.saveRecipesToLocal(updatedRecipes);
      return processedRecipe;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update recipe');
    }
  },

  async updateViewedAt(recipeId: string) {
    try {
      const viewedAt = new Date().toISOString();
      const {error} = await supabase
        .from('recipes')
        .update({viewed_at: viewedAt})
        .eq('id', recipeId);

      if (error) {
        throw error;
      }

      const localRecipes = await Storage.loadRecipesFromLocal();
      const updatedRecipes = localRecipes.map((r: any) =>
        r.id === recipeId ? {...r, viewed_at: viewedAt} : r,
      );
      await Storage.saveRecipesToLocal(updatedRecipes);
    } catch (error: any) {
      console.error('Failed to update viewed_at:', error.message);
    }
  },

  async deleteRecipe(recipeId: string) {
    try {
      const {error} = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) {
        throw error;
      }

      const localRecipes = await Storage.loadRecipesFromLocal();
      const updatedRecipes = localRecipes.filter((r: any) => r.id !== recipeId);
      await Storage.saveRecipesToLocal(updatedRecipes);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete recipe');
    }
  },
};
