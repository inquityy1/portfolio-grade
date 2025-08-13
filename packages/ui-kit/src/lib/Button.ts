import styled from 'styled-components';

export const Button = styled['button']`
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
`;