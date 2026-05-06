# Gaeldle Patterns

## oRPC Date Serialization (critical)

oRPC with the OpenAPI fetch client serializes `Date` fields as ISO strings over the wire.
Frontend prop types for data coming from `orpcClient` must use `Date | string` (or just `string`)
for timestamp fields — NOT `Date`. If you write `Date` you'll get a TS type error at build time.

Example:
```ts
// WRONG - causes build error:
startedAt: Date | null;
// CORRECT - matches what oRPC actually returns on the client:
startedAt: Date | string | null;
```

## SSE Authentication Pattern

For SSE endpoints that need auth (can't send custom headers with EventSource):
- Pass the Stack Auth JWT as `?token=<accessToken>` query param
- Controller verifies using the same JWKS as StackAuthGuard (copy the verifyToken logic)
- Get token on frontend: `await user.getAccessToken()` from `useUser({ or: 'redirect' })`

## Drizzle Migrations

Run from `apps/api` dir:
- Generate: `pnpm drizzle-kit generate`
- Apply: `pnpm drizzle-kit migrate`
Schema source: `packages/api-contract/src/schema.ts`

## Background Jobs (fire-and-forget) in NestJS

For async background processing, launch with `.catch()` from service method:
```ts
this.runGenerationLoop(jobId, ...).catch((err) => console.error(err));
```
No separate queue needed for single-job-at-a-time pattern. Concurrent job rejection:
check for `status IN ('pending', 'running')` before inserting.

## BulkImageJobStore Pattern

- Injectable EventEmitter store keyed by `jobId`
- SSE controller subscribes via `fromEvent<BulkJobEvent>(emitter, 'event')`
- Service emits via `bulkImageJobStore.emit(jobId, event)`
- Combine progress + termination as rxjs Observable in the SSE @Sse() method

## NestJS @Sse() Controller Path

NestJS controllers registered alongside oRPC routers must use the FULL path prefix
including `/api/` since the `@Controller()` decorator on the SSE controller uses
`@Controller('api/games')` to match the oRPC contract path prefix.

## Checkbox in Views

Use Base UI `Checkbox` from `@/components/ui/checkbox` with `onCheckedChange`.
Checked state value is `boolean | 'indeterminate'`, guard with `checked === true`.

## Access Token in View for SSE

```ts
const user = useUser({ or: 'redirect' });
const [accessToken, setAccessToken] = useState<string | null>(null);
useEffect(() => {
  let cancelled = false;
  user.getAccessToken().then((token) => {
    if (!cancelled && token) setAccessToken(token);
  });
  return () => { cancelled = true; };
}, [user]);
```
