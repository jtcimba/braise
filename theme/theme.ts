import {DefaultTheme} from '@react-navigation/native';
import {TextStyle} from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'Lora-Bold',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  } as TextStyle,
  h2: {
    fontFamily: 'Lora-SemiBold',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  } as TextStyle,
  h3: {
    fontFamily: 'Lora-SemiBold',
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  h4: {
    fontFamily: 'Lora-Medium',
    fontSize: 14,
    lineHeight: 18,
  } as TextStyle,
  bodyLarge: {
    fontFamily: 'MerriweatherSans-Medium',
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodyMedium: {
    fontFamily: 'MerriweatherSans-Regular',
    fontSize: 14,
    lineHeight: 22,
  } as TextStyle,
  bodySmall: {
    fontFamily: 'MerriweatherSans-Regular',
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  caption: {
    fontFamily: 'MerriweatherSans-Regular',
    fontSize: 12,
    lineHeight: 18,
  } as TextStyle,
  label: {
    fontFamily: 'MerriweatherSans-Medium',
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  button: {
    fontFamily: 'Lora-Medium',
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  link: {
    fontFamily: 'MerriweatherSans-Regular',
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
};

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#E06744',
    background: '#FDFDFD',
    card: '#FDFDFD',
    text: '#2D2D2D',
    subtext: '#5D5D5D',
    border: '#D4CFCD',
    opaque: 'rgba(75, 75, 75, 0.55)',
    opaqueCard: 'rgba(243, 239, 235, 0.55)',
    backgroundText: '#E4DFDD',
    textBox: '#FAFAFA',
    badgeBackground: '#EDEDEC',
    secondary: '#6A9C7B',
  },
  typography,
};
