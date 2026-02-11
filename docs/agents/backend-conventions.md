# Backend Conventions (apps/api)

## Separation of Concerns (Critical)

All backend code must separate contracts, routers, services, config, and utils.

### Structure

```
packages/api-contract/src/
├── index.ts          # Main contract entry point
├── schema.ts         # Zod schemas and DB types
└── [resource].ts     # Resource-specific oRPC routes

apps/api/src/
├── app.module.ts     # Root module with oRPC setup
├── config/           # Environment/config
├── utils/            # Pure helpers
├── [resource]/       # NestJS modules per resource
│   ├── [resource].module.ts
│   ├── [resource].router.ts   # oRPC implementation
│   └── [resource].service.ts  # Business logic
└── db/               # Database schema/connection
```

### Rules

- **Contract First**: Define API endpoints in `packages/api-contract` using oRPC and Zod before implementation.
- **Routers**: Use `@Implement(contract.path)` and `implement(contract.path).handler()` in NestJS controllers (routers). Routers should only handle input/output mapping and call services.
- **Services**: Contain business logic and DB/external integrations. They are injected into routers.
- **Validation**: Use Zod in the contract for automated input/output validation.
- **Config**: Use NestJS `ConfigService` or the typed config exports in `src/config/`.
- **Utils**: Pure and side-effect free helpers.
