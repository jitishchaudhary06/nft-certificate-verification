import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

const ABI = [
  'function mintCertificate(address to, string memory tokenURI_, string memory studentName, string memory university, string memory course, string memory grade, string memory certificateNumber) external returns (uint256)',
  'function verifyCertificate(uint256 tokenId) external view returns (bool isValid, tuple(string studentName, string university, string course, string grade, string certificateNumber, uint256 issuedAt, bool revoked, address issuer) cert)',
  'function revokeCertificate(uint256 tokenId, string memory reason) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function getCertificate(uint256 tokenId) external view returns (tuple(string studentName, string university, string course, string grade, string certificateNumber, uint256 issuedAt, bool revoked, address issuer))',
  'function transferFrom(address from, address to, uint256 tokenId) external',
  'event CertificateMinted(uint256 indexed tokenId, address indexed to, string certificateNumber, string studentName)',
  'event CertificateRevoked(uint256 indexed tokenId, string reason)',
];

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

export const getProvider = () => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(env.blockchain.rpcUrl);
  }
  return provider;
};

export const getSigner = () => {
  if (!env.blockchain.privateKey) {
    throw new AppError('Blockchain private key not configured', 503);
  }
  if (!wallet) {
    wallet = new ethers.Wallet(env.blockchain.privateKey, getProvider());
  }
  return wallet;
};

export const getContract = (withSigner = true) => {
  if (!env.blockchain.contractAddress) {
    throw new AppError('Certificate NFT contract address not configured', 503);
  }
  if (withSigner) {
    return new ethers.Contract(env.blockchain.contractAddress, ABI, getSigner());
  }
  return new ethers.Contract(env.blockchain.contractAddress, ABI, getProvider());
};

export const isBlockchainConfigured = () =>
  Boolean(env.blockchain.privateKey && env.blockchain.contractAddress);

export const getWalletBalance = async (): Promise<string> => {
  if (!env.blockchain.privateKey) return '0';
  try {
    const signer = getSigner();
    const balance = await getProvider().getBalance(signer.address);
    return ethers.formatEther(balance);
  } catch {
    return '0';
  }
};

export const mintCertificateOnChain = async (params: {
  to: string;
  tokenURI: string;
  studentName: string;
  university: string;
  course: string;
  grade: string;
  certificateNumber: string;
}) => {
  if (!isBlockchainConfigured()) {
    // Dev mock mint for local development without deployed contract
    const mockTokenId = String(Math.floor(Date.now() / 1000) % 1000000);
    const mockTxHash = `0x${Buffer.from(`mint-${params.certificateNumber}-${Date.now()}`).toString('hex').padEnd(64, '0').slice(0, 64)}`;
    console.warn('[Blockchain] Not configured — returning mock mint result');
    return {
      tokenId: mockTokenId,
      txHash: mockTxHash,
      contractAddress: env.blockchain.contractAddress || '0x0000000000000000000000000000000000000000',
      blockNumber: 0,
      mocked: true,
    };
  }

  const nft = getContract(true);
  const tx = await nft.mintCertificate(
    params.to,
    params.tokenURI,
    params.studentName,
    params.university,
    params.course,
    params.grade || '',
    params.certificateNumber
  );
  const receipt = await tx.wait();

  let tokenId = '0';
  for (const log of receipt.logs) {
    try {
      const parsed = nft.interface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === 'CertificateMinted') {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch {
      // skip unrelated logs
    }
  }

  return {
    tokenId,
    txHash: receipt.hash,
    contractAddress: env.blockchain.contractAddress,
    blockNumber: Number(receipt.blockNumber),
    mocked: false,
  };
};

export const revokeCertificateOnChain = async (tokenId: string, reason: string) => {
  if (!isBlockchainConfigured()) {
    return {
      txHash: `0x${Buffer.from(`revoke-${tokenId}`).toString('hex').padEnd(64, '0').slice(0, 64)}`,
      mocked: true,
    };
  }
  const nft = getContract(true);
  const tx = await nft.revokeCertificate(tokenId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, mocked: false };
};

export const verifyOnChain = async (tokenId: string) => {
  if (!isBlockchainConfigured()) {
    return null;
  }
  const nft = getContract(false);
  const [isValid, cert] = await nft.verifyCertificate(tokenId);
  const owner = await nft.ownerOf(tokenId);
  const tokenURI = await nft.tokenURI(tokenId);
  return {
    isValid,
    owner,
    tokenURI,
    certificate: {
      studentName: cert.studentName,
      university: cert.university,
      course: cert.course,
      grade: cert.grade,
      certificateNumber: cert.certificateNumber,
      issuedAt: Number(cert.issuedAt),
      revoked: cert.revoked,
      issuer: cert.issuer,
    },
  };
};

export const getExplorerUrl = (txHash: string) =>
  `${env.blockchain.explorerUrl}/tx/${txHash}`;

export const loadArtifactAbi = () => {
  const artifactPath = path.resolve(
    __dirname,
    '../../../contracts/artifacts/contracts/CertificateNFT.sol/CertificateNFT.json'
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    return artifact.abi;
  }
  return ABI;
};
