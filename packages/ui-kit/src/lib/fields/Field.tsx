import styled from 'styled-components';

export const Field = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;