import {DefaultTheme} from '@react-navigation/native';

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#13411A',
    background: '#F2F0EC',
    card: '#F2F0EC',
    text: '#323232',
    subtext: '#7B7B76',
    border: '#D4D4D4',
    opaque: 'rgba(0, 0, 0, 0.15)',
    backgroundText: '#E8E8E3',
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
