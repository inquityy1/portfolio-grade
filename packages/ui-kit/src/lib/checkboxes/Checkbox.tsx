import styled from 'styled-components';

export const Checkbox = styled.input.attrs({ type: 'checkbox' })<
  React.InputHTMLAttributes<HTMLInputElement>
>`
  width: 18px;
  height: 18px;
  accent-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
`;
