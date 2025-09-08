import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createAppStore } from '@portfolio-grade/app-state';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './app/app';
import FormPage from './pages/FormPage';
import { UIProvider } from '@portfolio-grade/ui-kit';

const store = createAppStore()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <UIProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/forms/:id" element={<FormPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </Provider>
  </StrictMode>
)
