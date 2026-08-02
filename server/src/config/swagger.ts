import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NFT Certificate Generator API',
      version: '1.0.0',
      description:
        'Production REST API for issuing, minting, and verifying university NFT certificates on Polygon Amoy.',
      contact: { name: 'API Support', email: 'support@nftcerts.com' },
    },
    servers: [
      { url: env.apiUrl, description: 'Current environment' },
      { url: 'http://localhost:5000', description: 'Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Universities' },
      { name: 'Students' },
      { name: 'Certificates' },
      { name: 'Mint' },
      { name: 'Verify' },
      { name: 'Dashboard' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
