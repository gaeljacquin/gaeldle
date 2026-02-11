# Backend Conventions (apps/api)

## Separation of Concerns (Critical)

All backend code must separate routes, services, config, and utils.

### Structure

```
apps/api/src/
├── index.ts          # App setup and route mounting only
├── config/           # Environment/config
├── utils/            # Pure helpers
├── services/         # Business logic + DB/external calls
├── routes/           # HTTP endpoints by resource
├── lib/              # Existing infrastructure (auth, middleware)
└── db/               # Database schema/connection
```

### Rules

- Route handlers validate inputs and call services; no DB or external API calls in routes.
- Services contain business logic and DB/external integrations.
- Config is for env parsing and typed config exports only.
- Utils are pure and side-effect free.
- Use NestJS controllers and services to organize the code.
