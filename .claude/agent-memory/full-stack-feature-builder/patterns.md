# Gaeldle Patterns

## OpenAPI Date Serialization (critical)

`openapi-fetch` serializes `Date` fields as ISO strings over the wire.
Frontend prop types for data coming from `apiClient` must use `Date | string` (or just `string`)
for timestamp fields — NOT `Date`.

## Drizzle Migrations

Run from `apps/api` dir:

- Generate: `pnpm drizzle-kit generate`
- Apply: `pnpm drizzle-kit migrate`
  Schema source: `apps/api/src/db/schema/index.ts`

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

NestJS SSE controllers use the path prefix `@Controller('api/games')`.

## Checkbox in Views

Use Base UI `Checkbox` from `@workspace/ui/checkbox` with `onCheckedChange`.
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
  return () => {
    cancelled = true;
  };
}, [user]);
```
