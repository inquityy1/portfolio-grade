import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UIProvider } from '@portfolio-grade/ui-kit';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <UIProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UIProvider>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getAllByText } = render(
      <UIProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UIProvider>
    );
    expect(
      getAllByText(new RegExp('Admin', 'gi')).length > 0
    ).toBeTruthy();
  });
});
