import dotenv from 'dotenv';
import { configuredApi } from '@fgc/server';
dotenv.config({ path: '.env.local' });
const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const app = configuredApi(process.env);
const server = app.listen(port, () => console.log(`FGC REST API listening on port ${port}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close());
