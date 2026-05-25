export interface Recipe {
  id: string;
  title: string;
  author?: string;
  host_url?: string;
  host_name?: string;
  image?: string;
  total_time?: string;
  total_time_unit?: string;
  servings?: string;
  ingredients?: string;
  instructions?: string;
  categories?: string;
  about?: string;
  original_url?: string;
  created_at?: string;
  modified_at?: string;
  viewed_at?: string;
}
