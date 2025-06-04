import {DefaultTheme} from '@react-navigation/native';

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1B4D0E',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    subtext: '#7B7B76',
    border: '#D4D4D4',
    opaque: 'rgba(0, 0, 0, 0.15)',
    backgroundText: '#F3F3F3',
  },
  fonts: {
    regular: {
      fontFamily: 'Poppins-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Poppins-Medium',
      fontWeight: 'medium',
    },
    light: {
      fontFamily: 'Poppins-Light',
      fontWeight: 'light',
    },
    thin: {
      fontFamily: 'Poppins-Thin',
      fontWeight: 'thin',
    },
  },
};
