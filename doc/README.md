# Solar Management Admin Panel — documentation

This folder holds the **product and build specifications** for a static prototype of the Solar Management Admin Panel (no backend; `localStorage` only).

## Files

| File | Description |
|------|-------------|
| [01-build-prompt-part-1.md](01-build-prompt-part-1.md) | Main Cursor/build prompt: stack, navigation, roles, entities, business rules, MVP pages, seed data targets, styling, testing checklist. |
| [02-specification-part-2.md](02-specification-part-2.md) | Extended spec: 100+ screens, 60+ modals, interactions, TypeScript collections, helpers, extra business logic. |

## Stack (from spec)

- React (functional components, hooks) + TypeScript (strict)
- Tailwind CSS
- React Router
- Data: `localStorage` with key prefix `solar_` (e.g. `solar_users`, `solar_enquiries`)

## Project status

Implementation in this repo may not exist yet; these documents are the source of truth for building the app.
