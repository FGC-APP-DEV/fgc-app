import { writeFileSync } from 'node:fs'
import { z, type ZodTypeAny } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as c from '../libs/contracts/src/lib/contracts'
import { commands, reads } from '../libs/server/src/routes'

const schema = (value: ZodTypeAny) =>
  zodToJsonSchema(value, { target: 'openApi3', $refStrategy: 'none' })
const receipt = schema(
  z
    .object({
      commandId: c.uuid,
      entityId: c.uuid,
      resultingVersion: c.version,
      outcome: z.enum(['created', 'updated', 'deleted', 'noop']),
      committedAt: z.string().datetime(),
    })
    .strict(),
)
const envelope = (data: unknown) => ({
  type: 'object',
  required: ['data', 'meta'],
  properties: {
    data,
    meta: {
      type: 'object',
      required: ['requestId'],
      properties: {
        requestId: { type: 'string', format: 'uuid' },
        nextCursor: { type: 'string' },
      },
    },
  },
})
const error = {
  description:
    'Safe canonical error. Authorization and SQL rules are rechecked on every request, including receipt replay.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', enum: Object.keys(c.errorStatus) },
              message: { type: 'string' },
              fieldErrors: { type: 'object' },
            },
          },
          requestId: { type: 'string' },
        },
      },
    },
  },
}
const paths: Record<string, Record<string, unknown>> = {}
function add(
  method: string,
  path: string,
  input?: ZodTypeAny,
  options: {
    capability?: string
    receipt?: boolean
    idempotent?: boolean
    paginated?: boolean
    security?: unknown[]
    description?: string
  } = {},
) {
  const parameters: unknown[] = Array.from(path.matchAll(/:([a-zA-Z]+)/g), (match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: match[1] === 'type' ? schema(c.flagType) : schema(c.uuid),
  }))
  if (options.idempotent)
    parameters.push({
      name: 'Idempotency-Key',
      in: 'header',
      required: true,
      schema: schema(c.uuid),
      description:
        'Reuse exactly the same normalized request for a manual retry. Reauthorize before replay. No automatic retries.',
    })
  if (options.paginated)
    parameters.push(
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      },
      { name: 'cursor', in: 'query', schema: { type: 'string' } },
    )
  if (path === '/teams')
    parameters.push({
      name: 'search',
      in: 'query',
      schema: { type: 'string', maxLength: 120 },
    })
  if (path === '/pages')
    parameters.push({ name: 'sourceArea', in: 'query', schema: schema(c.pageSource) })
  if (path === '/mentor/pages')
    parameters.push({
      name: 'X-Installation-Id',
      in: 'header',
      required: true,
      schema: schema(c.uuid),
    })
  const normalized = path.replace(/:([a-zA-Z]+)/g, '{$1}')
  paths[normalized] ??= {}
  paths[normalized][method] = {
    operationId: method + normalized.replace(/[^a-zA-Z]/g, '_'),
    summary: options.capability
      ? `Requires current ${options.capability} capability`
      : path,
    description:
      options.description ??
      'Client DTOs are defined in @fgc/contracts. Business constraints and current-session authorization also run transactionally in SQL. Refinements that involve multiple fields are enforced at runtime.',
    security: options.security ?? [{ staff: [] }],
    parameters,
    ...(input
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: schema(input) } },
          },
        }
      : {}),
    responses: {
      '200': {
        description: options.receipt
          ? 'Immutable receipt only; query current entity separately.'
          : 'Success envelope; read projections follow @fgc/contracts DTOs.',
        content: {
          'application/json': {
            schema: envelope(
              options.receipt ? { $ref: '#/components/schemas/Receipt' } : {},
            ),
          },
        },
      },
      '400': error,
      '401': error,
      '403': error,
      '404': error,
      '409': error,
      '413': error,
      '429': error,
      '503': error,
    },
  }
}
for (const route of commands)
  add(route.method, route.path, route.schema, {
    capability: route.capability,
    receipt: true,
    idempotent: true,
  })
for (const route of reads)
  add('get', route.path, undefined, {
    capability: route.capability,
    paginated: route.paginated,
  })
