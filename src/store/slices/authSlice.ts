import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id?: string | number;
  user_id?: string | number;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  avatar?: string;
  profile_image?: string;
  role?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserProfile | null; token?: string | null }>
    ) => {
      state.user = action.payload.user;
      if (action.payload.token !== undefined) {
        state.token = action.payload.token;
      }
      state.isAuthenticated = Boolean(action.payload.user || action.payload.token);
      state.isInitialized = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
});

export const { setCredentials, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
