import {DefaultTheme} from '@react-navigation/native';
import {TextStyle} from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'TAYTommyTokyoRegular',
    fontSize: 22,
    fontWeight: '400',
  } as TextStyle,
  h2: {
    fontFamily: 'Inclusive Sans',
    fontSize: 16,
    fontWeight: '400',
  } as TextStyle,
  'h2-emphasized': {
    fontFamily: 'Inclusive Sans',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  h4: {
    fontFamily: 'Inclusive Sans',
    fontWeight: '400',
    fontSize: 14,
  } as TextStyle,
  'h4-emphasized': {
    fontFamily: 'Inclusive Sans',
    fontWeight: '600',
    fontSize: 14,
  } as TextStyle,
  b1: {
    fontFamily: 'Inclusive Sans',
    fontWeight: '400',
    fontSize: 15,
  } as TextStyle,
};

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    'neutral-100': '#F9F3E8',
    'neutral-300': '#D9D2C7',
    'toffee-400': '#826B64',
    'neutral-800': '#322924',
    'yellow-400': '#F5C27C',
    'green-400': '#4FA863',
    background: '#F9F3E8',
    card: '#F9F3E8',
  },
  typography,
};
