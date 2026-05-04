import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from '@apollo/client/core'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

export interface GraphQLClientConfig {
  uri: string
  getToken?: () => string | null | Promise<string | null>
  onAuthError?: () => void
  onNetworkError?: (error: Error) => void
}

export function createApolloClient(
  config: GraphQLClientConfig,
): InstanceType<typeof ApolloClient> {
  const httpLink = createHttpLink({ uri: config.uri })

  const authLink = setContext(async (_, { headers }) => {
    const token = config.getToken ? await config.getToken() : null
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }
  })

  const errorLink = onError(({ error }) => {
    if (CombinedGraphQLErrors.is(error)) {
      for (const err of error.errors) {
        console.error(`[GraphQL error]: ${err.message}`)
        if (err.extensions?.code === 'UNAUTHENTICATED') {
          config.onAuthError?.()
        }
      }
      return
    }
    console.error(`[Network error]: ${error}`)
    if (error instanceof Error) {
      config.onNetworkError?.(error)
    }
  })

  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          teams: { merge: (_existing, incoming) => incoming },
          interviews: { merge: (_existing, incoming) => incoming },
        },
      },
    },
  })

  return new ApolloClient({
    link: ApolloLink.from([errorLink, authLink, httpLink]),
    cache,
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
      query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
  })
}

let singleton: InstanceType<typeof ApolloClient> | null = null

export function getApolloClient(
  config: GraphQLClientConfig,
): InstanceType<typeof ApolloClient> {
  if (!singleton) {
    singleton = createApolloClient(config)
  }
  return singleton
}

export function resetApolloClient(): void {
  singleton?.clearStore()
  singleton = null
}

export { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'
export { ApolloProvider, useApolloClient } from '@apollo/client/react'
