import { apiSlice } from './apiSlice';

export const ticketsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTicketTopics: builder.query<any[], void>({
      query: () => '/tickets/topics',
      transformResponse: (response: any) => {
        const raw = response?.data || response?.topics || response;
        return Array.isArray(raw) ? raw : [
          { id: 1, topic_name: 'Appointment Enquiry' },
          { id: 2, topic_name: 'Listing Information Issue' },
          { id: 3, topic_name: 'Technical / App Bug' },
          { id: 4, topic_name: 'Account & Profile' },
          { id: 5, topic_name: 'General Feedback' },
        ];
      },
      providesTags: ['Tickets'],
    }),

    createTicket: builder.mutation<any, { topic_id: number | string; description: string }>({
      query: (ticketData) => ({
        url: '/tickets/raiseTicket',
        method: 'POST',
        body: ticketData,
      }),
      invalidatesTags: ['Tickets'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetTicketTopicsQuery,
  useCreateTicketMutation,
} = ticketsApi;
