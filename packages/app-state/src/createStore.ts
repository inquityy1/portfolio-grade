import { configureStore } from '@reduxjs/toolkit';
import auth from './slices/authSlice';
import tenant from './slices/tenantSlice';
import { api } from './services/api';

export function createAppStore() {
  return configureStore({
    reducer: { auth, tenant, [api.reducerPath]: api.reducer },
    middleware: gDM => gDM().concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
