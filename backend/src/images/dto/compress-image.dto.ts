import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CompressImageDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

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
