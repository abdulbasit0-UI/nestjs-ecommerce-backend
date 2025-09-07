import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { s3Config } from '../../config/aws.config';
import { AwsService } from './aws.service';

@Module({
  providers: [
    AwsService,
    {
      provide: 'S3_CLIENT',
      useFactory: s3Config,
      inject: [ConfigService],
    },
  ],
  exports: ['S3_CLIENT', AwsService],
})
export class AwsModule {}