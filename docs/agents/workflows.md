# Common Workflows

## Add a New API Endpoint

1. **Contract**: Define the new route in `packages/api-contract/src/`. Add it to the resource file (e.g., `games.ts`) and ensure it's exported via the main `contract` in `index.ts`.
2. **Service**: Add or update service functions in `apps/api/src/[resource]/[resource].service.ts` to handle the business logic.
3. **Router**: Implement the contract in `apps/api/src/[resource]/[resource].router.ts` using `@Implement` and `implement().handler()`.
4. **Test**: Since oRPC provides type-safety, verify the implementation via the web app's typed client or use oRPC's OpenAPI integration if enabled.

## Add a New Web Page

1. Create the page in `apps/web/app/*/page.tsx`.
2. **API Access**: Use the oRPC client from `apps/web/lib/orpc.ts`. For client components, use the React Query hooks provided by oRPC; for server components, use the server-side client.
3. Keep components in `apps/web/components/` presentation-only.
4. Use App Router conventions (server components by default).
5. Use `SERVER_URL` for server-side calls.
