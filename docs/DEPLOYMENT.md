# macOS development and deployment status

The host is Apple Silicon (`arm64`). The canonical backend is `backend/` and targets PostgreSQL, Redis, and MinIO-compatible object storage in deployment. `.env.example` contains the PostgreSQL and MinIO-compatible settings; no production secrets are committed.

Laravel Herd provides PHP 8.4.25 and Composer 2.10.2. Herd's CLI runtime is verified. The Herd Nginx service currently has no configured PHP versions and returns 502 for `.test` sites, so the verified local API command is:

```sh
export PATH="/Users/hello/Library/Application Support/Herd/bin:$PATH"
cd /Users/hello/Documents/Codex/2026-10-01/new-chat/evorail/backend
php artisan serve --host=127.0.0.1 --port=8002
```

The React/Vite frontend is available at `http://127.0.0.1:5174/`. Docker, PostgreSQL, Redis, and MinIO are not installed on this host, so the complete production-like stack was not started. No duplicate PHP/Composer runtime, WSL layer, architecture override, or Rosetta dependency was introduced.
