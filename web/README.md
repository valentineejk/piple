# Piple — Web

Admin/operations frontend for the Piple payroll backend. Built with **React 19 + Vite + TypeScript**, **Tailwind CSS v4**, and **shadcn/ui** components.

## Stack

- **UI**: shadcn/ui (Radix primitives + Tailwind v4), lucide-react icons, sonner toasts
- **Routing**: react-router-dom (role-gated protected routes)
- **Data**: TanStack Query + axios client with automatic access-token refresh
- **Forms**: react-hook-form + zod

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` → `http://localhost:8080` (the Go backend). Start the
backend separately so API calls resolve.

To point at a different API host, set `VITE_API_BASE_URL` (e.g. in a `.env` file):

```
VITE_API_BASE_URL=https://api.example.com/api/v1
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck + production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build

## What's integrated

The app wires up every endpoint the backend currently exposes in `main.go`:

| Area      | Endpoints                                                                       | Screen                    |
| --------- | ------------------------------------------------------------------------------- | ------------------------- |
| Auth      | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/register`           | Login, session mgmt       |
| Users     | `GET/POST /users`, `GET /users/:id`, `GET /users/me`, `PATCH/DELETE /users/:id` | Users, Profile            |
| Employees | `POST /employees`, `PATCH /employees/:id`, `DELETE /employees/:id`              | Employees                 |
| System    | `GET /health`                                                                   | Sidebar status, Dashboard |

The **Payroll** and **Wallet** screens are stubs: those endpoints are specified in
`backend/endpoints.md` but not yet registered in the API router, so the UI lists the
planned endpoints and is ready to wire them up once they land.

> Note: the backend exposes no list/GET endpoint for employees, only create/update/delete.
> The Employees screen therefore manages records created or edited during the current session.

## Structure

```
src/
  components/ui/      shadcn/ui primitives
  components/         shared app components (layout, page-header, badges, states)
  features/           auth context + user/employee dialogs
  lib/                api client, services, query hooks, formatters
  pages/              route screens
  types/api.ts        TypeScript mirror of the Go JSON contracts
```
