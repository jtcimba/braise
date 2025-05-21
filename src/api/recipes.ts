import {AuthService} from './index';

class RecipeService {
  async getRecipeFromUrl(
    url: string,
    wild_mode: boolean = false,
  ): Promise<any> {
    try {
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      const response = await fetch(`${process.env.API_URL}recipes/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          url: url,
          wildMode: wild_mode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to scrape recipe. Status:', response.status);
        console.error('Error response:', errorText);
        
        // Handle specific error cases
        if (errorText.includes('Connection timed out')) {
          throw new Error('The recipe website is taking too long to respond. Please try again in a few moments.');
        } else if (errorText.includes('Max retries exceeded')) {
          throw new Error('Unable to access the recipe website. The site might be blocking automated access.');
        } else {
          throw new Error(
            `Failed to scrape recipe: ${response.status} ${errorText}`,
          );
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding recipe from URL:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to add recipe: ${error.message}`);
      }
      throw error;
    }
  }

  async addNewRecipe(data: any): Promise<any> {
    try {
      const userId = await AuthService.getUserId();
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      const response = await fetch(`${process.env.API_URL}recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...data,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add recipe. Status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to add recipe: ${response.status} ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding new recipe:', error);
      throw error;
    }
  }

  async updateRecipe(id: string, data: any): Promise<any> {
    try {
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      const response = await fetch(`${process.env.API_URL}recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update recipe. Status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to update recipe: ${response.status} ${errorText}`,
        );
      }

      return response;
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  async getRecipe(id: string): Promise<any> {
    try {
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      const response = await fetch(`${process.env.API_URL}recipes/${id}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch recipe. Status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to fetch recipe: ${response.status} ${errorText}`,
        );
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
    try {
      const userId = await AuthService.getUserId();
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      console.log(`${process.env.API_URL}recipes?userid=${userId}`);

      const response = await fetch(
        `${process.env.API_URL}recipes?userid=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch recipes. Status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to fetch recipes: ${response.status} ${errorText}`,
        );
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
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      const response = await fetch(`${process.env.API_URL}recipes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete recipe. Status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to delete recipe: ${response.status} ${errorText}`,
        );
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
}

export default new RecipeService();
