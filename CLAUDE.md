# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev      # watch mode (development)
npm run build          # compile to dist/
npm run start:prod     # run compiled output
npm run lint           # ESLint with auto-fix
npm run test           # unit tests (Jest)
npm run test:e2e       # end-to-end tests
npm run test:cov       # coverage report
```

Run a single test file:
```bash
npx jest src/i18n/i18n.service.spec.ts
```

## Environment

Copy `.env` (not committed) with these variables:

| Variable  | Default          |
|-----------|------------------|
| PORT      | 4000             |
| DB_HOST   | localhost        |
| DB_PORT   | 5432             |
| DB_USER   | postgres         |
| DB_PASS   | —                |
| DB_NAME   | castora          |
| NODE_ENV  | development      |

TypeORM runs with `synchronize: true` in all environments — schema is auto-migrated on startup. This must be set to `false` before production deployment.

## Architecture

NestJS 11 / TypeScript backend. Single feature module today (`I18nModule`); new modules follow the same pattern.

### I18n / Translations

The core purpose of this server is serving internationalised content (Armenian `hy`, Russian `ru`, English `en`, default `hy`, fallback `en`) to a Next.js frontend.

**Flow:**
1. `I18nService.onModuleInit()` loads all rows from the `translations` Postgres table and initialises `i18next` with them as in-memory resource bundles.
2. Every mutating admin endpoint (`POST`, `PUT`, `DELETE`, `POST /bulk`) calls `i18nService.reloadTranslations()` to hot-reload i18next bundles without a server restart.
3. Next.js SSR calls `GET /translations/lang/:lang[?namespace=…]` to receive a flat `{ key: value }` map for its locale.

**Data model** (`TranslationEntity`):
- `key` — dot-notation string, e.g. `nav.home` (unique index)
- `lang` — `'hy' | 'ru' | 'en'`
- `namespace` — optional grouping, e.g. `common`, `auth`, `profile` (defaults to `common` inside i18next)
- `value` — translated string

Bulk upsert (`POST /translations/bulk`) conflicts on `['key', 'lang']`.

### Module conventions

Each feature lives in `src/<feature>/` with:
- `<feature>.module.ts` — imports `TypeOrmModule.forFeature([…])`, exports the service
- `<feature>.controller.ts` — REST handlers
- `<feature>.service.ts` — business logic + DB access
- `entities/<name>.entity.ts` — TypeORM entity
- `dto/create-<name>.dto.ts` / `update-<name>.dto.ts` — class-validator DTOs
- `<feature>.service.spec.ts` / `<feature>.controller.spec.ts` — unit tests

`AppModule` is the root; add new feature modules to its `imports` array and register their entities in the TypeORM `entities` list.
