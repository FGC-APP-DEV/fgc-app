import React from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from './config/apollo'
import './i18n'
import App from './App'

const el = document.getElementById('root')
if (!el) throw new Error('Root element not found')

createRoot(el).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
)
