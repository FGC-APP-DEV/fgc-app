import * as c from '@fgc/contracts';
import type { ZodTypeAny } from 'zod';

export interface CommandRoute { method: 'post' | 'put' | 'patch' | 'delete'; path: string; rpc: string; schema: ZodTypeAny; capability: 'admin' | 'judging' | 'advisor' | 'filming' | 'schedule'; params?: Record<string, string> }
export const commands: CommandRoute[] = [
  { method: 'patch', path: '/me/profile', rpc: 'profile_update', schema: c.profileInput, capability: 'schedule' },
  { method: 'post', path: '/judging/panels', rpc: 'panel_create', schema: c.panelInput, capability: 'advisor' },
  { method: 'post', path: '/judging/panels/:id/leader', rpc: 'panel_leader', schema: c.leaderInput, capability: 'advisor', params: { id: 'panelId' } },
  { method: 'post', path: '/judging/panels/:id/members', rpc: 'panel_members', schema: c.membersInput, capability: 'advisor', params: { id: 'panelId' } },
  { method: 'post', path: '/judging/panels/:id/teams', rpc: 'panel_team', schema: c.assignTeamInput, capability: 'advisor', params: { id: 'panelId' } },
  { method: 'delete', path: '/judging/panels/:id', rpc: 'panel_delete', schema: c.versionInput, capability: 'advisor', params: { id: 'panelId' } },
  { method: 'post', path: '/judging/judges/:id/transfer', rpc: 'judge_transfer', schema: c.transferInput, capability: 'advisor', params: { id: 'judgeId' } },
  { method: 'post', path: '/judging/teams/:id/transfer', rpc: 'team_transfer', schema: c.transferInput, capability: 'advisor', params: { id: 'teamId' } },
  { method: 'post', path: '/judging/participations', rpc: 'participation_add', schema: c.participationInput, capability: 'advisor' },
  { method: 'delete', path: '/judging/participations/:id', rpc: 'participation_remove', schema: c.versionInput, capability: 'advisor', params: { id: 'teamId' } },
  { method: 'put', path: '/judging/teams/:id/observation', rpc: 'observation_put', schema: c.observationInput, capability: 'judging', params: { id: 'teamId' } },
  { method: 'delete', path: '/judging/teams/:id/observation', rpc: 'observation_delete', schema: c.observationDeleteInput, capability: 'judging', params: { id: 'teamId' } },
  { method: 'post', path: '/judging/teams/:id/complete', rpc: 'evaluation_complete', schema: c.completeInput, capability: 'judging', params: { id: 'teamId' } },
  { method: 'post', path: '/judging/teams/:id/reopen', rpc: 'evaluation_reopen', schema: c.versionInput, capability: 'judging', params: { id: 'teamId' } },
  { method: 'post', path: '/judging/teams/:id/withdraw', rpc: 'team_withdraw', schema: c.reasonInput, capability: 'advisor', params: { id: 'teamId' } },
  { method: 'post', path: '/judging/teams/:id/reactivate', rpc: 'team_reactivate', schema: c.versionInput, capability: 'advisor', params: { id: 'teamId' } },
  { method: 'put', path: '/judging/teams/:id/flags/:type', rpc: 'flag_put', schema: c.flagInput, capability: 'advisor', params: { id: 'teamId', type: 'type' } },
  { method: 'delete', path: '/judging/teams/:id/flags/:type', rpc: 'flag_delete', schema: c.versionInput, capability: 'advisor', params: { id: 'teamId', type: 'type' } },
  { method: 'post', path: '/judging/closure-intents', rpc: 'closure_intent', schema: c.closureIntentInput, capability: 'advisor' },
  { method: 'post', path: '/judging/close', rpc: 'judging_close', schema: c.closeInput, capability: 'advisor' },
  { method: 'post', path: '/filming/categories', rpc: 'category_create', schema: c.categoryInput, capability: 'filming' },
  { method: 'post', path: '/filming/items', rpc: 'item_create', schema: c.itemInput, capability: 'filming' },
  { method: 'patch', path: '/filming/items/:id', rpc: 'item_toggle', schema: c.toggleItemInput, capability: 'filming', params: { id: 'itemId' } },
  { method: 'delete', path: '/filming/items/:id', rpc: 'item_delete', schema: c.versionInput, capability: 'filming', params: { id: 'itemId' } },
  { method: 'put', path: '/filming/teams/:id/shots/:templateId', rpc: 'shot_mark', schema: c.shotInput, capability: 'filming', params: { id: 'teamId', templateId: 'templateId' } },
  { method: 'delete', path: '/filming/teams/:id/shots/:templateId', rpc: 'shot_clear', schema: c.versionInput, capability: 'filming', params: { id: 'teamId', templateId: 'templateId' } },
  { method: 'post', path: '/pages', rpc: 'page_create', schema: c.pageInput, capability: 'schedule' },
];
export const reads: { path: string; rpc: string; capability: CommandRoute['capability']; paginated?: boolean }[] = [
  { path: '/me', rpc: 'me', capability: 'schedule' }, { path: '/teams', rpc: 'teams_list', capability: 'schedule', paginated: true },
  { path: '/admin/users', rpc: 'users_list', capability: 'admin', paginated: true }, { path: '/admin/mentor-codes', rpc: 'mentor_codes_list', capability: 'admin' },
  { path: '/judging/judges', rpc: 'judges_list', capability: 'advisor', paginated: true }, { path: '/judging/cycle', rpc: 'judging_cycle', capability: 'judging' },
  { path: '/judging/panels', rpc: 'panels_list', capability: 'judging', paginated: true }, { path: '/judging/teams', rpc: 'participations_list', capability: 'judging', paginated: true },
  { path: '/judging/teams/:id/observations', rpc: 'observations_list', capability: 'judging' }, { path: '/judging/audit', rpc: 'judging_audit', capability: 'advisor' },
  { path: '/filming/tracker', rpc: 'tracker', capability: 'filming', paginated: true }, { path: '/filming/categories', rpc: 'categories_list', capability: 'filming', paginated: true },
  { path: '/filming/items', rpc: 'items_list', capability: 'filming', paginated: true }, { path: '/pages', rpc: 'pages_list', capability: 'schedule', paginated: true }, { path: '/schedule', rpc: 'schedule', capability: 'schedule' },
];
