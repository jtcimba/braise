import {
  DefaultTheme,
  DarkTheme as NavDarkTheme,
} from '@react-navigation/native';
import {TextStyle} from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'TAYTommyTokyoRegular',
    fontSize: 24,
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
    'neutral-100': 'rgb(255, 253, 246)',
    'neutral-300': 'rgb(218, 218, 218)',
    'toffee-400': 'rgb(154, 150, 149)',
    'neutral-800': 'rgb(21, 21, 21)',
    'yellow-400': '#F5C27C',
    'on-yellow': 'rgb(21, 21, 21)',
    background: 'rgb(255, 253, 246)',
    card: 'rgb(255, 253, 246)',
  },
  typography,
};

export const DarkTheme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    'neutral-100': 'rgb(21, 21, 21)',
    'neutral-300': 'rgb(39, 39, 38)',
    'toffee-400': 'rgb(154, 150, 149)',
    'neutral-800': 'rgb(255, 253, 246)',
    'yellow-400': '#F5C27C',
    'on-yellow': 'rgb(21, 21, 21)',
    background: 'rgb(21, 21, 21)',
    card: 'rgb(21, 21, 21)',
  },
  typography,
};
