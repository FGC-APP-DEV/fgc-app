# App Transposition Reference

Code templates and conversion patterns for transposing legacy apps into **this** Nx monorepo.

**Import aliases:** Examples use `@org/...` as a readable stand-in — **substitute your real scopes** (`@acme`, `@repo`, etc.) discovered from `tsconfig.base.json` and `libs/*/package.json`.

---

## Lib Structure Template

Typical layout for feature libs:

```
libs/{feature}/
├── src/
│   ├── components/
│   │   ├── {Feature}List.tsx
│   │   ├── {Feature}Card.tsx
│   │   ├── {Feature}Form.tsx
│   │   └── index.ts
│   ├── services/
│   │   ├── use{Feature}.ts
│   │   ├── useCreate{Feature}.ts
│   │   └── index.ts
│   ├── index.ts
│   └── __tests__/         # optional / colocated *.spec.ts
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
└── jest.config.ts         # or vitest equivalent
```

### Barrel Export Pattern

```typescript
// libs/{feature}/src/index.ts
export * from './components'
export * from './services'
```

```typescript
// libs/{feature}/src/components/index.ts
export { FeatureList } from './FeatureList'
export { FeatureCard } from './FeatureCard'
export { FeatureForm } from './FeatureForm'
```

### project.json Template

```json
{
  "name": "{feature}",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/{feature}/src",
  "projectType": "library",
  "tags": ["scope:shared", "type:feature"],
  "targets": {
    "lint": {},
    "test": {}
  }
}
```

---

## REST to GraphQL Conversion (Example)

Adapt if the workspace is REST-first.

### Source: Next.js API Route (REST)

```typescript
// LEGACY: src/app/api/items/route.ts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.userId, session.user.id))
  return Response.json(items)
}
```

### Target: GraphQL Resolver (Example Imports)

Use your actual workspace aliases:

```typescript
// apps/{name}-api/src/resolvers/item.resolvers.ts
import { itemRepository } from '@org/database'
import { createItemSchema } from '@org/shared'
import { requireAuth } from '@org/auth'
import type { Resolvers } from '@org/graphql'

export const itemResolvers: Resolvers = {
  Query: {
    items: async (_parent, _args, context) => {
      requireAuth(context)
      return itemRepository.findByUserId(context.user.id)
    },
    item: async (_parent, { id }, context) => {
      requireAuth(context)
      return itemRepository.findById(id)
    },
  },
  Mutation: {
    createItem: async (_parent, { input }, context) => {
      requireAuth(context)
      const validated = createItemSchema.parse(input)
      return itemRepository.create({ ...validated, userId: context.user.id })
    },
  },
}
```

### Target: GraphQL Schema Fragment

```
# libs/graphql/src/schema/{feature}.graphql  (location may vary)
```

```graphql
type Item {
  id: ID!
  name: String!
  amount: Float!
  userId: String!
  createdAt: String!
}

input CreateItemInput {
  name: String!
  amount: Float!
}

extend type Query {
  items: [Item!]!
  item(id: ID!): Item
}

extend type Mutation {
  createItem(input: CreateItemInput!): Item!
}
```

---

## Repository Pattern

### Target: Repository

```typescript
// libs/database/src/repositories/item.repository.ts
import { db } from '../db'
import { itemsTable } from '../schema'
import { eq } from 'drizzle-orm'

export const itemRepository = {
  findByUserId: async (userId: string) => {
    return db.select().from(itemsTable).where(eq(itemsTable.userId, userId))
  },
  findById: async (id: string) => {
    const results = await db.select().from(itemsTable).where(eq(itemsTable.id, id))
    return results[0] ?? null
  },
  create: async (data: { name: string; amount: number; userId: string }) => {
    const results = await db.insert(itemsTable).values(data).returning()
    return results[0]
  },
  update: async (id: string, data: Partial<{ name: string; amount: number }>) => {
    const results = await db
      .update(itemsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(itemsTable.id, id))
      .returning()
    return results[0]
  },
  delete: async (id: string) => {
    await db.delete(itemsTable).where(eq(itemsTable.id, id))
  },
}
```

---

## Component Conversion (Example: Tailwind → Themed RN / RN-Web)

Prefer tokens from **`design-system` skill** discovery — names below are illustrative.

### Source: Next.js + Tailwind

```tsx
// LEGACY: src/components/feature/ItemCard.tsx
export function ItemCard({ item }: { item: Item }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="text-xl font-bold text-blue-600">
          {/** Use project currency helper instead of literals */}
          {item.amount.toFixed(2)}
        </span>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
          View Details
        </button>
      </div>
    </div>
  )
}
```

### Target: React Native + Theme Tokens (`@org/ui` example)

```tsx
// libs/{feature}/src/components/ItemCard.tsx
import { View, StyleSheet } from 'react-native'
import { Text, Button, Card } from '@org/ui'
import { colors, spacing, borderRadius } from '@org/ui'
import { formatCurrency } from '@org/shared'
import type { Item } from '@org/shared'

interface ItemCardProps {
  item: Item
  onViewDetails?: (item: Item) => void
}

export function ItemCard({ item, onViewDetails }: ItemCardProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      <Text variant="h4" color="primary">
        {item.name}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.description}>
        {item.description}
      </Text>
      <View style={styles.footer}>
        <Text variant="h3" style={styles.amount}>
          {formatCurrency(item.amount)}
        </Text>
        <Button
          variant="primary"
          size="small"
          onPress={() => onViewDetails?.(item)}
        >
          View Details
        </Button>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  description: { marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  amount: {
    // Use semantic/accent tokens from YOUR theme, not arbitrary hex/orange
    color: colors.accent ?? colors.primary[600],
  },
})
```

