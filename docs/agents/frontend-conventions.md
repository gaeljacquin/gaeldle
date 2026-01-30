# Frontend Conventions (apps/web)

## Separation of Concerns (Critical)

All frontend code must separate business logic from components and views.

### Structure

```
apps/web/
├── app/              # Pages (views)
├── components/       # Presentation-only components
├── lib/              # Business logic
│   ├── services/     # API calls and external integrations
│   ├── hooks/        # Stateful/custom logic
│   ├── utils/        # Pure utilities and transforms
│   └── types/        # TypeScript types
```

### Rules

- Components in `components/` are presentational only and receive data via props.
- No `fetch`, `axios`, or data access inside components.
- API calls live in `lib/services/`.
- Complex stateful logic belongs in `lib/hooks/`.
- Pages in `app/` compose components and call services/hooks as appropriate.
