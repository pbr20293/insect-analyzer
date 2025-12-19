import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

// MinIO configuration from environment
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || '192.168.86.3',
  port: parseInt(process.env.MINIO_PORT) || 8031,
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  region: process.env.MINIO_REGION || 'us-west',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || ''
};

let minioClient = null;

export const createMinioClient = (credentials = null) => {
  try {
    const config = {
      ...minioConfig,
      ...(credentials && {
        accessKey: credentials.accessKey,
        secretKey: credentials.secretKey
      })
    };

    if (!config.accessKey || !config.secretKey) {
      throw new Error('MinIO credentials are required');
    }

    return new Client(config);
  } catch (error) {
    console.error('Failed to create MinIO client:', error);
    throw error;
  }
};

export const getMinioClient = (credentials = null) => {
  if (!minioClient || credentials) {
    minioClient = createMinioClient(credentials);
  }
  return minioClient;
};

export { minioConfig };