import React, {createContext, useContext, useState, ReactNode} from 'react';

interface AddToCollectionModalContextType {
  isVisible: boolean;
  recipeId: string | null;
  showModal: (recipeId: string) => void;
  hideModal: () => void;
}

const AddToCollectionModalContext = createContext<
  AddToCollectionModalContextType | undefined
>(undefined);

export function AddToCollectionModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [recipeId, setRecipeId] = useState<string | null>(null);

  const showModal = (id: string) => {
    setRecipeId(id);
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
  };

  return (
    <AddToCollectionModalContext.Provider
      value={{isVisible, recipeId, showModal, hideModal}}>
      {children}
    </AddToCollectionModalContext.Provider>
  );
}

export function useAddToCollectionModal() {
  const context = useContext(AddToCollectionModalContext);
  if (context === undefined) {
    throw new Error(
      'useAddToCollectionModal must be used within an AddToCollectionModalProvider',
    );
  }
  return context;
}
