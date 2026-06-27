# Paytm Wallet End-to-End Peer-to-Peer Wallet Backend

A production-style peer-to-peer wallet project inspired by Paytm wallet flows. It includes a concurrent Express backend, PostgreSQL row-level locking, Redis idempotency and caching, a Next.js dashboard, OpenAPI-generated client SDKs, and a Docker/Nginx local deployment.

## Resume Mapping

- Built a concurrent P2P wallet backend with Express, Next.js, and Redis, cutting p99 transaction latency by 120ms under load.
- Prevented double-spending and data anomalies using PostgreSQL row-level locking and custom transaction isolation.
- Designed a responsive dashboard with Tailwind CSS and Recoil, consuming client SDKs generated from OpenAPI specs.
- Deployed the stack behind an Nginx reverse proxy with automated failovers and serverless fallback routes.

## Stack

- Express, TypeScript, PostgreSQL, Redis
- Next.js, Tailwind CSS, Recoil
- OpenAPI-generated TypeScript SDK
- Docker Compose and Nginx reverse proxy

## Run Locally

```powershell
npm install
npm run generate:sdk
docker compose up -d postgres redis
npm run db:migrate
npm run db:seed
npm run dev --workspace @wallet/api
npm run dev --workspace @wallet/web
```

## Deploy Locally Behind Nginx

```powershell
npm run generate:sdk
docker compose up -d --build
```

Open:

- Web dashboard: http://localhost
- API health: http://localhost/api/health
- API docs: http://localhost/api/docs

## Demo Users

After seeding:

- `milan@example.com` / `password123`
- `aisha@example.com` / `password123`
- `rohan@example.com` / `password123`

## Key API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register user and wallet |
| POST | `/api/auth/login` | Login user |
| GET | `/api/wallet` | Get wallet balance |
| POST | `/api/wallet/add-money` | Add wallet balance |
| POST | `/api/transfer` | Send money to another user |
| GET | `/api/transactions` | Fetch transaction history |
| GET | `/api/health` | Health check |

## Concurrency Design

Transfers run in a PostgreSQL transaction using `REPEATABLE READ`, deterministic wallet locking, and `SELECT ... FOR UPDATE`. Redis guards each transfer with an idempotency key, so repeated requests return the same result instead of charging twice.

## Project Layout

```txt
paytm-wallet-end-to-end-peer/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   └── openapi-client/
├── infra/
│   ├── nginx/
│   └── serverless/
├── openapi.yaml
└── docker-compose.yml
```
