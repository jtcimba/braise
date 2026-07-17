export interface Recipe {
  id: string;
  title: string;
  author?: string;
  host_url?: string;
  host_name?: string;
  image?: string;
  total_time?: number;
  total_time_unit?: string;
  servings?: number;
  ingredients?: string;
  instructions?: string;
  categories?: string;
  about?: string;
  original_url?: string;
  created_at?: string;
  modified_at?: string;
  viewed_at?: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: number;
  name: string;
  base_name: string;
  amount: string | null;
  unit: string | null;
  sort_order: number;
  created_at?: string;
}
