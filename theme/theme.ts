import {DefaultTheme} from '@react-navigation/native';
import {TextStyle} from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'Satoshi Variable',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  } as TextStyle,
  h2: {
    fontFamily: 'Satoshi Variable',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  } as TextStyle,
  h3: {
    fontFamily: 'Satoshi Variable',
    fontWeight: 'medium',
    fontSize: 16,
    letterSpacing: 0.2,
  } as TextStyle,
  h4: {
    fontFamily: 'Satoshi Variable',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  } as TextStyle,
  h5: {
    fontFamily: 'Satoshi Variable',
    fontWeight: 'medium',
    fontSize: 15,
    letterSpacing: 0.2,
  } as TextStyle,
  b1: {
    fontFamily: 'Erode Variable',
    fontWeight: 'medium',
    fontSize: 18,
  } as TextStyle,
  b2: {
    fontFamily: 'Erode Variable',
    fontWeight: 'medium',
    fontSize: 16,
  } as TextStyle,
};

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'rgb(251, 108, 52)',
    background: '#F6F6F4',
    card: '#F6F6F4',
    text: '#2D2D2D',
    subtext: '#5D5D5D',
    border: '#E8E6E3',
    opaque: 'rgba(45, 45, 45, 0.55)',
    secondary: '#496F4E',
  },
  typography,
};
