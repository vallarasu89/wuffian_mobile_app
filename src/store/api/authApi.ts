import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, { identifier: string; password: string }>({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<any, { name: string; email: string; phone: string; password: string }>({
      query: (userData) => ({
        url: '/users/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    sendOtp: builder.mutation<any, { email?: string; phone?: string; mobile?: string }>({
      query: (data) => ({
        url: '/users/send-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyOtp: builder.mutation<any, { email?: string; phone?: string; mobile?: string; otp: string; code?: string }>({
      query: (data) => ({
        url: '/users/verify-otp',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    getMe: builder.query<any, void>({
      query: () => '/users/getUserProfile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<any, any>({
      query: (data) => ({
        url: '/users/updateProfile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    forgotPassword: builder.mutation<any, { identifier: string }>({
      query: (data) => ({
        url: '/users/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<any, { identifier?: string; email?: string; otp: string; newPassword?: string; password?: string }>({
      query: (data) => ({
        url: '/users/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    logoutUser: builder.mutation<any, void>({
      query: () => ({
        url: '/users/logout',
        method: 'POST',
      }),
    }),
    changePassword: builder.mutation<any, { currentPassword?: string; oldPassword?: string; newPassword?: string; confirmPassword?: string }>({
      query: (data) => ({
        url: '/users/change-password',
        method: 'POST',
        body: data,
      }),
    }),
    getNotificationPreferences: builder.query<any, void>({
      query: () => '/users/notification-preferences',
      providesTags: ['NotificationPreferences'],
    }),
    updateNotificationPreferences: builder.mutation<any, any>({
      query: (data) => ({
        url: '/users/notification-preferences',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['NotificationPreferences'],
    }),
    uploadMultipleFiles: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/uploads/multiplefiles',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutUserMutation,
  useChangePasswordMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useUploadMultipleFilesMutation,
} = authApi;
