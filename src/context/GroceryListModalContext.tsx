import React, {createContext, useContext, useState, ReactNode} from 'react';

export interface RecipeInfo {
  id: string;
  title: string;
}

interface GroceryListModalContextType {
  isVisible: boolean;
  ingredients: string;
  recipe: RecipeInfo | null;
  showModal: (ingredients: string, recipe?: RecipeInfo) => void;
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
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState<RecipeInfo | null>(null);

  const showModal = (ingredientsToShow: string, recipeInfo?: RecipeInfo) => {
    setIngredients(ingredientsToShow);
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
        ingredients,
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
