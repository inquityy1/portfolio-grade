import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { NavButton } from './NavButton';

// Mock react-router-dom NavLink
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  NavLink: jest.fn(({ to, children, className }) => {
    const React = require('react');
    return React.createElement(
      'a',
      {
        href: to,
        className: className?.({ isActive: false }) || '',
      },
      children,
    );
  }),
}));

// Mock Button component
jest.mock('./Button', () => ({
  Button: jest.fn(({ children }) => {
    const React = require('react');
    return React.createElement('button', {}, children);
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>,
  );
};

describe('NavButton', () => {
  it('should render with correct props', () => {
    renderWithRouter(<NavButton to='/test'>Test Link</NavButton>);

    expect(screen.getByText('Test Link')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
  });

  it('should apply nav class by default', () => {
    renderWithRouter(<NavButton to='/test'>Test Link</NavButton>);

    const link = screen.getByRole('link');
    expect(link).toHaveClass('nav');
  });

  it('should render children correctly', () => {
    renderWithRouter(
      <NavButton to='/dashboard'>
        <span>Dashboard</span>
      </NavButton>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
