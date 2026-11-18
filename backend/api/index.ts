import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module.js';
import express from 'express';

let cachedApp: any;

async function bootstrap(): Promise<any> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  await nestApp.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async (req: any, res: any) => {
  const app = await bootstrap();
  return app(req, res);
};