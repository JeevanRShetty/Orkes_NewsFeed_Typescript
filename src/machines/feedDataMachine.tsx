import { createMachine, assign, fromPromise, setup } from 'xstate';
import { fetchFeedApi } from '../utils/fetchFeedApi'

interface FetchFeedInput {
    page: number;
  }

export const feedDataMachine = setup({
    actors: {
        fetchFeed: fromPromise(async ({ input }: { input: FetchFeedInput }) => {
          if (!input) {
            throw new Error('Input is required.');
          }
          const feedData = await fetchFeedApi(input.page);
          return feedData;
        }),
      },
  }).
   createMachine({
    types: {} as {  
        context: { feedData: any[];
            page: number;
            error?: any; }
        events:  { type: 'FETCH' }
        | { type: 'INCREMENT_PAGE' }
        | { type: 'RETRY' }
    },
    id: 'feedData',
    initial: 'idle',
    context: {
      feedData: [],
      page: 1,
      error: undefined,
    },
    states: {
      idle: {
        on: {
          FETCH: { target: 'loading' },
        },
      },
      loading: {
        invoke: {
          id: 'getFeedData',
          src: 'fetchFeed',
          input: ({ context: { page } }) => ({ page }),
          onDone: {
          target: 'success',
          actions: assign({ feedData: (context: any) => [...context?.context.feedData, ...context?.event?.output]})
          },
          onError: {
            target: 'failure',
            actions: assign({ error: ({ event }) => event.error }),
          },
        },
      },
      success: {
          on: {
              INCREMENT_PAGE: {
                  guard: (context) => context.context.page < 5,
                  actions: assign({
                  page: (context) => context.context.page + 1
                }),
                  target: 'loading',
                },
            },
      },
      failure: {
        on: {
          RETRY: { target: 'loading' },
        },
      },
    },
// );
});

