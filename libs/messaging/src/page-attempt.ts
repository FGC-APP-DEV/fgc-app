import type { PageSource } from '@fgc/contracts';

export function createPageAttempt(input: { teamId: string; source: PageSource; message: string; minutes: number }, key: string, now = Date.now()) {
  return { key, body: { teamId: input.teamId, sourceArea: input.source, message: input.message,
    ...(input.minutes ? { scheduledFor: new Date(now + input.minutes * 60000).toISOString() } : {}) } };
}
