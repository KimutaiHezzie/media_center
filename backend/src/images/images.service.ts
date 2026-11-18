import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import sharp, { Sharp } from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { CompressImageDto } from './dto/compress-image.dto.js';
import { UpscaleImageDto } from './dto/upscale-image.dto.js';

import { Multer } from 'multer';

declare global {
  namespace Express {
    export interface MulterFile extends Multer.File {}
  }
}

type ExpressMulterFile = Express.Multer.File;

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PROCESSED_DIR = path.join(process.cwd(), 'processed');

@Injectable()
export class ImagesService {
  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROCESSED_DIR)) {
      fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    return `${hash}${ext}`;
  }

  private saveFile(buffer: Buffer, filename: string, dir: string): string {
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  async compressImage(
    file: ExpressMulterFile,
    dto: CompressImageDto,
  ): Promise<{ originalName: string; processedName: string; size: number; downloadUrl: string }> {
    try {
      const quality = dto.quality ?? 80;
      const width = dto.width;
      const height = dto.height;

      let sharpInstance: Sharp = sharp(file.buffer);

      const metadata = await sharpInstance.metadata();

      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: false,
        });
      }

      const outputFormat = metadata.format === 'png' ? 'png' : 'jpeg';

      if (outputFormat === 'jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality });
      } else if (outputFormat === 'png') {
        sharpInstance = sharpInstance.png({ quality });
      } else if (outputFormat === 'webp') {
        sharpInstance = sharpInstance.webp({ quality });
      }

      const processedBuffer = await sharpInstance.toBuffer();

      const filename = this.generateUniqueFilename(file.originalname);
      const filePath = this.saveFile(processedBuffer, filename, PROCESSED_DIR);

      const stats = fs.statSync(filePath);

      return {
        originalName: file.originalname,
        processedName: filename,
        size: stats.size,
        downloadUrl: `/images/${filename}`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to compress image: ${message}`);
    }
  }

  async upscaleImage(
    file: ExpressMulterFile,
    dto: UpscaleImageDto,
  ): Promise<{ originalName: string; processedName: string; size: number; downloadUrl: string }> {
    try {
      const scale = dto.scale ?? 2;
      const width = dto.width;
      const height = dto.height;

      let sharpInstance: Sharp = sharp(file.buffer);

      const metadata = await sharpInstance.metadata();

      let targetWidth = width;
      let targetHeight = height;

      if (!targetWidth && !targetHeight) {
        targetWidth = Math.round((metadata.width ?? 0) * scale);
        targetHeight = Math.round((metadata.height ?? 0) * scale);
      }

      sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill',
        withoutEnlargement: false,
      });

      sharpInstance = sharpInstance.png({ quality: 100, adaptiveFiltering: true });

      const processedBuffer = await sharpInstance.toBuffer();

      const filename = this.generateUniqueFilename(file.originalname);
      const filePath = this.saveFile(processedBuffer, filename, PROCESSED_DIR);

      const stats = fs.statSync(filePath);

      return {
        originalName: file.originalname,
        processedName: filename,
        size: stats.size,
        downloadUrl: `/images/${filename}`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to upscale image: ${message}`);
    }
  }

  getProcessedImage(filename: string): { filePath: string; exists: boolean } {
    const filePath = path.join(PROCESSED_DIR, filename);
    const exists = fs.existsSync(filePath);

    if (!exists) {
      throw new NotFoundException(`Image ${filename} not found`);
    }

    return { filePath, exists };
  }
}
