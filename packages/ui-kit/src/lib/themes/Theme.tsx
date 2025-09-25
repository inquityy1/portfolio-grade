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
      error?: string;
      errorBackground?: string;
      success?: string;
      successBackground?: string;
      warning?: string;
      warningBackground?: string;
    };
    radius: {
      md: string;
      lg: string;
    };
    spacing: (n: number) => string;
  }
}

export const theme = {
  colors: {
    bg: '#0b0d12',
    text: '#e8eaed',
    surface: '#161a22',
    border: '#2a2f3a',
    primary: '#5865f2',
    error: 'tomato',
    errorBackground: '#ffe6e6',
    success: '#2e7d32',
    successBackground: '#e8f5e8',
    warning: '#f57c00',
    warningBackground: '#fff3e0'
  },
  radius: { md: '12px', lg: '16px' },
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