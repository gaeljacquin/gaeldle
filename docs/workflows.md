# Common Workflows

## Add a New API Endpoint

1. **Controller**: Define the endpoint in `apps/api/src/[resource]/[resource].controller.ts` (or `router.ts`) using NestJS decorators (`@Controller`, `@Post`, `@Get`, `@ApiTags`, `@ApiOperation`, `@ApiBody`).
2. **DTO**: Create DTOs in `apps/api/src/[resource]/dto/` with `@ApiProperty` / `@ApiPropertyOptional` annotations.
3. **Service**: Implement business logic in `apps/api/src/[resource]/[resource].service.ts`.
4. **Codegen**: Run `pnpm codegen` to update `apps/api/openapi.json` and regenerate TypeScript types in `packages/api-client/src/schema.d.ts`. Commit both files.
5. **Client**: Call `apiClient.POST` or `apiClient.GET` from `@workspace/api-client` inside `apps/web/lib/services/`.

## Add a New Web Page

1. Create the page in `apps/web/app/*/page.tsx`.
2. **Specialized Skills**: Refer to `vercel-react-best-practices` and `vercel-composition-patterns` to ensure high-quality component implementation.
3. **API Access**: Use `apiClient` from `@workspace/api-client` exported via `apps/web/lib/api-client.ts`.
4. Keep components in `apps/web/components/` presentation-only.
5. Use App Router conventions (server components by default).
6. Use `SERVER_URL` for server-side calls.

## Add a New Dashboard Admin Page

Dashboard pages that perform write operations (add, replace, delete) follow a consistent pattern:

1. **Page file**: Create `apps/web/app/dashboard/<feature>/page.tsx`. It should be minimal — just import and render the view component and add a `<title>`.
2. **View file**: Create `apps/web/views/<feature>.tsx`. This is where all state and logic live. Gate the page with `useUser({ or: 'redirect' })`.
3. **Header**: Use `<DashboardPageHeader title="..." description="..." icon={...} />` from `apps/web/components/dashboard-header.tsx` inside the sticky `border-b bg-card/50 backdrop-blur-sm` header wrapper.
4. **Validation hook** (if input must be validated before committing): Create `apps/web/lib/hooks/use-<feature>-validation.ts`. Use `useDebounce` (600 ms) before calling the service function. Use TanStack Query with a descriptive query key. Set `staleTime: 30_000`.
5. **Row/Entry component**: If the form is a variable-length list of inputs, create a component in `apps/web/components/<feature>-row.tsx` or `<feature>-entry.tsx` (e.g., `igdb-id-add-entry.tsx`). Each row/entry gets its own hook invocation (wrapped in a small intermediate component) so React's rules of hooks are not violated.
6. **Service functions**: Add the API call wrappers to `apps/web/lib/services/game.service.ts`. Validation calls go to NestJS via `apiClient`.
7. **Controller**: Add the NestJS route and DTO in `apps/api/src/games/`, implement business logic in `apps/api/src/games/games.service.ts`, and run `pnpm codegen`.
8. **Utilities hub**: Add a `MenuCard` entry in `apps/web/views/utilities.tsx` linking to the new page. The sidebar exposes a single **Utilities** link (`/dashboard/utilities`, icon `IconTools`) that routes to this hub — do not add individual `<SidebarLink>` entries for each admin tool page.
9. **Shared constants**: If the feature needs a max-rows limit or other shareable constant, add it to `packages/constants/src/index.ts` and import from `@workspace/constants` in both web and API code.

## Validate-then-Commit Pattern

The Add Game and Replace Game features both use this pattern:

- **Validate**: As the user types, a debounced hook fires a read-only validation endpoint (e.g., `POST /api/games/add/validate-one` or `POST /api/games/replace-game/validate-one`). The hook returns a typed validation state object with a `canAdd` / `canApply` boolean.
- **Gate submission**: The submit button is disabled while any row or entry is loading, invalid, or a duplicate.
- **Commit**: On submit, a mutation fires the actual write endpoint (e.g., `apiClient.POST('/api/games/sync', { body: ... })`). Results are displayed in an inline results table.
- **Reset**: After viewing results, the user can clear the form to add/replace more games.
