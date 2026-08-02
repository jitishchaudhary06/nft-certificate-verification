import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface IpfsUploadResult {
  ipfsHash: string;
  url: string;
  pinSize?: number;
}

const pinataHeaders = () => {
  if (env.pinata.jwt) {
    return { Authorization: `Bearer ${env.pinata.jwt}` };
  }
  if (env.pinata.apiKey && env.pinata.secretApiKey) {
    return {
      pinata_api_key: env.pinata.apiKey,
      pinata_secret_api_key: env.pinata.secretApiKey,
    };
  }
  return null;
};

export const isPinataConfigured = (): boolean => Boolean(pinataHeaders());

export const uploadFileToIpfs = async (
  filePath: string,
  name?: string
): Promise<IpfsUploadResult> => {
  const headers = pinataHeaders();
  if (!headers) {
    // Dev fallback: return a mock hash based on filename for local testing
    const mockHash = `QmLocal${Buffer.from(path.basename(filePath)).toString('hex').slice(0, 38)}`;
    console.warn('[IPFS] Pinata not configured — using local mock hash');
    return {
      ipfsHash: mockHash,
      url: `${env.pinata.gateway}/${mockHash}`,
    };
  }

  if (!fs.existsSync(filePath)) throw new AppError('File not found for IPFS upload', 404);

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append(
    'pinataMetadata',
    JSON.stringify({ name: name || path.basename(filePath) })
  );

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    form,
    {
      headers: { ...headers, ...form.getHeaders() },
      maxBodyLength: Infinity,
    }
  );

  const ipfsHash = response.data.IpfsHash as string;
  return {
    ipfsHash,
    url: `${env.pinata.gateway}/${ipfsHash}`,
    pinSize: response.data.PinSize,
  };
};

export const uploadJsonToIpfs = async (
  metadata: Record<string, unknown>,
  name?: string
): Promise<IpfsUploadResult> => {
  const headers = pinataHeaders();
  if (!headers) {
    const mockHash = `QmMeta${Buffer.from(JSON.stringify(metadata)).toString('hex').slice(0, 40)}`;
    console.warn('[IPFS] Pinata not configured — using local mock metadata hash');
    return {
      ipfsHash: mockHash,
      url: `${env.pinata.gateway}/${mockHash}`,
    };
  }

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: metadata,
      pinataMetadata: { name: name || 'certificate-metadata' },
    },
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );

  const ipfsHash = response.data.IpfsHash as string;
  return {
    ipfsHash,
    url: `${env.pinata.gateway}/${ipfsHash}`,
    pinSize: response.data.PinSize,
  };
};

export const buildCertificateMetadata = (params: {
  name: string;
  description: string;
  imageIpfsUrl: string;
  studentName: string;
  university: string;
  course: string;
  grade?: string | null;
  issueDate: Date;
  certificateNumber: string;
}) => ({
  name: params.name,
  description: params.description,
  image: params.imageIpfsUrl,
  external_url: env.clientUrl,
  attributes: [
    { trait_type: 'Student', value: params.studentName },
    { trait_type: 'University', value: params.university },
    { trait_type: 'Course', value: params.course },
    ...(params.grade ? [{ trait_type: 'Grade', value: params.grade }] : []),
    { trait_type: 'Issue Date', value: params.issueDate.toISOString().split('T')[0] },
    { trait_type: 'Certificate Number', value: params.certificateNumber },
  ],
});
