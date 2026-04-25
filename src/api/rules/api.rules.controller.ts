import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiRulesService } from './api.rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleDto } from './dto/rule.dto';
import { Rule } from '../../rule/rule.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('rules')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/rules')
export class ApiRulesController {
  constructor(private readonly apiRulesService: ApiRulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new trading rule' })
  @ApiResponse({
    status: 201,
    description: 'Rule created successfully',
    type: RuleDto,
  })
  async create(@Body() createRuleDto: CreateRuleDto): Promise<Rule> {
    return await this.apiRulesService.create(createRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trading rules' })
  @ApiResponse({
    status: 200,
    description: 'List of all rules',
    type: [RuleDto],
  })
  async findAll(): Promise<RuleDto[]> {
    return await this.apiRulesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active trading rules' })
  @ApiResponse({
    status: 200,
    description: 'List of active rules',
    type: [RuleDto],
  })
  async findActive(): Promise<Rule[]> {
    return await this.apiRulesService.findActive();
  }

  @Get(':uid')
  @ApiOperation({ summary: 'Get a trading rule by UID' })
  @ApiParam({
    name: 'uid',
    description: 'Rule unique identifier',
    example: 'rule-btc-buy-low',
  })
  @ApiResponse({ status: 200, description: 'Rule found', type: RuleDto })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async findOne(@Param('uid') uid: string): Promise<Rule> {
    return await this.apiRulesService.findOne(uid);
  }

  @Patch(':uid')
  @ApiOperation({ summary: 'Update a trading rule' })
  @ApiParam({
    name: 'uid',
    description: 'Rule unique identifier',
    example: 'rule-btc-buy-low',
  })
  @ApiResponse({
    status: 200,
    description: 'Rule updated successfully',
    type: RuleDto,
  })
  async update(
    @Param('uid') uid: string,
    @Body() updateRuleDto: UpdateRuleDto,
  ): Promise<Rule> {
    return await this.apiRulesService.update(uid, updateRuleDto);
  }

  @Delete(':uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a trading rule' })
  @ApiParam({
    name: 'uid',
    description: 'Rule unique identifier',
    example: 'rule-btc-buy-low',
  })
  @ApiResponse({
    status: 204,
    description: 'Rule deleted successfully',
  })
  async remove(@Param('uid') uid: string): Promise<void> {
    return await this.apiRulesService.remove(uid);
  }
}
