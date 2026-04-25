import { Test, TestingModule } from '@nestjs/testing';
import { RuleService } from './rule.service';
import { RuleRepository } from './rule.repository';
import { Rule } from './rule.types';

const mockRuleRepository = {
  findAll: jest.fn(),
  findActive: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

function buildRule(overrides: Partial<Rule> = {}): Rule {
  return {
    uid: 'rule001',
    active: true,
    pair: 'SOL-USDT',
    market: 'binance',
    fetchType: 'ws',
    activators: [],
    actions: [],
    activatedAt: null,
    deadlines: [],
    ...overrides,
  };
}

describe('RuleService', () => {
  let service: RuleService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleService,
        { provide: RuleRepository, useValue: mockRuleRepository },
      ],
    }).compile();

    service = module.get<RuleService>(RuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveRules', () => {
    it('should return active rules from repository', async () => {
      const rules = [buildRule()];
      mockRuleRepository.findActive.mockResolvedValue(rules);

      const result = await service.getActiveRules();

      expect(result).toEqual(rules);
      expect(mockRuleRepository.findActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveRule', () => {
    it('should save rule and emit onRulesChanged$', async () => {
      mockRuleRepository.save.mockResolvedValue(undefined);
      const rule = buildRule();
      const changed: boolean[] = [];
      service.onRulesChanged$.subscribe(() => changed.push(true));

      await service.saveRule(rule);

      expect(mockRuleRepository.save).toHaveBeenCalledWith(rule);
      expect(changed).toHaveLength(1);
    });
  });

  describe('updateRule', () => {
    it('should update rule and emit onRulesChanged$', async () => {
      mockRuleRepository.update.mockResolvedValue(undefined);
      const changed: boolean[] = [];
      service.onRulesChanged$.subscribe(() => changed.push(true));

      await service.updateRule('rule001', { active: false });

      expect(mockRuleRepository.update).toHaveBeenCalledWith('rule001', {
        active: false,
      });
      expect(changed).toHaveLength(1);
    });
  });

  describe('deleteRule', () => {
    it('should delete rule and emit onRulesChanged$', async () => {
      mockRuleRepository.delete.mockResolvedValue(undefined);
      const changed: boolean[] = [];
      service.onRulesChanged$.subscribe(() => changed.push(true));

      await service.deleteRule('rule001');

      expect(mockRuleRepository.delete).toHaveBeenCalledWith('rule001');
      expect(changed).toHaveLength(1);
    });
  });

  describe('syncRules', () => {
    it('should update changed rules and emit onRulesChanged$', async () => {
      const existing = [buildRule({ uid: 'rule001', active: true })];
      mockRuleRepository.findAll.mockResolvedValue(existing);
      mockRuleRepository.save.mockResolvedValue(undefined);
      const changed: boolean[] = [];
      service.onRulesChanged$.subscribe(() => changed.push(true));

      await service.syncRules([buildRule({ uid: 'rule001', active: false })]);

      expect(mockRuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'rule001', active: false }),
      );
      expect(changed).toHaveLength(1);
    });

    it('should not emit onRulesChanged$ when nothing changed', async () => {
      mockRuleRepository.findAll.mockResolvedValue([
        buildRule({ uid: 'rule001', active: true }),
      ]);
      const changed: boolean[] = [];
      service.onRulesChanged$.subscribe(() => changed.push(true));

      await service.syncRules([buildRule({ uid: 'rule001', active: true })]);

      expect(mockRuleRepository.save).not.toHaveBeenCalled();
      expect(changed).toHaveLength(0);
    });
  });
});
