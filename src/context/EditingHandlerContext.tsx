import React, {createContext, useContext, useState, ReactNode} from 'react';

interface EditingHandlerContextType {
  handleSavePress: () => void;
  setHandleSavePress: (_fn: () => void) => void;
  handleDeletePress: () => void;
  setHandleDeletePress: (_fn: () => void) => void;
}

const EditngHandlerContext = createContext<EditingHandlerContextType>({
  handleSavePress: () => {},
  setHandleSavePress: (_fn: () => void) => {},
  handleDeletePress: () => {},
  setHandleDeletePress: (_fn: () => void) => {},
});

export const EditingHandlerProvider = ({children}: {children: ReactNode}) => {
  const [handleSavePress, setHandleSavePress] = useState(() => () => {});
  const [handleDeletePress, setHandleDeletePress] = useState(() => () => {});

  return (
    <EditngHandlerContext.Provider
      value={{
        handleSavePress,
        setHandleSavePress,
        handleDeletePress,
        setHandleDeletePress,
      }}>
      {children}
    </EditngHandlerContext.Provider>
  );
};

export const useEditingHandler = () => useContext(EditngHandlerContext);
