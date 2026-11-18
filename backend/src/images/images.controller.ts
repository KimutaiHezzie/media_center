import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Param,
  Res,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImagesService } from './images.service.js';
import { CompressImageDto } from './dto/compress-image.dto.js';
import { UpscaleImageDto } from './dto/upscale-image.dto.js';

import { Multer } from 'multer';

declare global {
  namespace Express {
    export interface MulterFile extends Multer.File {}
  }
}

type ExpressMulterFile = Express.Multer.File;

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('compress')
  @UseInterceptors(FileInterceptor('image'))
  async compress(
    @UploadedFile() file: ExpressMulterFile,
    @Body() dto: CompressImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.imagesService.compressImage(file, dto);
  }

  @Post('upscale')
  @UseInterceptors(FileInterceptor('image'))
  async upscale(
    @UploadedFile() file: ExpressMulterFile,
    @Body() dto: UpscaleImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.imagesService.upscaleImage(file, dto);
  }

  @Get(':filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const { filePath } = this.imagesService.getProcessedImage(filename);
    res.sendFile(filePath);
  }
}
