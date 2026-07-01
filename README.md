# Paytm Wallet End-to-End Peer-to-Peer Wallet Backend

A production-style peer-to-peer wallet project inspired by Paytm wallet flows. It includes a concurrent Express backend, PostgreSQL row-level locking, Redis idempotency and caching, Aadhaar-style KYC simulation, receiver verification, a Next.js dashboard, OpenAPI-generated client SDKs, and Docker/Nginx deployment.

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
npm run health
```

Open:

- Web dashboard: http://localhost
- API health: http://localhost:4000/api/health
- API docs: http://localhost:4000/api/docs

## Demo Users

After seeding:

- `milan@example.com` / `password123`
- `aisha@example.com` / `password123`
- `rohan@example.com` / `password123`

Demo UPI IDs:

- `milan@wallet`
- `aisha@wallet`
- `rohan@wallet`

## Key API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register user and wallet |
| POST | `/api/auth/login` | Login user |
| GET | `/api/profile` | Get profile and KYC status |
| POST | `/api/profile/aadhaar/link` | Link Aadhaar-style KYC with masked storage |
| GET | `/api/receivers/resolve` | Verify receiver by email or simulated UPI ID |
| GET | `/api/wallet` | Get wallet balance |
| POST | `/api/wallet/add-money` | Add wallet balance |
| POST | `/api/transfer` | Send money to another user |
| GET | `/api/transactions` | Fetch transaction history |
| GET | `/api/ops/snapshot` | Backend refresh snapshot |
| GET | `/api/ops/isolation` | Transaction isolation details |
| GET | `/api/ops/retry-safety` | Redis idempotency details |
| GET | `/api/health` | Health check |

## Real-World Wallet Flow

- Profile chip opens a live backend profile/KYC message.
- Refresh button returns a readable backend snapshot from PostgreSQL and Redis.
- Isolation and retry-safety cards call backend endpoints and show message-style receipts.
- Aadhaar KYC simulation stores only the last four digits and a consent timestamp.
- Receiver lookup resolves by email or simulated UPI ID before transfer and shows a verification message.
- Transfer still uses PostgreSQL row-level locking and Redis idempotency.

For a real production launch, the Aadhaar flow must be replaced with an approved KYC provider or regulated verification integration. This project intentionally stores only masked Aadhaar-style data for a safe portfolio simulation.

## Concurrency Design

Transfers run in a PostgreSQL transaction using `REPEATABLE READ`, deterministic wallet locking, and `SELECT ... FOR UPDATE`. Redis guards each transfer with an idempotency key, so repeated requests return the same transaction instead of charging twice.

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

## GitHub Push

First login:

```powershell
gh auth login
```

Create and push the repo:

```powershell
gh repo create paytm-wallet-end-to-end-peer --public --source . --remote origin --push
```

For later changes:

```powershell
git add .
git commit -m "Enhance wallet dashboard and KYC flows"
git push origin main
```
