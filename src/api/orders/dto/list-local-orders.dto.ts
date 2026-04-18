import { IsOptional, IsString, IsArray, IsIn, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const LOCAL_ORDER_STATUSES = [
  'new',
  'pending',
  'completed',
  'cancelled',
  'failed',
] as const;

export class ListInternalOrdersDto {
  @ApiPropertyOptional({
    description: 'Filter orders placed on or after this timestamp (ms)',
    example: 1700000000000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  since?: number;

  @ApiPropertyOptional({
    description: 'Filter orders placed on or before this timestamp (ms)',
    example: 1800000000000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  until?: number;

  @ApiPropertyOptional({
    description: 'Filter by trading pair (e.g., SOL-USDT)',
    example: 'SOL-USDT',
  })
  @IsOptional()
  @IsString()
  pair?: string;

  @ApiPropertyOptional({
    description: 'Filter by one or more local order statuses',
    example: ['pending', 'completed'],
    enum: LOCAL_ORDER_STATUSES,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsIn(LOCAL_ORDER_STATUSES, { each: true })
  status?: string[];

  @ApiPropertyOptional({
    description:
      'Filter by rule UID — returns all orders triggered by that rule',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  ruleId?: string;
}
