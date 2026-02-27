# Common Workflows

## Add a New API Endpoint

1. **Contract**: Define the new route in `packages/api-contract/src/`. Add it to the resource file (e.g., `games.ts`) and ensure it's exported via the main `contract` in `index.ts`.
2. **Service**: Add or update service functions in `apps/api/src/[resource]/[resource].service.ts` to handle the business logic.
3. **Router**: Implement the contract in `apps/api/src/[resource]/[resource].router.ts` using `@Implement` and `implement().handler()`.
4. **Test**: Since oRPC provides type-safety, verify the implementation via the web app's typed client or use oRPC's OpenAPI integration if enabled.

## Add a New Web Page

1. Create the page in `apps/web/app/*/page.tsx`.
2. **Specialized Skills**: Refer to `vercel-react-best-practices` and `vercel-composition-patterns` to ensure high-quality component implementation.
3. **API Access**: Use the oRPC client from `apps/web/lib/orpc.ts`. For client components, use the React Query hooks provided by oRPC; for server components, use the server-side client.
3. Keep components in `apps/web/components/` presentation-only.
4. Use App Router conventions (server components by default).
5. Use `SERVER_URL` for server-side calls.

## Add a New Dashboard Admin Page

Dashboard pages that perform write operations (add, replace, delete) follow a consistent pattern:

1. **Page file**: Create `apps/web/app/dashboard/<feature>/page.tsx`. It should be minimal — just import and render the view component and add a `<title>`.
2. **View file**: Create `apps/web/views/<feature>.tsx`. This is where all state and logic live. Gate the page with `useUser({ or: 'redirect' })`.
3. **Header**: Use `<DashboardPageHeader title="..." description="..." icon={...} />` from `apps/web/components/dashboard-header.tsx` inside the sticky `border-b bg-card/50 backdrop-blur-sm` header wrapper.
4. **Validation hook** (if input must be validated before committing): Create `apps/web/lib/hooks/use-<feature>-validation.ts`. Use `useDebounce` (600 ms) before calling the service function. Use TanStack Query with a descriptive query key. Set `staleTime: 30_000`.
5. **Row component**: If the form is a variable-length list of inputs, create one row component in `apps/web/components/<feature>-row.tsx`. Each row gets its own hook invocation (wrapped in a small intermediate component) so React's rules of hooks are not violated.
6. **Service functions**: Add the API call wrappers to `apps/web/lib/services/game.service.ts`. Validation calls go to NestJS via `orpcClient`.
7. **Contract**: Add the oRPC route to `packages/api-contract/src/games.ts`, implement it in `apps/api/src/games/games.router.ts`, and add the business logic to `apps/api/src/games/games.service.ts`.
8. **Sidebar**: Add a `<SidebarLink>` entry in `apps/web/components/sidebar.tsx` with a Tabler icon and a label.
9. **Shared constants**: If the feature needs a max-rows limit or other shareable constant, add it to `packages/constants/src/index.ts` and import from `@gaeldle/constants` in both web and API code.

## Validate-then-Commit Pattern

The Add Game and Replace Game features both use this pattern:

- **Validate**: As the user types, a debounced hook fires a read-only validation endpoint (e.g., `POST /games/add/validate-one` or `POST /games/replace-game/validate-one`). The hook returns a typed validation state object with a `canAdd` / `canApply` boolean.
- **Gate submission**: The submit button is disabled while any row is loading, invalid, or a duplicate.
- **Commit**: On submit, a mutation fires the actual write endpoint (e.g., `orpcClient.games.sync` for add, `orpcClient.games.replaceGames` for replace). Results are displayed in an inline results table.
- **Reset**: After viewing results, the user can clear the form to add/replace more games.
