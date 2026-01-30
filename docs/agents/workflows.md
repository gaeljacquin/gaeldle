# Common Workflows

## Add a New API Endpoint

1. Add or update service functions in `apps/api/src/services/`.
2. Add or update a route file in `apps/api/src/routes/` (e.g., `users.routes.ts`).
3. Mount the routes in `apps/api/src/index.ts` with `.use()`.
4. Test via `curl http://localhost:8080/your-endpoint`.
5. Verify CORS requirements if the web app will call the endpoint.

## Add a New Web Page

1. Create the page in `apps/web/app/*/page.tsx`.
2. Add API calls in `apps/web/lib/services/`.
3. Add stateful logic in `apps/web/lib/hooks/`.
4. Keep components in `apps/web/components/` presentation-only.
5. Use App Router conventions (server components by default).
6. Use `NEXT_PUBLIC_SERVER_URL` for client-side calls and `SERVER_URL` for server-side calls.
