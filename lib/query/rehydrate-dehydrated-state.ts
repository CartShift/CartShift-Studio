import type { DehydratedState } from '@tanstack/react-query';
import { rehydratePortalTimestamps } from '@/lib/utils/timestamp-like';

export function rehydrateDehydratedState(state: DehydratedState): DehydratedState {
  return {
    ...state,
    queries: state.queries.map(query => ({
      ...query,
      state: {
        ...query.state,
        data:
          query.state.data !== undefined
            ? rehydratePortalTimestamps(query.state.data)
            : query.state.data,
      },
    })),
    mutations: state.mutations.map(mutation => ({
      ...mutation,
      state: {
        ...mutation.state,
        data:
          mutation.state.data !== undefined
            ? rehydratePortalTimestamps(mutation.state.data)
            : mutation.state.data,
      },
    })),
  };
}
