import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AuthState = { token: string | null };
const initialState: AuthState = {
  token: (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || null,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      if (typeof localStorage !== 'undefined') {
        if (action.payload) localStorage.setItem('token', action.payload);
        else localStorage.removeItem('token');
      }
    },
    clearToken(state) {
      state.token = null;
      if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
    },
  },
});

export const { setToken, clearToken } = slice.actions;
export default slice.reducer;
