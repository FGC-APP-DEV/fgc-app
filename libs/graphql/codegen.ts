import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'libs/graphql/src/schema/**/*.graphql',
  documents: 'libs/graphql/src/**/*.graphql',
  ignoreNoDocuments: true,
  generates: {
    'libs/graphql/src/generated/types.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    },
  },
}

export default config
