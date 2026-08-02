# CertChain — NFT Certificate Generator

Production-ready platform for universities to issue academic certificates as ERC-721 NFTs on Polygon Amoy, with IPFS storage and public verification.

## Architecture

```
client/      Next.js 15 (App Router) + TypeScript + Tailwind + TanStack Query
server/      Express.js + Prisma + JWT + PDFKit + Pinata + Ethers
contracts/   Hardhat + OpenZeppelin ERC721 (CertificateNFT)
prisma/      PostgreSQL schema (Supabase-ready)
uploads/     Local PDF / QR / logo storage
docs/        Deployment, ER diagram, API & contract docs
```

## Features by phase

| Phase | Scope |
|------|--------|
| 1 | Email / Google / MetaMask auth, JWT + refresh, verify email, forgot password |
| 2 | Admin dashboard stats & recent activity |
| 3 | Student CRUD, CSV import/export, search, pagination |
| 4 | University + Certificate CRUD, role-based access |
| 5 | PDFKit certificate generation + QR codes |
| 6 | Pinata IPFS file + metadata upload |
| 7 | Solidity mint / verify / revoke + explorer links |
| 8 | Public `/verify/:tokenId` + employer search |
| 9 | Vercel / Render / Supabase / Amoy deployment guides |

## Quick start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL (local or Supabase)
- MetaMask (optional for wallet flows)
- Redis (optional — emails fall back to sync send)

### 2. Install

```bash
cp .env.example .env
# edit DATABASE_URL and secrets

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Run

```bash
# terminal 1 — API
npm run dev:server

# terminal 2 — Web
npm run dev:client
```

- Web: http://localhost:3000  
- API: http://localhost:5000  
- Swagger: http://localhost:5000/api/docs  

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@nftcerts.com | Admin@123456 |
| University Admin | uniadmin@demouni.edu | UniAdmin@123 |

## Environment

See [`.env.example`](./.env.example). Client needs:

```bash
# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

## Smart contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network amoy
```

Set `CERTIFICATE_NFT_ADDRESS` and `PRIVATE_KEY` in `.env`.

## Testing

```bash
npm run test --workspace=server
npm run test --workspace=contracts
```

## Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Database Schema / ER](./docs/DATABASE.md)
- [Smart Contract](./docs/SMART_CONTRACT.md)
- [API Overview](./docs/API.md)
- Swagger UI: `/api/docs`

## Security

Helmet, CORS, rate limiting, Zod validation, Prisma (SQL injection protection), JWT access + refresh tokens, RBAC (`SUPER_ADMIN`, `UNIVERSITY_ADMIN`, `STUDENT`, `EMPLOYER`).

## License

MIT
