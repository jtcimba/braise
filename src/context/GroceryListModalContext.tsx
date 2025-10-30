import React, {createContext, useContext, useState, ReactNode} from 'react';

interface GroceryListModalContextType {
  isVisible: boolean;
  ingredients: string;
  showModal: (ingredients: string) => void;
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

  const showModal = (ingredientsToShow: string) => {
    setIngredients(ingredientsToShow);
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
