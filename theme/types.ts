export interface Theme {
  colors: {
    primary: string;
    background: string;
    text: string;
    subtext: string;
    border: string;
    opaque: string;
    backgroundText: string;
  };
  fonts: {
    regular: {
      fontFamily: string;
      fontWeight: string;
    };
    medium: {
      fontFamily: string;
      fontWeight: string;
    };
    light: {
      fontFamily: string;
      fontWeight: string;
    };
    thin: {
      fontFamily: string;
      fontWeight: string;
    };
  };
}
