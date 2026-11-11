import { apiSlice } from './apiSlice';

export interface ListingItem {
  id: string | number;
  listing_id?: string | number;
  name: string;
  category: string;
  rating?: number;
  distance?: string;
  location?: string;
  address?: string;
  statusText?: string;
  isOpen?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  image?: string;
  images?: string[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  workingHours?: any[];
  services?: any[];
  reviews?: any[];
  description?: string;
}

export const searchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<any[], void>({
      query: () => '/listing-categories/getAllListingCategories',
      transformResponse: (response: any) => {
        const raw =
          response?.data?.rows ||
          response?.data?.categories ||
          response?.data?.listingCategories ||
          response?.data ||
          response?.rows ||
          response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Categories'],
    }),

    searchListings: builder.query<any, {
      query?: string;
      search?: string;
      q?: string;
      city?: string;
      location?: string;
      locality?: string;
      state?: string;
      lat?: number | string;
      lng?: number | string;
      radius_km?: number | string;
      category_ids?: string | number | (string | number)[];
      min_rating?: number | string;
      badge?: string;
      listing_badge?: string;
      is_emergency?: boolean | string | number;
      is_24_7?: boolean | string | number;
      sort_by?: string;
      limit?: number | string;
      page?: number | string;
    }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        const q = params.query ?? params.search ?? params.q;
        if (q && String(q).trim()) queryParams.append('query', String(q).trim());
        if (params.city && String(params.city).trim()) queryParams.append('city', String(params.city).trim());
        if (params.location && String(params.location).trim()) queryParams.append('location', String(params.location).trim());
        if (params.locality && String(params.locality).trim()) queryParams.append('locality', String(params.locality).trim());
        if (params.state && String(params.state).trim()) queryParams.append('state', String(params.state).trim());

        if (params.lat !== undefined && params.lat !== null && !isNaN(Number(params.lat))) {
          queryParams.append('lat', String(params.lat));
        }
        if (params.lng !== undefined && params.lng !== null && !isNaN(Number(params.lng))) {
          queryParams.append('lng', String(params.lng));
        }
        if (params.radius_km && !isNaN(Number(params.radius_km))) {
          queryParams.append('radius_km', String(params.radius_km));
        }

        if (params.category_ids) {
          if (Array.isArray(params.category_ids)) {
            queryParams.append('category_ids', params.category_ids.join(','));
          } else {
            queryParams.append('category_ids', String(params.category_ids));
          }
        }

        if (params.min_rating && !isNaN(Number(params.min_rating))) {
          queryParams.append('min_rating', String(params.min_rating));
        }

        const badge = params.listing_badge ?? params.badge;
        if (badge) queryParams.append('listing_badge', String(badge));

        if (params.is_emergency !== undefined && params.is_emergency !== null && params.is_emergency !== '') {
          queryParams.append('is_emergency', String(params.is_emergency));
        }
        if (params.is_24_7 !== undefined && params.is_24_7 !== null && params.is_24_7 !== '') {
          queryParams.append('is_24_7', String(params.is_24_7));
        }

        if (params.sort_by) queryParams.append('sort_by', String(params.sort_by));
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.page) queryParams.append('page', String(params.page));

        const qs = queryParams.toString();
        return `/search/listings${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response: any) => {
        if (response && response.data) {
          return response.data;
        }
        return response;
      },
      providesTags: ['Listings'],
    }),

    getListingById: builder.query<any, string | number>({
      query: (id) => `/listings/getListingById/${id}`,
      providesTags: (result, error, id) => [{ type: 'Listings', id }],
    }),

    getRelatedListings: builder.query<any, { listing_id: string | number; limit?: number }>({
      query: ({ listing_id, limit = 4 }) => `/listings/related/${listing_id}?limit=${limit}`,
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCategoriesQuery,
  useSearchListingsQuery,
  useLazySearchListingsQuery,
  useGetListingByIdQuery,
  useGetRelatedListingsQuery,
} = searchApi;
