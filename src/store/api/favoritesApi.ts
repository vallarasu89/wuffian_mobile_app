import { apiSlice } from './apiSlice';

export const favoritesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserFavorites: builder.query<any[], void>({
      query: () => '/users/getAllFavorites',
      transformResponse: (response: any) => {
        const raw = response?.data || response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Favorites'],
    }),

    addFavorite: builder.mutation<any, string | number>({
      query: (listingId) => ({
        url: `/users/addFavorites/${listingId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Favorites'],
    }),

    removeFavorite: builder.mutation<any, string | number>({
      query: (listingId) => ({
        url: `/users/removeFavorites/${listingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetUserFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesApi;
