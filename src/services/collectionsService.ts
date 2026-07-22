import {supabase} from '../supabase-client';
import {Collection, Recipe} from '../models';

export const collectionsService = {
  async fetchCollections(): Promise<Collection[]> {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const {data, error} = await supabase
      .from('collections')
      .select('*, recipe_collections(count)')
      .eq('user_id', user.id)
      .order('sort_order', {ascending: true})
      .order('created_at', {ascending: true});

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(({recipe_collections, ...collection}) => ({
      ...collection,
      recipe_count: recipe_collections?.[0]?.count ?? 0,
    }));
  },

  async createCollection(
    name: string,
    description?: string,
  ): Promise<Collection> {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const {data, error} = await supabase
      .from('collections')
      .insert({name, description, user_id: user.id})
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {...data, recipe_count: 0};
  },

  async updateCollection(
    id: string,
    fields: Partial<
      Pick<
        Collection,
        'name' | 'description' | 'cover_image_url' | 'sort_order'
      >
    >,
  ): Promise<void> {
    const {error} = await supabase
      .from('collections')
      .update({...fields, updated_at: new Date().toISOString()})
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  async deleteCollection(id: string): Promise<void> {
    const {error} = await supabase.from('collections').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  async fetchCollectionRecipes(collectionId: string): Promise<Recipe[]> {
    const {data, error} = await supabase
      .from('recipe_collections')
      .select('sort_order, added_at, recipes(*)')
      .eq('collection_id', collectionId)
      .order('sort_order', {ascending: true})
      .order('added_at', {ascending: false});

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => row.recipes).filter(Boolean);
  },

  async addRecipeToCollection(
    recipeId: string,
    collectionId: string,
  ): Promise<void> {
    const {error} = await supabase
      .from('recipe_collections')
      .upsert({recipe_id: parseInt(recipeId, 10), collection_id: collectionId});

    if (error) {
      throw new Error(error.message);
    }
  },

  async removeRecipeFromCollection(
    recipeId: string,
    collectionId: string,
  ): Promise<void> {
    const {error} = await supabase
      .from('recipe_collections')
      .delete()
      .eq('recipe_id', parseInt(recipeId, 10))
      .eq('collection_id', collectionId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async fetchRecipeCollections(recipeId: string): Promise<Collection[]> {
    const {data, error} = await supabase
      .from('recipe_collections')
      .select('collections(*)')
      .eq('recipe_id', parseInt(recipeId, 10));

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => row.collections).filter(Boolean);
  },
};
