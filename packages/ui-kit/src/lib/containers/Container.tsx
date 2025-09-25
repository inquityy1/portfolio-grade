import styled from 'styled-components';

export const Container = styled.div<React.HTMLAttributes<HTMLDivElement> & { maxWidth?: string }>`
  padding: ${({ theme }) => theme.spacing(6)};
  max-width: ${({ maxWidth }) => maxWidth || '100%'};
  margin: 0 auto;
`;

export const PageContainer = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  padding: ${({ theme }) => theme.spacing(6)};
`;

export const LoadingContainer = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  padding: ${({ theme }) => theme.spacing(6)};
  text-align: center;
  color: ${({ theme }) => theme.colors.text};
`;

export const ErrorContainer = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  padding: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.error || 'tomato'};
`;

