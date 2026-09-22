import { errorStatus, type ErrorCode } from '@fgc/contracts';
export class DomainError extends Error {
  constructor(public readonly code: ErrorCode, message?: string) { super(message ?? ({ FORBIDDEN: 'You do not have access to this operation.', UNAUTHENTICATED: 'Sign in again to continue.', VERSION_CONFLICT: 'This record changed. Review the latest version before saving.', NOT_FOUND: 'This record is not available.', VALIDATION_ERROR: 'Check the submitted fields.', STATE_CONFLICT: 'This operation is not allowed in the current state.' } as Partial<Record<ErrorCode, string>>)[code] ?? 'The operation could not be completed.'); }
}
export function fromRpc(error: { message?: string; code?: string }): DomainError {
  const code = Object.keys(errorStatus).find(c => error.message === c || error.message?.startsWith(c + ':')) as ErrorCode | undefined;
  return new DomainError(code ?? (error.code === '23505' ? 'DUPLICATE' : 'DEPENDENCY_UNAVAILABLE'));
}
