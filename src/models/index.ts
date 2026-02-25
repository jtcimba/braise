export interface Recipe {
  id: string;
  title: string;
  author: string;
  host: string;
  image: string;
  total_time: string;
  total_time_unit: string;
  yields: string;
  ingredients: string;
  instructions: string;
  categories: string;
  created_at?: string;
  modified_at?: string;
  viewed_at?: string;
}
