# M2 backend bootstrap verification

Status: **POSTGRESQL BACKEND DATABASE GATE GREEN** (2026-10-01, macOS). Frontend/end-to-end verification is a separate gate; M4 has not been started.

The backend uses Laravel 13.34.0, Sanctum 4.3.3, Herd PHP 8.4.25 with `pdo_pgsql`/`pgsql`, and Composer 2.10.2. Homebrew is absent. PostgreSQL 18.6 is running on loopback port 5432. Only PostgreSQL major version 18 is used.

## Local PostgreSQL

The running cluster uses `.runtime/postgres-data`, with its executable at `.runtime/postgresql-18.6/bin/postgres`. That runtime directory is ignored by Git. A single-version Postgres.app 2.9.6 / PostgreSQL 18.6 bundle was also installed at `/Applications/Postgres.app`; its CLI tools work with the same cluster. Do not initialize or start a second cluster on port 5432.

Restart the existing cluster when necessary, from the repository root:

```sh
.runtime/postgresql-18.6/bin/pg_ctl -D "$PWD/.runtime/postgres-data" -l "$PWD/.runtime/postgres.log" -o '-p 5432 -h 127.0.0.1' start
.runtime/postgresql-18.6/bin/pg_isready -h 127.0.0.1 -p 5432
```

Stop with `pg_ctl -D "$PWD/.runtime/postgres-data" stop -m fast` using that same binary directory. Startup at macOS login is not configured by this verification pass.

The local application role is `evorail`, owns the application tables, and is not a superuser. The existing `hello` role administers the local cluster. Development database `evorail` and disposable test database `evorail_test` use UTF-8. The existing cluster uses trust authentication for local connections; the example password below is a development value, not a production authentication setup.

Local `backend/.env` matches the existing example:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=evorail
DB_USERNAME=evorail
DB_PASSWORD=evorail
```

`phpunit.xml` now defaults to PostgreSQL and `evorail_test`, while using array sessions/cache and a synchronous queue. The feature-test bootstrap refuses PostgreSQL databases whose names do not end in `_test`, before `RefreshDatabase` runs. A deliberate `DB_DATABASE=evorail` test attempt was rejected and the development seed remained intact. Clear cached configuration before testing. `php artisan --env=testing` alone does not select `evorail_test`; PHPUnit supplies that database setting.

## Verification

```sh
export PATH="/Users/hello/Library/Application Support/Herd/bin:$PATH"
cd /Users/hello/Documents/Codex/2026-10-01/new-chat/evorail/backend
php artisan config:clear --no-interaction
composer validate
php artisan migrate:status --no-interaction
php artisan migrate --no-interaction
php artisan test
EVORAIL_DEMO_SEED=true php artisan db:seed --no-interaction
```

Observed results: Composer validation passes; all 14 migrations are applied; a second migration run reports nothing to migrate. PostgreSQL feature tests rebuild the isolated test database successfully, exercising a clean migration path. The complete checkout suite passes **31 tests / 138 assertions**, including **5 runtime regression tests / 38 assertions**. Counts include parallel agents' tests present at verification time. Pint passes.

Native schema inspection confirms UUID identifiers and foreign keys, JSON metadata and idempotency response fields, date issue dates, timestamps, and unique constraints for memberships, project/document numbers, document/revision codes and orders, and user/route/idempotency keys. `documents.current_revision_id` references `document_revisions.id` with `ON DELETE SET NULL`; a regression test confirms missing revision IDs are rejected.

Redis and MinIO are not required for the database gate: database-backed sessions/cache work in HTTP verification; files remain on the existing private local disk.

## Development topology

The local-only, opt-in seed is repeatable. Running it twice produces the same topology:

| Login | Membership |
| --- | --- |
| `user-a@example.test` | Line A (`LNA`), engineer |
| `user-b@example.test` | Line B (`LNB`), engineer |
| `admin@example.test` | Both projects, admin |

All three demo passwords are `password`. There are 3 users, 2 organizations, 2 projects, 4 memberships, 3 documents, 6 stored files, and 6 revisions. Line A has 2 documents; Line B has 1. Every document has revisions A and B, with A retained as the current revision. Demo PDF files are small test placeholders rather than complete drawing PDFs.

## HTTP verification

The existing Herd-PHP HTTP process at `http://127.0.0.1:8002` was reused because the previously identified Herd Nginx `.test` issue is outside the database gate. No additional HTTP server was started.

Real cookie sessions obtained `/sanctum/csrf-cookie`, logged in with the decoded `X-XSRF-TOKEN`, and verified `/api/me`, `/api/projects`, `/api/projects/{project}`, `/api/projects/{project}/documents`, `/api/documents/{document}`, `/api/documents/{document}/revisions`, and `/api/revisions/{revision}`. Authorized responses were 200. A/B project lists contained one project each; Admin's contained both. Protected preview/download returned 200 for authorized users. Both directions of cross-project resource/file access returned the established 403. Logout returned 200 and subsequent `/api/me` returned 401.

No frontend contract changes are required. The existing JSON envelopes, pagination fields, resource fields, and authorization status codes remain intact.
