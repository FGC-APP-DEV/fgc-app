# FGC — Coordination & Judging (Nx Monorepo)

Nx workspace with **fgc-web** (React + react-native-web), **fgc-api** (Express + Apollo Server), **fgc-mobile** (React Native), and shared libraries (**database**, **graphql**, **shared**, **ui**, **auth**, **judging**).

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run docker:up
npm run db:push
npm run db:seed
```

Demo login (GraphQL `login`): use any seeded user email, e.g. `sarah.chen@fgc.local` (no password required in dev).

## Development

```bash
# API (http://localhost:4000)
npm run dev:api

# Web (http://localhost:3000)
npm run dev:web

# Mobile Metro
npm run dev:mobile
```

## Legacy prototype

The original single-file prototype remains at [`fgc-judges-app.jsx`](./fgc-judges-app.jsx) for reference.

## Troubleshooting

- **`NX Could not find Nx modules` / incomplete `node_modules/nx`:** Close editors/terminals locking files, delete `node_modules` and `package-lock.json`, then run `npm install` again from this folder.
- **Windows `EPERM` during `npm install`:** Often antivirus or another Node process is holding `node_modules`; retry after a reboot or exclude the project folder from real-time scanning.
- **React Native:** `fgc-mobile` expects a standard RN native project (`android/` / `ios/`). If those folders are missing, generate them with `npx @react-native-community/cli init` in a temp folder and copy native projects, or run `npx react-native init` and merge sources — this repo ships the JS/TS shell and Metro config only.
