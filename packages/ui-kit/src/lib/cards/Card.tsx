import styled from 'styled-components';

export const Card = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.colors.surface};
`;

export const CardHeader = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

export const CardTitle = styled.h3<React.HTMLAttributes<HTMLHeadingElement>>`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`;

export const CardContent = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  color: ${({ theme }) => theme.colors.text};
`;

export const CardFooter = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(3)};
`;
