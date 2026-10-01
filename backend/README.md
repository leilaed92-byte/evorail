# EvoRail backend

Canonical Laravel backend for EvoRail M2/M3. The selected runtime is Laravel 13.34.0 on PHP 8.4.25 and Composer 2.10.2 from Laravel Herd.

```sh
export PATH="/Users/hello/Library/Application Support/Herd/bin:$PATH"
composer install
php artisan migrate
php artisan test
php artisan serve --host=127.0.0.1 --port=8002
```

The checked-in `.env.example` targets PostgreSQL and MinIO. This Mac currently has neither PostgreSQL nor Docker, so local verification uses an ignored SQLite file at `database/evorail.sqlite`. Demo seed data is opt-in:

```sh
EVORAIL_DEMO_SEED=true php artisan db:seed
```

Do not use the generic project at `/Users/hello/Herd/Evorail` as the EvoRail backend. See the repository's `docs/BACKEND_ARCHITECTURE.md` and `docs/API-CONTRACTS.md` for the implemented contract and known runtime gaps.
