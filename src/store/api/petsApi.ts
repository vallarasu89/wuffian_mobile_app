import { apiSlice } from './apiSlice';

export interface PetItem {
  id: string | number;
  pet_id?: string | number;
  name: string;
  type: string;
  breed: string;
  birthDate?: string;
  vaccinationType?: string;
  vaccinationDue?: string;
  insurance?: string;
  expiryDate?: string;
  image?: string;
  images?: string[];
  documents?: any[];
  vaccinations?: any[];
}

export const petsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserPets: builder.query<PetItem[], void>({
      query: () => '/pets/getMyPets',
      transformResponse: (response: any) => {
        const raw = response?.data?.pets || response?.data || response?.pets || response;
        if (Array.isArray(raw)) {
          return raw.map((p, idx) => ({
            id: p.pet_id || p.id || `pet-${idx}`,
            pet_id: p.pet_id || p.id,
            name: p.pet_name || p.name || 'Pet Companion',
            type: p.category?.category_name || p.type || 'Pet',
            breed: p.breed || '',
            birthDate: p.birth_date || p.birthDate || '',
            vaccinationType: p.vaccination_type || p.vaccinationType || '',
            vaccinationDue: p.vaccination_due_date || p.vaccinationDue || '',
            insurance: p.insurance_policy_number || p.insurance || '',
            expiryDate: p.insurance_expiry_date || p.expiryDate || '',
            image: (Array.isArray(p.images) ? p.images[0] : p.image) || undefined,
            documents: Array.isArray(p.documents) ? p.documents : [],
            vaccinations: Array.isArray(p.vaccinations) ? p.vaccinations : [],
          }));
        }
        return [];
      },
      providesTags: ['Pets'],
    }),

    getPetById: builder.query<any, string | number>({
      query: (id) => `/pets/getPetById/${id}`,
      providesTags: (result, error, id) => [{ type: 'Pets', id }],
    }),

    createPet: builder.mutation<any, Partial<PetItem>>({
      query: (petData) => ({
        url: '/pets/createPet',
        method: 'POST',
        body: petData,
      }),
      invalidatesTags: ['Pets'],
    }),

    updatePet: builder.mutation<any, { pet_id: string | number } & Partial<PetItem>>({
      query: ({ pet_id, ...petData }) => ({
        url: `/pets/updatePet/${pet_id}`,
        method: 'PUT',
        body: petData,
      }),
      invalidatesTags: ['Pets'],
    }),

    deletePet: builder.mutation<any, string | number>({
      query: (pet_id) => ({
        url: `/pets/deletePet/${pet_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Pets'],
    }),

    getPetCategories: builder.query<any[], void>({
      query: () => '/pet-categories/getPetCategories',
      transformResponse: (response: any) => {
        const raw = response?.data || response;
        return Array.isArray(raw) ? raw : [
          { id: 1, name: 'Dog' },
          { id: 2, name: 'Cat' },
          { id: 3, name: 'Bird' },
          { id: 4, name: 'Small Pet' },
        ];
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetUserPetsQuery,
  useGetPetByIdQuery,
  useCreatePetMutation,
  useUpdatePetMutation,
  useDeletePetMutation,
  useGetPetCategoriesQuery,
} = petsApi;
