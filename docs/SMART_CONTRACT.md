# Smart Contract Documentation

## Contract: `CertificateNFT`

- **Standard:** ERC-721 (`ERC721URIStorage`) + `AccessControl`
- **Network:** Polygon Amoy (`chainId` 80002)
- **Symbol:** `CERT`

## Roles

| Role | Capability |
|------|------------|
| `DEFAULT_ADMIN_ROLE` | Grant/revoke roles |
| `MINTER_ROLE` | `mintCertificate` |
| `REVOKER_ROLE` | `revokeCertificate` |

## Functions

### `mintCertificate(to, tokenURI, studentName, university, course, grade, certificateNumber) → tokenId`

Mints NFT, stores certificate struct, emits `CertificateMinted`.

### `verifyCertificate(tokenId) → (isValid, CertificateData)`

Returns validity (`!revoked`) and on-chain metadata.

### `revokeCertificate(tokenId, reason)`

Marks revoked, emits `CertificateRevoked`. Token remains owned (soulbound-style revoke without burn).

### `getCertificate(tokenId)`

Returns stored certificate struct.

### Also available

- `ownerOf(tokenId)`
- `tokenURI(tokenId)`
- `totalSupply()`
- `getTokenIdByCertificateNumber(certificateNumber)`

## Events

```solidity
event CertificateMinted(uint256 indexed tokenId, address indexed to, string certificateNumber, string studentName);
event CertificateRevoked(uint256 indexed tokenId, string reason);
```

## Deploy

```bash
npx hardhat run scripts/deploy.ts --network amoy
```

## Tests

```bash
npx hardhat test
```

Coverage includes mint, verify, revoke, duplicate certificate number protection, and non-minter rejection.
