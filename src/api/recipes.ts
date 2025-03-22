import {AuthService} from './index';

class RecipeService {
  async getRecipeFromUrl(
    url: string,
    wild_mode: boolean = false,
  ): Promise<any> {
    try {
      const response = await fetch(`${process.env.API_URL}recipes/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          wildMode: wild_mode,
        }),
      });

      console.log(response);

      if (!response.ok) {
        console.log(response);
        throw new Error('Failed to scrape the recipe');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding recipe from URL:', error);
      throw error;
    }
  }

  async addNewRecipe(data: any): Promise<any> {
    const userId = await AuthService.getUserId();
    try {
      const response = await fetch(`${process.env.API_URL}recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add the recipe');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding new recipe:', error);
      throw error;
    }
  }

  async updateRecipe(id: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${process.env.API_URL}recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update the recipe');
      }

      return response;
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  async getRecipe(id: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.API_URL}recipes/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch the recipe');
      }

      const recipe = await response.json();

      if (recipe.ingredients) {
        recipe.ingredients = recipe.ingredients.replace(/\\n/g, '\n');
      }
      if (recipe.instructions) {
        recipe.instructions = recipe.instructions.replace(/\\n/g, '\n');
      }

      return recipe;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw error;
    }
  }

  async getRecipes(): Promise<any> {
    const userId = await AuthService.getUserId();
    try {
      const response = await fetch(
        `${process.env.API_URL}recipes?userid=${userId}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const recipes = await response.json();

      recipes.forEach((recipe: any) => {
        if (recipe.ingredients) {
          recipe.ingredients = recipe.ingredients.replace(/\\n/g, '\n');
        }
        if (recipe.instructions) {
          recipe.instructions = recipe.instructions.replace(/\\n/g, '\n');
        }
      });

      return recipes;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.API_URL}recipes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete the recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
}

export default new RecipeService();