### Tailwind-ish → Token Mapping Cheat Sheet

| Tailwind-ish idea        | Prefer                                           |
| ------------------------ | ------------------------------------------------ |
| `bg-white`               | theme surface/card background token              |
| `rounded-lg`             | theme `borderRadius.lg` equivalent               |
| `shadow-sm`              | elevated `Card`/shadow token                     |
| `border-gray-*`          | themed border color scale                        |
| `text-blue-600` (CTA)    | `colors.primary[*]` / button primary variant     |

---

## Hook Conversion (fetch → Apollo example)

Mirror whatever client layer exists (Apollo, Relay, TanStack Query, etc.).

### Source: REST Hook

```typescript
// LEGACY: src/lib/hooks/useItems.ts
export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { items, loading, error }
}
```

### Target: Apollo Hook

```typescript
// libs/{feature}/src/services/useItems.ts
import { useQuery, gql } from '@apollo/client'
import type { Item } from '@org/shared'

const GET_ITEMS = gql`
  query GetItems {
    items {
      id
      name
      amount
      userId
      createdAt
    }
  }
`

export function useItems() {
  const { data, loading, error, refetch } = useQuery<{ items: Item[] }>(GET_ITEMS)
  return {
    items: data?.items ?? [],
    loading,
    error: error?.message ?? null,
    refetch,
  }
}
```

### Mutation Example

```typescript
// libs/{feature}/src/services/useCreateItem.ts
import { useMutation, gql } from '@apollo/client'
import type { Item, CreateItemInput } from '@org/shared'

const CREATE_ITEM = gql`
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
      id
      name
      amount
      userId
      createdAt
    }
  }
`

export function useCreateItem() {
  const [mutate, { loading, error }] = useMutation<
    { createItem: Item },
    { input: CreateItemInput }
  >(CREATE_ITEM, { refetchQueries: ['GetItems'] })

  const createItem = async (input: CreateItemInput) => {
    const result = await mutate({ variables: { input } })
    return result.data?.createItem
  }

  return { createItem, loading, error: error?.message ?? null }
}
```

---

## Screen Pattern (App Shell)

```tsx
// apps/{name}-web/src/screens/ItemScreen.tsx
import { View, StyleSheet } from 'react-native'
import { useAuth } from '@org/auth'
import { AppLayout, PageHeader } from '@org/ui'
import { ItemList, ItemForm } from '@org/{feature}'
import { useItems, useCreateItem } from '@org/{feature}'

export function ItemScreen() {
  const { user } = useAuth()
  const { items, loading } = useItems()
  const { createItem } = useCreateItem()

  return (
    <AppLayout>
      <PageHeader title="Items" subtitle={`Welcome, ${user?.name}`} />
      <View style={styles.content}>
        {user?.role === 'admin' && <ItemForm onSubmit={createItem} />}
        <ItemList items={items} loading={loading} />
      </View>
    </AppLayout>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
})
```

---

## Database Schema Extension (Example)

```typescript
// libs/database/src/schema.ts (append) — path may differ per repo
import { pgTable, uuid, varchar, decimal, timestamp } from 'drizzle-orm/pg-core'
import { users } from './schema'

export const newFeatureTable = pgTable('new_feature', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.email, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

Export repositories/types via the same barrel files used elsewhere in `libs/database`.

---

## Validation Conversion

```typescript
// libs/shared/src/validations/item.ts
import { z } from 'zod'

export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().positive().max(10000),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
```

---

## Auth Extension Pattern (Example)

| Legacy (NextAuth)               | Monorepo (`@org/auth` stand-in)          |
| ------------------------------- | ---------------------------------------- |
| `getServerSession(...)`          | server-side guard in resolver/context   |
| `useSession()`                  | workspace client hook (`useAuth`, etc.)  |
| `middleware.ts`                 | parity via API guards + UI route guards |
| role on session                 | `context.user.role` / client auth state |

---

## Test Patterns

### Resolver-ish Test Stub

```typescript
// apps/{name}-api/src/resolvers/__tests__/item.resolvers.spec.ts
import { itemResolvers } from '../item.resolvers'

describe('itemResolvers', () => {
  const mockContext = {
    user: { id: '1', email: 'test@example.com', role: 'user' },
  }

  it('returns items for authenticated user', async () => {
    const result = await itemResolvers.Query.items(null, {}, mockContext as any)
    expect(Array.isArray(result)).toBe(true)
  })
})
```

### Component Test Stub

Prefer asserting on **`formatCurrency` output rules** configured for your locale rather than brittle literal currency strings unless you intentionally pin them.

```typescript
import { render, screen } from '@testing-library/react-native'
import { ItemCard } from '../ItemCard'

const mockItem = {
  id: '1',
  name: 'Test Item',
  amount: 25.5,
  description: 'A test item',
}

describe('ItemCard', () => {
  it('renders core fields', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText('Test Item')).toBeTruthy()
    // Optionally assert formatted currency substring from formatCurrency mocks
  })
})
```
