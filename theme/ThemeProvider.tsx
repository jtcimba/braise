import React, {createContext, useContext} from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({theme, children}: any) => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
