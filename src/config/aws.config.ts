// src/config/aws.config.ts
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const s3Config = (configService: ConfigService) => {
  const region = configService.get<string>('AWS_REGION');
  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS S3 configuration values');
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const AWS_BUCKET = 'AWS_S3_BUCKET';
export const AWS_URL = 'AWS_S3_URL';