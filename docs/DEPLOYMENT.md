# Deployment Guide

## 1. Database — Supabase PostgreSQL

1. Create a Supabase project.
2. Copy the connection string (Transaction pooler + Direct).
3. Set in Render / local `.env`:

```
DATABASE_URL=postgresql://...pooler...?sslmode=require
DIRECT_URL=postgresql://...direct...?sslmode=require
```

4. Run migrations from CI or locally:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## 2. Backend — Render

1. New **Web Service**, root directory `server` (or monorepo with build command).
2. Build:

```bash
npm install && npx prisma generate --schema=../prisma/schema.prisma && npm run build --workspace=server
```

3. Start:

```bash
npm run start --workspace=server
```

4. Environment variables: copy from `.env.example` (JWT secrets, SMTP, Pinata, `PRIVATE_KEY`, `CERTIFICATE_NFT_ADDRESS`, `CLIENT_URL`, `DATABASE_URL`).
5. Attach a persistent disk for `/uploads` **or** migrate uploads fully to IPFS/S3 for production.

## 3. Frontend — Vercel

1. Import repo, set root to `client`.
2. Environment:

```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

3. Framework: Next.js. Deploy.

## 4. Smart Contract — Polygon Amoy

1. Fund deployer wallet with Amoy MATIC (faucet).
2. Set `PRIVATE_KEY` and `POLYGON_AMOY_RPC_URL`.
3. Deploy:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network amoy
```

4. Copy address into `CERTIFICATE_NFT_ADDRESS`.
5. Verify on [amoy.polygonscan.com](https://amoy.polygonscan.com).

## 5. Pinata IPFS

1. Create Pinata account → API keys / JWT.
2. Set `PINATA_JWT` (preferred) or API key pair.
3. Without Pinata, the API uses **dev mock hashes** so local flows still work.

## 6. Redis (optional)

Set `REDIS_URL` for BullMQ email queues. If Redis is down, emails send synchronously.

## 7. Post-deploy checklist

- [ ] Seed super admin
- [ ] Create university + assign admin
- [ ] Issue certificate → PDF → IPFS → mint
- [ ] Open `/verify/:tokenId` publicly
- [ ] Confirm CORS allows Vercel origin
