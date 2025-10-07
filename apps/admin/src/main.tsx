import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createAppStore } from '@portfolio-grade/app-state';
import { UIProvider } from '@portfolio-grade/ui-kit';

// pages/components
import ProtectedRoute from './components/protectedRoute/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/loginPage/LoginPage';
import Dashboard from './pages/dashboard/Dashboard';
import AdminJobsPage from './pages/adminJobs/AdminJobsPage';
import AuditLogsPage from './pages/auditLogs/AuditLogsPage';
import CreateUserPage from './pages/createUser/CreateUserPage';
import CreateOrganizationPage from './pages/createOrganization/CreateOrganizationPage';

const store = createAppStore();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <UIProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/login' element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path='/' element={<Dashboard />} />
                <Route path='/admin-jobs' element={<AdminJobsPage />} />
                <Route path='/audit-logs' element={<AuditLogsPage />} />
                <Route path='/create-user' element={<CreateUserPage />} />
                <Route path='/create-organization' element={<CreateOrganizationPage />} />
              </Route>
            </Route>
            <Route path='*' element={<Navigate to='/login' replace />} />
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </Provider>
  </StrictMode>,
);
