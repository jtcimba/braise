import {DefaultTheme} from '@react-navigation/native';
import {TextStyle} from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'Satoshi Variable',
    fontSize: 20,
    fontWeight: 'bold',
  } as TextStyle,
  h2: {
    fontFamily: 'Satoshi Variable',
    fontSize: 16,
    fontWeight: 'bold',
  } as TextStyle,
  h3: {
    fontFamily: 'Satoshi Variable',
    fontWeight: 'medium',
    fontSize: 16,
  } as TextStyle,
  h4: {
    fontFamily: 'Satoshi Variable',
    fontWeight: 'bold',
    fontSize: 14,
  } as TextStyle,
  h5: {
    fontFamily: 'Satoshi Variable',
    fontWeight: 'medium',
    fontSize: 14,
  } as TextStyle,
  b1: {
    fontFamily: 'Erode Variable',
    fontWeight: 'medium',
    fontSize: 16,
  } as TextStyle,
  b2: {
    fontFamily: 'Erode Variable',
    fontWeight: 'medium',
    fontSize: 15,
  } as TextStyle,
};

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#EA672D',
    background: '#F6F6F4',
    card: '#F6F6F4',
    text: '#2D2D2D',
    subtext: '#5D5D5D',
    border: '#EDEDEC',
    opaque: 'rgba(75, 75, 75, 0.55)',
    opaqueCard: 'rgba(243, 239, 235, 0.55)',
    backgroundText: '#E8E6E3',
    textBox: '#E8E6E3',
    badgeBackground: '#EDEDEC',
    secondary: '#6A9C7B',
  },
  typography,
};
