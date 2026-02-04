import {DefaultTheme} from '@react-navigation/native';
import {TextStyle} from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'Noto Serif',
    fontSize: 22,
    fontWeight: '600',
  } as TextStyle,
  h2: {
    fontFamily: 'Switzer',
    fontSize: 16,
    fontWeight: '400',
  } as TextStyle,
  'h2-emphasized': {
    fontFamily: 'Switzer',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  h3: {
    fontFamily: 'Switzer',
    fontSize: 15,
    fontWeight: '400',
  } as TextStyle,
  'h3-emphasized': {
    fontFamily: 'Switzer',
    fontSize: 15,
    fontWeight: '600',
  } as TextStyle,
  h4: {
    fontFamily: 'Switzer',
    fontWeight: '400',
    fontSize: 14,
  } as TextStyle,
  'h4-emphasized': {
    fontFamily: 'Switzer',
    fontWeight: '500',
    fontSize: 14,
  } as TextStyle,
  h5: {
    fontFamily: 'Switzer',
    fontWeight: '400',
    fontSize: 11,
    letterSpacing: 1.5,
  } as TextStyle,
  h6: {
    fontFamily: 'Switzer',
    fontWeight: '400',
    fontSize: 12,
  } as TextStyle,
  b1: {
    fontFamily: 'Source Serif 4',
    fontWeight: '400',
    fontSize: 14,
  } as TextStyle,
  b2: {
    fontFamily: 'Source Serif 4',
    fontWeight: '400',
    fontSize: 13,
  } as TextStyle,
};

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    'neutral-100': '#F0ECE4',
    'neutral-200': '#EEE9E0',
    'neutral-300': '#D9D2C7',
    'neutral-400': '#909090',
    'neutral-800': '#291E0D',
    'rust-200': '#F6D1A4',
    'rust-600': '#B54B00',
    background: '#F0ECE4',
    card: '#F0ECE4',
  },
  typography,
};
