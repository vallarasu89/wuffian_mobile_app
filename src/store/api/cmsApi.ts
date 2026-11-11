import { apiSlice } from './apiSlice';

export const cmsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInsights: builder.query<any[], void>({
      query: () => '/cms/insights',
      transformResponse: (response: any) => {
        const raw = response?.data || response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['CMS'],
    }),
  }),
  overrideExisting: true,
});

export const { useGetInsightsQuery } = cmsApi;
