import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AwsService {
    private s3Client: S3Client;
    private bucketName: string;
    private s3Url: string;

    constructor(private configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.get<string>('AWS_REGION')!,
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
            },
        });
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')!;
        this.s3Url = this.configService.get<string>('AWS_S3_URL')!;
    }

    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        const key = `${folder}/${uuid()}-${Date.now()}.${file.originalname.split('.').pop()}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        try {
            await this.s3Client.send(command);
            return `${this.s3Url}/${key}`;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            const key = fileUrl.replace(`${this.s3Url}/`, '');
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
        } catch (error) {
            console.error('S3 Delete Error:', error);
            throw new Error('Failed to delete file from S3');
        }
    }
}