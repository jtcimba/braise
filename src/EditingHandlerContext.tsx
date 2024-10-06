import React, {createContext, useContext, useState, ReactNode} from 'react';

const EditngHandlerContext = createContext({
  handleSavePress: () => {},
  setHandleSavePress: (_fn: () => void) => {},
});

export const EditingHandlerProvider = ({children}: {children: ReactNode}) => {
  const [handleSavePress, setHandleSavePress] = useState(() => () => {});

  return (
    <EditngHandlerContext.Provider
      value={{handleSavePress, setHandleSavePress}}>
      {children}
    </EditngHandlerContext.Provider>
  );
};

export const useEditingHandler = () => useContext(EditngHandlerContext);
