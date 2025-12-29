import {
  IsDateString,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

export class RunBacktestDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  interval: string; // e.g., '1m', '5m', '1h', '1d'

  @IsNumber()
  @Min(0)
  startBalance: number;

  @IsString()
  quoteCurrency: string;

  @IsString()
  @IsOptional()
  exchangeId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rules?: string[]; // Rule UIDs to test (if empty, tests all active rules)
}
