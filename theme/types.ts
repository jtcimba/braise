import {TextStyle} from 'react-native';

export interface TypographyStyles {
  h1: TextStyle;
  h2: TextStyle;
  'h2-emphasized': TextStyle;
  h3: TextStyle;
  'h3-emphasized': TextStyle;
  h4: TextStyle;
  'h4-emphasized': TextStyle;
  h5: TextStyle;
  h6: TextStyle;
  b1: TextStyle;
  b2: TextStyle;
}

// Type for the theme object
export type Theme = {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    opaque: string;
    opaqueCard: string;
    backgroundText: string;
    [key: string]: string;
  };
  typography: TypographyStyles;
  [key: string]: any;
};

// Font family constants
export type FontFamily = string;

// Font weight constants
export type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';
