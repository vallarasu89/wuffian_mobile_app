import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ENV } from '@/config/env';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { logout } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: ENV.API_BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    // 1. Check in-memory redux token
    let token = (getState() as any)?.auth?.token;

    // 2. Fallback to secure native storage
    if (!token) {
      token = await tokenStorage.getToken();
    }

    if (token) {
      const clean = String(token).replace(/^Bearer\s+/i, '').trim();
      if (clean) {
        headers.set('Authorization', `Bearer ${clean}`);
      }
    }

    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Session expired or invalid
    await tokenStorage.clearSession();
    api.dispatch(logout());
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Pets', 'Favorites', 'Listings', 'Tickets', 'Categories', 'CMS', 'NotificationPreferences'],
  endpoints: () => ({}),
});
