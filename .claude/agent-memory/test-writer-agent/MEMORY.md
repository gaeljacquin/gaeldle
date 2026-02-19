# Test Writer Agent Memory

## Project: Gaeldle Monorepo

### Testing Setup
- **Test Runner**: `bun test` (configured in `bunfig.toml`)
- **Test Conventions**: Follow backend tests pattern using Jest-compatible mocks with Bun
- **Web app test script**: `bun test:coverage` in `/apps/web/package.json`
- **Backend uses**: NestJS with Jest (seen in `apps/api/src/games/games.service.spec.ts`)

### Frontend Utilities Coverage (100% achieved)
Tests created for `/apps/web/lib/` utilities:

1. **lib/utils.ts** - `cn()` utility (clsx + tailwind-merge)
   - Test file: `/apps/web/lib/utils.test.ts`
   - Coverage: 100%
   - 11 tests covering: class combination, merging, conditionals, undefined/null handling

2. **lib/utils/pixelate.ts** - Image pixelation functions
   - Test file: `/apps/web/lib/utils/pixelate.test.ts`
   - Coverage: 100%
   - 27 tests covering: pixelateImage() with mocked canvas API, getPixelSizeForAttempt() calculations

3. **lib/game-mode.ts** - Game mode utilities
   - Test file: `/apps/web/lib/game-mode.test.ts`
   - Coverage: 100%
   - 35 tests covering: gameModes array validation, getGameModeBySlug() function, interface conformance

4. **lib/app-info.ts** - App metadata
   - Test file: `/apps/web/lib/app-info.test.ts`
   - Coverage: 100%
   - 14 tests covering: all properties, structure, SEO requirements

5. **lib/constants.ts** - Constants
   - Test file: `/apps/web/lib/constants.test.ts`
   - Coverage: 100%
   - 12 tests covering: placeholder images, R2 URLs, env variable usage

### Overall Coverage
- **Total Tests**: 93 passing tests
- **Total Assertions**: 227 expect() calls
- **Line Coverage**: 100.00%
- **Function Coverage**: 100.00%

### Testing Patterns Used
- Pure function unit tests (no mocking needed for pure utilities)
- Mock factory pattern for complex objects (canvas API mocking)
- Edge case coverage: empty inputs, null/undefined, boundary conditions
- Type validation for complex objects (TablerIcon components, GameMode objects)

### Not Covered (Out of Scope)
- Hooks (use-debounce, use-mobile, use-cover-art-game, etc.) - require React Testing Library
- Services (game.service.ts) - require dependency injection and API mocking
- Stores (timeline-store.ts) - require Zustand store testing
- orpc.ts - complex integration with auth/fetch, better as integration test

These should be addressed in separate test sessions with appropriate testing libraries.
