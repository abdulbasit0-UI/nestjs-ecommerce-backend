// src/common/filters/aws.exception.filter.ts
import { ExceptionFilter, Catch, HttpException, Logger } from '@nestjs/common';

@Catch()
export class AwsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('AWS');

  catch(exception: any) {
    this.logger.error('S3 Upload Error:', exception.message);
    throw new HttpException(
      'File upload failed',
      exception.status || 500,
    );
  }
}