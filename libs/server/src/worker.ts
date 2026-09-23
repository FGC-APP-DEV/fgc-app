import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import type { RpcClient } from './http';

export function createWorkerRouter(service: RpcClient, secret: string, fetcher: typeof fetch = fetch) {
  if (secret.length < 32) throw new Error('A worker secret of at least 32 characters is required.');
  const router = Router();
  router.post('/tick', async (req, res) => {
    const actual = req.get('Authorization') ?? ''; const expected = `Bearer ${secret}`;
    if (Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) { res.status(403).json({ error: 'FORBIDDEN' }); return; }
    try {
      await service.rpc('purge_due');
      await service.rpc('staff_auth_cleanup');
      const ids = await service.rpc('delivery_claim', { p_limit: 10 }) as string[];
      await Promise.all(ids.map(async id => {
        const delivery = await service.rpc('delivery_authorize', { p_id: id }) as { deliveryId: string; attempt: number; token: string; title: string; body: string } | null;
        if (!delivery) return;
        let accepted = false; let invalid = false;
        try {
          const response = await fetcher('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, signal: AbortSignal.timeout(10000), body: JSON.stringify({ to: delivery.token, title: 'FGC', body: 'You have a new message.', sound: 'default', data: { deliveryId: delivery.deliveryId }, channelId: 'pager' }) });
          const payload = await response.json() as { data?: { status?: string; details?: { error?: string } } };
          accepted = response.ok && payload.data?.status === 'ok'; invalid = payload.data?.details?.error === 'DeviceNotRegistered';
        } catch { /* Unknown provider outcome is retried with the same delivery ID. */ }
        await service.rpc('delivery_finish', { p_id: id, p_attempt: delivery.attempt, p_accepted: accepted, p_invalid_token: invalid });
      }));
      res.json({ status: 'processed' });
    } catch { res.status(503).json({ error: 'DEPENDENCY_UNAVAILABLE' }); }
  });
  return router;
}
