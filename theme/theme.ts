import {DefaultTheme} from '@react-navigation/native';
import {TextStyle} from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 18,
    fontWeight: 'semibold',
    letterSpacing: 0.2,
  } as TextStyle,
  h2: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 16,
    fontWeight: 'semibold',
    letterSpacing: 0.2,
  } as TextStyle,
  h3: {
    fontFamily: 'Hanken Grotesk',
    fontWeight: 'medium',
    fontSize: 16,
    letterSpacing: 0.2,
  } as TextStyle,
  h4: {
    fontFamily: 'Hanken Grotesk',
    fontWeight: 'semibold',
    fontSize: 15,
    letterSpacing: 0.2,
  } as TextStyle,
  h5: {
    fontFamily: 'Hanken Grotesk',
    fontWeight: 'medium',
    fontSize: 15,
    letterSpacing: 0.2,
  } as TextStyle,
  b1: {
    fontFamily: 'Crimson Text',
    fontWeight: 'medium',
    fontSize: 18,
  } as TextStyle,
  b2: {
    fontFamily: 'Crimson Text',
    fontWeight: 'medium',
    fontSize: 16,
  } as TextStyle,
};

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ED7128',
    background: '#FFFBF3',
    card: '#FFFBF3',
    text: '#000000',
    subtext: '#7A7874',
    border: '#E8E6E3',
    opaque: 'rgba(45, 45, 45, 0.55)',
    secondary: '#000000',
  },
  typography,
};
