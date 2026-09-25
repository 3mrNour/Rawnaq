# Rawnaq SaaS - Laundry Management System

This is the monorepo for the Rawnaq SaaS project. It is structured into two decoupled top-level folders:

- `/backend`: Node.js, Express, TypeScript, MongoDB.
- `/frontend`: React, TypeScript, Vite.

## Running Locally

To run both applications concurrently in a single terminal, use the root-level dev script:

```bash
npm install
npm run dev
```

This uses `concurrently` to start the development servers for both `/backend` and `/frontend`.

## Decoupled Architecture Note

Because this is a decoupled setup (not using a monorepo tool like Turborepo or Nx for MVP simplicity), shared types must be manually duplicated between the backend and frontend.

For example, `backend/src/types/rawnaq.types.ts` should be mirrored identically to `frontend/src/types/rawnaq.types.ts` and kept in sync by convention. Look for the header comment `// SYNC: keep identical to backend/src/types/rawnaq.types.ts`.
