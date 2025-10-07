import styled from 'styled-components';

export const Label = styled.label<React.LabelHTMLAttributes<HTMLLabelElement>>`
  display: block;
  font-size: 0.95rem;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.colors.text};
`;
