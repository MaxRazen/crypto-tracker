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
} from '@nestjs/common';
import { ApiRulesService } from './api.rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { Rule } from '../../rule/rule.types';

@Controller('api/rules')
export class ApiRulesController {
  constructor(private readonly apiRulesService: ApiRulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRuleDto: CreateRuleDto): Promise<Rule> {
    return await this.apiRulesService.create(createRuleDto);
  }

  @Get()
  async findAll(): Promise<Rule[]> {
    return await this.apiRulesService.findAll();
  }

  @Get('active')
  async findActive(): Promise<Rule[]> {
    return await this.apiRulesService.findActive();
  }

  @Get(':uid')
  async findOne(@Param('uid') uid: string): Promise<Rule> {
    return await this.apiRulesService.findOne(uid);
  }

  @Patch(':uid')
  async update(
    @Param('uid') uid: string,
    @Body() updateRuleDto: UpdateRuleDto,
  ): Promise<Rule> {
    return await this.apiRulesService.update(uid, updateRuleDto);
  }

  @Delete(':uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('uid') uid: string): Promise<void> {
    return await this.apiRulesService.remove(uid);
  }
}
