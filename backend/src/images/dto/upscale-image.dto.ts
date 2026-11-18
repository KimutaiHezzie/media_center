import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpscaleImageDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  scale?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  height?: number;
}
