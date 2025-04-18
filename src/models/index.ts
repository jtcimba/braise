export interface Recipe {
  id: string;
  title: string;
  author: string;
  host: string;
  image: string;
  total_time: string;
  yields: string;
  ingredients: string;
  instructions: string;
  category: string[];
}
