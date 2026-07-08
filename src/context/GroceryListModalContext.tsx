import React, {createContext, useContext, useState, ReactNode} from 'react';
import {RecipeIngredient} from '../models';

export interface RecipeInfo {
  id: string;
  title: string;
}

interface GroceryListModalContextType {
  isVisible: boolean;
  structuredIngredients: RecipeIngredient[];
  recipe: RecipeInfo | null;
  showModal: (ingredients: RecipeIngredient[], recipe?: RecipeInfo) => void;
  hideModal: () => void;
}

const GroceryListModalContext = createContext<
  GroceryListModalContextType | undefined
>(undefined);

interface GroceryListModalProviderProps {
  children: ReactNode;
}

export function GroceryListModalProvider({
  children,
}: GroceryListModalProviderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [structuredIngredients, setStructuredIngredients] = useState<
    RecipeIngredient[]
  >([]);
  const [recipe, setRecipe] = useState<RecipeInfo | null>(null);

  const showModal = (
    ingredients: RecipeIngredient[],
    recipeInfo?: RecipeInfo,
  ) => {
    setStructuredIngredients(ingredients);
    setRecipe(recipeInfo ?? null);
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
  };

  return (
    <GroceryListModalContext.Provider
      value={{
        isVisible,
        structuredIngredients,
        recipe,
        showModal,
        hideModal,
      }}>
      {children}
    </GroceryListModalContext.Provider>
  );
}

export function useGroceryListModal() {
  const context = useContext(GroceryListModalContext);
  if (context === undefined) {
    throw new Error(
      'useGroceryListModal must be used within a GroceryListModalProvider',
    );
  }
  return context;
}
