import {TextStyle} from 'react-native';

export interface TypographyStyles {
  // Header styles using Lora
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  h6: TextStyle;

  // Body text styles using Merriweather Sans
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  bodyXSmall: TextStyle;

  // Special text styles
  caption: TextStyle;
  label: TextStyle;
  button: TextStyle;
  link: TextStyle;

  // Additional Merriweather Sans styles
  merriweatherH1: TextStyle;
  merriweatherH2: TextStyle;
  merriweatherBody: TextStyle;
  merriweatherBodyBold: TextStyle;

  // Additional Lora styles
  loraH1: TextStyle;
  loraH2: TextStyle;
  loraBody: TextStyle;
  loraBodyBold: TextStyle;
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
