import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from './Button';

interface NavButtonProps {
  to: string;
  children: React.ReactNode;
}

export function NavButton({ to, children }: NavButtonProps) {
  return (
    <NavLink
      to={to}
      end
      style={{ textDecoration: 'none' }}
      className={({ isActive }) => (isActive ? 'nav-active' : 'nav')}
    >
      <Button>{children}</Button>
    </NavLink>
  );
}
