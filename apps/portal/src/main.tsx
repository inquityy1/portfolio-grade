import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createAppStore } from '@portfolio-grade/app-state';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FormPage from './pages/forms/FormPage';
import CreateFormPage from './pages/forms/CreateFormPage';
import EditFormPage from './pages/forms/EditFormPage';
import { UIProvider } from '@portfolio-grade/ui-kit';
import LoginPage from './pages/login/LoginPage';
import ProtectedRoute from './components/protectedRoute/ProtectedRoute';
import Layout from './components/layout/Layout';
import PostsPage from './pages/posts/PostsPage';
import FormsListPage from './pages/forms/FormsListPage';
import PortalDashboard from './pages/dashboard/PortalDashboard';

const store = createAppStore()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <UIProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<PortalDashboard />} />
                <Route path="/forms" element={<FormsListPage />} />
                <Route path="/forms/:id" element={<FormPage />} />
                <Route path="/forms/new" element={<CreateFormPage />} />
                <Route path="/forms/:id/edit" element={<EditFormPage />} />
                <Route path="/posts" element={<PostsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </Provider>
  </StrictMode>
)
