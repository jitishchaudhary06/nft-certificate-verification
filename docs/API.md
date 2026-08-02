# API Overview

Base URL: `/api`  
Auth header: `Authorization: Bearer <accessToken>`  
Interactive docs: `/api/docs` (Swagger)

## Auth

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Public |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |
| GET/POST | `/auth/verify-email` | Public |
| POST | `/auth/google` | Public |
| POST | `/auth/metamask/nonce` | Public |
| POST | `/auth/metamask` | Public |
| POST | `/auth/logout` | JWT |
| GET | `/auth/me` | JWT |
| POST | `/auth/link-wallet` | JWT |

## Resources

| Method | Path | Roles |
|--------|------|-------|
| CRUD | `/universities` | Super Admin (+ list for Uni Admin) |
| POST | `/universities/:id/assign-admin` | Super Admin |
| CRUD | `/students` / `/student` | Super / Uni Admin |
| POST | `/students/import/csv` | Super / Uni Admin |
| GET | `/students/export/csv` | Super / Uni Admin |
| CRUD | `/certificates` / `/certificate` | Super / Uni Admin (+ student read) |
| POST | `/certificates/:id/generate-pdf` | Super / Uni Admin |
| POST | `/certificates/:id/ipfs` | Super / Uni Admin |
| POST | `/certificates/:id/email` | Super / Uni Admin |
| POST | `/certificates/:id/revoke` | Super / Uni Admin |
| POST | `/mint` | Super / Uni Admin |
| GET | `/verify` | Public (employer search) |
| GET | `/verify/:token` | Public |
| GET | `/verify/certificate/:id` | Public |
| GET | `/dashboard` | Super / Uni Admin |
| GET | `/student-dashboard/nfts` | Student |

## Response shape

```json
{
  "success": true,
  "message": "…",
  "data": {}
}
```
