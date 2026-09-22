const express = require('express');
const path = require('node:path');
const app = express();
app.use(express.static(path.resolve(__dirname, '../dist/apps/fgc-web')));
app.get('/health/e2e', (_, res) => res.json({ fixture: true }));
app.listen(3000, '127.0.0.1');
