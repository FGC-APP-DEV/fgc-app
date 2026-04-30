import { createApolloClient } from '@fgc/graphql'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'

export const apolloClient = createApolloClient({
  uri: API_URL,
  getToken: () => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem('fgc_token')
  },
})
