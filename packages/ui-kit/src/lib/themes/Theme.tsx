import { ThemeProvider, createGlobalStyle } from 'styled-components';
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      bg: string;
      text: string;
      surface: string;
      border: string;
      primary: string;
    };
    radius: {
      md: string;
    };
    spacing: (n: number) => string;
  }
}

export const theme = {
  colors: { bg: '#0b0d12', text: '#e8eaed', surface: '#161a22', border: '#2a2f3a', primary: '#5865f2' },
  radius: { md: '12px' },
  spacing: (n: number) => `${n * 4}px`,
};

export const GlobalStyle = createGlobalStyle`
  html,body,#root{height:100%}
  body{margin:0;background:${({ theme }) => theme.colors.bg};color:${({ theme }) => theme.colors.text}}
`;

export const UIProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
  <ThemeProvider theme={theme} >
    <GlobalStyle />
    {children}
  </ThemeProvider>
);