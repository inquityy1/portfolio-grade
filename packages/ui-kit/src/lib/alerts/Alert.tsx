import styled from 'styled-components';

export const Alert = styled.div<
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'error' | 'success' | 'warning' | 'info' }
>`
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radius.md};
  margin: ${({ theme }) => theme.spacing(2)} 0;

  ${({ variant = 'info', theme }) => {
    switch (variant) {
      case 'error':
        return `
          color: ${theme.colors.error || 'tomato'};
          background-color: ${theme.colors.errorBackground || '#ffe6e6'};
            border: 1px solid ${theme.colors.error || 'tomato'};
        `;
      case 'success':
        return `
          color: ${theme.colors.success || '#2e7d32'};
          background-color: ${theme.colors.successBackground || '#e8f5e8'};
          border: 1px solid ${theme.colors.success || '#2e7d32'};
        `;
      case 'warning':
        return `
          color: ${theme.colors.warning || '#f57c00'};
          background-color: ${theme.colors.warningBackground || '#fff3e0'};
          border: 1px solid ${theme.colors.warning || '#f57c00'};
        `;
      default:
        return `
          color: ${theme.colors.text};
          background-color: ${theme.colors.surface};
          border: 1px solid ${theme.colors.border};
        `;
    }
  }}
`;
