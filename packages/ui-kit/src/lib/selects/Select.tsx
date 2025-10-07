import styled from 'styled-components';

export const Select = styled.select<React.SelectHTMLAttributes<HTMLSelectElement>>`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.25);
  }
`;
