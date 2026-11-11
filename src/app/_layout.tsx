import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from '@/store';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { setCredentials, setInitialized } from '@/store/slices/authSlice';
import { useGetMeQuery } from '@/store/api/authApi';
import '../global.css';

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await tokenStorage.getToken();
        const storedUser = await tokenStorage.getUser();

        if (storedToken && storedUser) {
          dispatch(setCredentials({ token: storedToken, user: storedUser }));
        } else {
          dispatch(setInitialized(true));
        }
      } catch (e) {
        dispatch(setInitialized(true));
      }
    }

    if (!isInitialized) {
      restoreSession();
    }
  }, [isInitialized, dispatch]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SessionInitializer>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="listing/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="booking/[providerId]" options={{ presentation: 'card' }} />
          <Stack.Screen name="pets/add" options={{ presentation: 'modal' }} />
          <Stack.Screen name="support/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="insights/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="insights/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </SessionInitializer>
    </Provider>
  );
}