for (const [path, input] of Object.entries({
  email: c.emailInput,
  verify: c.verifyInput,
  'confirm-link': c.confirmLinkInput,
  exchange: c.exchangeInput,
  refresh: c.refreshInput,
  logout: c.refreshInput,
}))
  add('post', '/auth/' + path, input, {
    security: path === 'logout' ? [{ staff: [] }] : [],
    description:
      'Web uses the HttpOnly refresh cookie and exact Origin validation. Refresh/logout additionally require X-CSRF-Token. Native refresh token is stored in SecureStore and sent only in the body. Confirm-link is a human-initiated POST; exchange requires the original PKCE verifier.',
  })
add('get', '/auth/csrf', undefined, {
  security: [{ refreshCookie: [] }],
  description:
    'Exact Origin, or same-origin Fetch Metadata plus allowlisted Referer, required. Returns csrfToken.',
})
add('post', '/admin/access', c.accessInput, {
  capability: 'admin',
  idempotent: true,
  description:
    'Per-email result contains email and receipt or error. Current expectedVersion required for existing approval.',
})
add('post', '/admin/mentor-codes', c.mentorCodeInput, {
  capability: 'admin',
  idempotent: true,
  description:
    'Returns receipt plus one-time code. Replays return SECRET_ALREADY_ISSUED. No code is retained in receipts.',
})
add('post', '/imports/preview', c.importPreviewInput, {
  capability: 'admin',
  idempotent: true,
  description:
    'Preview is actor-bound and expires in 30 minutes. Returns rows/columns/sheets/id/version/expiresAt.',
})
add('get', '/imports/:id', undefined, { capability: 'admin' })
add('post', '/imports/:id/commit', c.versionInput, {
  capability: 'admin',
  idempotent: true,
  description:
    'Commits each valid row independently; returns current preview with results and per-row errors. Never overwrites existing identifiers.',
})
add('post', '/mentor/redeem', c.redeemInput, {
  security: [],
  description:
    'Rate-limited redemption. Web receives HttpOnly mentor cookie, native receives opaque sessionToken. Team comes solely from the redeemed code.',
})
const mentorSecurity = [{ mentorToken: [] }, { mentorCookie: [] }]
for (const path of ['me', 'filming', 'pages', 'csrf'])
  add('get', '/mentor/' + path, undefined, {
    security: mentorSecurity,
    paginated: path === 'pages',
    description:
      'Own-team projection only. Cookie mutation requires exact Origin and X-CSRF-Token. No Judging observations or arbitrary team selector.',
  })
add('post', '/mentor/pages/:id/respond', c.responseInput, {
  security: mentorSecurity,
  idempotent: true,
  receipt: true,
})
add('put', '/mentor/device', c.deviceInput, { security: mentorSecurity })
add('delete', '/mentor/device', z.object({ installationId: c.uuid }).strict(), {
  security: mentorSecurity,
})
add('post', '/mentor/logout', z.object({}).strict(), { security: mentorSecurity })
writeFileSync(
  'docs/firstglobal-ops/openapi.json',
  JSON.stringify(
    {
      openapi: '3.0.3',
      info: {
        title: 'FGC Operations REST API',
        version: '1.0.0',
        description:
          'Generated from implemented route catalog and request schemas. Response envelope and receipts are specified here; concrete read DTOs remain in @fgc/contracts. Internal worker/health endpoints are not public business API.',
      },
      servers: [{ url: '/api/v1' }],
      paths,
      components: {
        schemas: { Receipt: receipt },
        securitySchemes: {
          staff: { type: 'http', scheme: 'bearer', bearerFormat: 'Supabase JWT' },
          mentorToken: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Mentor <opaque token>; never combine with mentor cookie.',
          },
          mentorCookie: { type: 'apiKey', in: 'cookie', name: '__Host-fgc_mentor' },
          refreshCookie: { type: 'apiKey', in: 'cookie', name: '__Host-fgc_refresh' },
        },
      },
    },
    null,
    2,
  ) + '\n',
)
