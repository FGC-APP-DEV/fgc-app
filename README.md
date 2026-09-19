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

### Mobile: approved Expo adoption, implementation pending

The mobile app will adopt Expo, with Expo Go for compatible UI/business-flow
checks, development builds for native integrations, and signed distribution
builds for final validation. See the [adoption plan and acceptance checks](docs/context/fgc-mvp/expo-desenvolvimento.md)
and [implementation and operational checklist](docs/context/fgc-mvp/pendencias.md).

The commands below describe the current repository. `dev:mobile` still starts
React Native Metro; Expo dependencies and targets are not configured yet.
Native `android/` and `ios/` projects are absent. The adoption must validate the
Expo SDK/React Native/React/web dependency matrix before these workflows are ready.
The linked documents are a versionable snapshot of the canonical workspace
`contexts/` source. See `docs/context/README.snapshot.md` for provenance and verification.

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
- **Mobile native projects missing:** This repository currently ships the JS/TS shell and Metro config only. Follow the approved Expo adoption plan to generate/configure native projects against the selected SDK; do not copy projects from an arbitrary React Native version. Expo Go does not validate remote push or replace signed distribution builds.
