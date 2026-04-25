import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ExchangeService } from '../exchange/exchange.service';
import { PositionRepository } from './position.repository';
import { EventService } from '../event/event.service';
import orderConfig from './order.config';
import modeConfig, { ModeConfig } from '../config/mode.config';
import { Order } from './order.types';
import { Subject } from 'rxjs';
import { OrderActionEvent } from '../event/event.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    uid: 'rule001-buy-1000',
    pair: 'SOL-USDT',
    price: '100',
    side: 'buy',
    type: 'limit',
    quantity: { type: 'percent', value: '100' },
    status: 'new',
    ...overrides,
  };
}

function buildCcxtOrder(overrides: Partial<any> = {}): any {
  return {
    id: 'exchange-id-1',
    status: 'closed',
    filled: 10,
    average: 100,
    remaining: 0,
    ...overrides,
  };
}

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockOrderRepository = {
  findActive: jest.fn(),
  findActiveByActionId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockExchangeService = {
  getBalance: jest.fn(),
  createMarketOrder: jest.fn(),
  createLimitOrder: jest.fn(),
  getOrder: jest.fn(),
  getExchange: jest.fn(),
};

const mockPositionRepository = {
  findOpenPosition: jest.fn(),
  create: jest.fn(),
  closePosition: jest.fn(),
  updatePosition: jest.fn(),
};

const orderActionSubject = new Subject<OrderActionEvent>();
const mockEventService = {
  onOrderAction$: orderActionSubject.asObservable(),
};

const liveModeConfig: ModeConfig = {
  isIdleMode: false,
  isPlaneMode: false,
  isLiveMode: true,
};

const mockOrderConfig = { stake: 1000 };

// ─── market mock used in submitOrder tests ────────────────────────────────────

function setupMarketMock(precision = 2, min = 0.01, max = 10_000): jest.Mock {
  const loadMarkets = jest.fn().mockResolvedValue({});
  mockExchangeService.getExchange.mockReturnValue({
    loadMarkets,
    markets: {
      'SOL/USDT': {
        limits: { amount: { min, max } },
        precision: { amount: precision },
      },
    },
  });
  return loadMarkets;
}

// ─── module factory ───────────────────────────────────────────────────────────

async function buildModule(
  modeOverride: ModeConfig = liveModeConfig,
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [ScheduleModule.forRoot()],
    providers: [
      OrderService,
      { provide: OrderRepository, useValue: mockOrderRepository },
      { provide: ExchangeService, useValue: mockExchangeService },
      { provide: PositionRepository, useValue: mockPositionRepository },
      { provide: EventService, useValue: mockEventService },
      { provide: orderConfig.KEY, useValue: mockOrderConfig },
      { provide: modeConfig.KEY, useValue: modeOverride },
    ],
  }).compile();
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe('OrderService', () => {
  let service: OrderService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    mockOrderRepository.findActive.mockResolvedValue([]);
    mockOrderRepository.findActiveByActionId.mockResolvedValue(null);
    mockOrderRepository.create.mockResolvedValue(undefined);
    mockOrderRepository.update.mockResolvedValue(undefined);
    mockPositionRepository.findOpenPosition.mockResolvedValue(null);
    mockPositionRepository.create.mockResolvedValue(undefined);
    mockPositionRepository.closePosition.mockResolvedValue(undefined);
    mockPositionRepository.updatePosition.mockResolvedValue(undefined);

    module = await buildModule();
    await module.init();
    service = module.get<OrderService>(OrderService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── placeOrder ─────────────────────────────────────────────────────────────

  describe('placeOrder', () => {
    it('should skip and log in idle mode', async () => {
      const idleModule = await buildModule({
        isIdleMode: true,
        isPlaneMode: false,
        isLiveMode: false,
      });
      await idleModule.init();
      const idleService = idleModule.get<OrderService>(OrderService);

      await idleService.placeOrder(buildOrder());

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
      await idleModule.close();
    });

    it('should skip and log in plane mode', async () => {
      const planeModule = await buildModule({
        isIdleMode: false,
        isPlaneMode: true,
        isLiveMode: false,
      });
      await planeModule.init();
      const planeService = planeModule.get<OrderService>(OrderService);

      await planeService.placeOrder(buildOrder());

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
      await planeModule.close();
    });

    it('should skip when an active order with the same actionId already exists in DB', async () => {
      mockOrderRepository.findActiveByActionId.mockResolvedValue(
        buildOrder({ status: 'pending' }),
      );

      await service.placeOrder(buildOrder({ actionId: 'rule001-buy' }));

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should skip when the uid is already tracked in memory', async () => {
      // Preload an order in the service memory by having it returned from findActive
      mockOrderRepository.findActive.mockResolvedValue([
        buildOrder({ status: 'pending' }),
      ]);
      const freshModule = await buildModule();
      await freshModule.init();
      const freshService = freshModule.get<OrderService>(OrderService);

      // Mock exchange so submitOrder doesn't blow up (shouldn't be reached anyway)
      mockExchangeService.getBalance.mockResolvedValue({
        USDT: { free: 500, used: 0, total: 500 },
      });
      setupMarketMock();
      mockExchangeService.createLimitOrder.mockResolvedValue(buildCcxtOrder());

      await freshService.placeOrder(buildOrder()); // same uid as preloaded

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
      await freshModule.close();
    });

    it('should save order with status=new and immediately call submitOrder', async () => {
      mockExchangeService.getBalance.mockResolvedValue({
        USDT: { free: 500, used: 0, total: 500 },
      });
      setupMarketMock();
      mockExchangeService.createLimitOrder.mockResolvedValue(buildCcxtOrder());

      await service.placeOrder(buildOrder({ actionId: 'rule001-buy' }));

      // order was persisted before submission
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ placedAt: expect.any(Number) }),
      );
      // submitOrder ran immediately → DB updated with pending + exchange id
      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          externalUid: 'exchange-id-1',
        }),
      );
    });
  });

  // ─── submitOrder ────────────────────────────────────────────────────────────

  describe('submitOrder (via placeOrder in live mode)', () => {
    it('should mark order failed when balance is zero', async () => {
      mockExchangeService.getBalance.mockResolvedValue({
        USDT: { free: 0, used: 0, total: 0 },
      });
      setupMarketMock();

      await service.placeOrder(buildOrder());

      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'Insufficient balance',
        }),
      );
      expect(mockExchangeService.createLimitOrder).not.toHaveBeenCalled();
    });

    it('should place a limit order with correct params', async () => {
      mockExchangeService.getBalance.mockResolvedValue({
        USDT: { free: 500, used: 0, total: 500 },
      });
      setupMarketMock();
      mockExchangeService.createLimitOrder.mockResolvedValue(buildCcxtOrder());

      await service.placeOrder(buildOrder({ type: 'limit', price: '100' }));

      expect(mockExchangeService.createLimitOrder).toHaveBeenCalledWith(
        'binance',
        'SOL/USDT',
        'buy',
        expect.any(Number),
        100,
      );
    });

    it('should place a market order when type is market', async () => {
      mockExchangeService.getBalance.mockResolvedValue({
        USDT: { free: 500, used: 0, total: 500 },
      });
      setupMarketMock();
      mockExchangeService.createMarketOrder.mockResolvedValue(buildCcxtOrder());

      await service.placeOrder(buildOrder({ type: 'market' }));

      expect(mockExchangeService.createMarketOrder).toHaveBeenCalledWith(
        'binance',
        'SOL/USDT',
        'buy',
        expect.any(Number),
      );
    });

    it('should mark order failed and not throw on exchange error', async () => {
      mockExchangeService.getBalance.mockResolvedValue({
        USDT: { free: 500, used: 0, total: 500 },
      });
      setupMarketMock();
      mockExchangeService.createLimitOrder.mockRejectedValue(
        new Error('Exchange unavailable'),
      );

      await expect(service.placeOrder(buildOrder())).resolves.not.toThrow();

      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'Exchange unavailable',
        }),
      );
    });
  });

  // ─── trackOrder ─────────────────────────────────────────────────────────────

  describe('trackOrder', () => {
    const svc = () => service as any;

    it('should return early when order has no externalUid', async () => {
      const order = buildOrder({ status: 'pending', externalUid: undefined });
      await svc().trackOrder(order);
      expect(mockExchangeService.getOrder).not.toHaveBeenCalled();
    });

    it('should mark completed and set completedAt + filledQuantity on closed status', async () => {
      const order = buildOrder({
        status: 'pending',
        externalUid: 'ext-1',
        submittedAt: Date.now(),
      });
      mockExchangeService.getOrder.mockResolvedValue(
        buildCcxtOrder({ status: 'closed', filled: 10 }),
      );

      await svc().trackOrder(order);

      expect(order.status).toBe('completed');
      expect(order.filledQuantity).toBe(10);
      expect(order.completedAt).toBeGreaterThan(0);
      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' }),
      );
    });

    it('should treat filled status same as closed', async () => {
      const order = buildOrder({ status: 'pending', externalUid: 'ext-1' });
      mockExchangeService.getOrder.mockResolvedValue(
        buildCcxtOrder({ status: 'filled', filled: 5 }),
      );

      await svc().trackOrder(order);

      expect(order.status).toBe('completed');
    });

    it('should update filledQuantity on partial fill without completing the order', async () => {
      const order = buildOrder({
        status: 'pending',
        externalUid: 'ext-1',
        filledQuantity: 0,
      });
      mockExchangeService.getOrder.mockResolvedValue(
        buildCcxtOrder({ status: 'open', filled: 3, remaining: 7 }),
      );

      await svc().trackOrder(order);

      expect(order.status).toBe('pending');
      expect(order.filledQuantity).toBe(3);
      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', filledQuantity: 3 }),
      );
    });

    it('should not update DB on partial fill when amount is unchanged', async () => {
      const order = buildOrder({
        status: 'pending',
        externalUid: 'ext-1',
        filledQuantity: 3,
      });
      mockExchangeService.getOrder.mockResolvedValue(
        buildCcxtOrder({ status: 'open', filled: 3, remaining: 7 }),
      );

      await svc().trackOrder(order);

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it.each(['canceled', 'rejected', 'expired'])(
      'should mark cancelled when exchange status is %s',
      async (status) => {
        const order = buildOrder({ status: 'pending', externalUid: 'ext-1' });
        mockExchangeService.getOrder.mockResolvedValue(
          buildCcxtOrder({ status, filled: 0 }),
        );

        await svc().trackOrder(order);

        expect(order.status).toBe('cancelled');
        expect(order.completedAt).toBeGreaterThan(0);
      },
    );

    it('should not throw on exchange error', async () => {
      const order = buildOrder({ status: 'pending', externalUid: 'ext-1' });
      mockExchangeService.getOrder.mockRejectedValue(new Error('timeout'));

      await expect(svc().trackOrder(order)).resolves.not.toThrow();
      expect(order.status).toBe('pending');
    });
  });

  // ─── handleOrderCompletion ───────────────────────────────────────────────────

  describe('handleOrderCompletion', () => {
    const svc = () => service as any;

    it('should create a new position when buy fills and no position exists', async () => {
      mockPositionRepository.findOpenPosition.mockResolvedValue(null);
      const order = buildOrder({ side: 'buy', submittedAt: 1000 });
      const ccxt = buildCcxtOrder({ filled: 10, average: 98 });

      await svc().handleOrderCompletion(order, ccxt);

      expect(mockPositionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pair: 'SOL-USDT',
          side: 'buy',
          quantity: 10,
          averagePrice: 98,
        }),
      );
    });

    it('should update existing position with weighted average price on subsequent buy', async () => {
      mockPositionRepository.findOpenPosition.mockResolvedValue({
        pair: 'SOL-USDT',
        side: 'buy',
        quantity: 10,
        averagePrice: 100,
        isOpen: true,
      });
      const order = buildOrder({ side: 'buy' });
      const ccxt = buildCcxtOrder({ filled: 10, average: 120 });

      await svc().handleOrderCompletion(order, ccxt);

      // (10*100 + 10*120) / 20 = 110
      expect(mockPositionRepository.updatePosition).toHaveBeenCalledWith(
        'SOL-USDT',
        expect.objectContaining({ quantity: 20, averagePrice: 110 }),
      );
    });

    it('should close the position when sell fills all remaining quantity', async () => {
      mockPositionRepository.findOpenPosition.mockResolvedValue({
        pair: 'SOL-USDT',
        side: 'buy',
        quantity: 10,
        isOpen: true,
      });
      const order = buildOrder({ side: 'sell' });
      const ccxt = buildCcxtOrder({ filled: 10 });

      await svc().handleOrderCompletion(order, ccxt);

      expect(mockPositionRepository.closePosition).toHaveBeenCalledWith(
        'SOL-USDT',
        expect.any(Number),
      );
    });

    it('should reduce position quantity when sell is a partial fill', async () => {
      mockPositionRepository.findOpenPosition.mockResolvedValue({
        pair: 'SOL-USDT',
        side: 'buy',
        quantity: 10,
        isOpen: true,
      });
      const order = buildOrder({ side: 'sell' });
      const ccxt = buildCcxtOrder({ filled: 4 });

      await svc().handleOrderCompletion(order, ccxt);

      expect(mockPositionRepository.updatePosition).toHaveBeenCalledWith(
        'SOL-USDT',
        expect.objectContaining({ quantity: 6 }),
      );
      expect(mockPositionRepository.closePosition).not.toHaveBeenCalled();
    });

    it('should not touch position when sell fill amount is zero', async () => {
      mockPositionRepository.findOpenPosition.mockResolvedValue({
        pair: 'SOL-USDT',
        side: 'buy',
        quantity: 10,
        isOpen: true,
      });
      const order = buildOrder({ side: 'sell' });
      const ccxt = buildCcxtOrder({ filled: 0 });

      await svc().handleOrderCompletion(order, ccxt);

      expect(mockPositionRepository.closePosition).not.toHaveBeenCalled();
      expect(mockPositionRepository.updatePosition).not.toHaveBeenCalled();
    });
  });

  // ─── calculateDesiredQuantity ────────────────────────────────────────────────

  describe('calculateDesiredQuantity', () => {
    it('should return the fixed value regardless of side', () => {
      const qty = service.calculateDesiredQuantity(
        { type: 'fixed', value: '5' },
        1000,
        100,
        'buy',
      );
      expect(qty).toBe(5);
    });

    it('should calculate buy percent as (balance / price) * pct', () => {
      // balance=1000 USDT, price=100, 50% → spend 500 USDT → 5 SOL
      const qty = service.calculateDesiredQuantity(
        { type: 'percent', value: '50' },
        1000,
        100,
        'buy',
      );
      expect(qty).toBe(5);
    });

    it('should calculate sell percent directly from base balance', () => {
      // balance=10 SOL, 50% → sell 5 SOL (price is irrelevant)
      const qty = service.calculateDesiredQuantity(
        { type: 'percent', value: '50' },
        10,
        100,
        'sell',
      );
      expect(qty).toBe(5);
    });

    it('should return full balance for 100% sell', () => {
      const qty = service.calculateDesiredQuantity(
        { type: 'percent', value: '100' },
        10,
        100,
        'sell',
      );
      expect(qty).toBe(10);
    });
  });

  // ─── normalizeSymbol ─────────────────────────────────────────────────────────

  describe('normalizeSymbol', () => {
    it('should replace a single dash with a slash', () => {
      expect(service.normalizeSymbol('SOL-USDT')).toBe('SOL/USDT');
    });

    it('should replace all dashes (not just the first)', () => {
      expect(service.normalizeSymbol('BTC-USD-T')).toBe('BTC/USD/T');
    });
  });

  // ─── orderProcessor (cron) ───────────────────────────────────────────────────

  describe('orderProcessor', () => {
    it('should call submitOrder for orders with status=new', async () => {
      mockExchangeService.getBalance.mockResolvedValue({
        USDT: { free: 500, used: 0, total: 500 },
      });
      setupMarketMock();
      mockExchangeService.createLimitOrder.mockResolvedValue(buildCcxtOrder());

      // Preload a 'new' order that survived a hypothetical crash
      (service as any).orders = [buildOrder({ status: 'new' })];

      await service.orderProcessor();

      expect(mockExchangeService.createLimitOrder).toHaveBeenCalled();
    });

    it('should call trackOrder for pending orders when tracking interval has elapsed', async () => {
      const order = buildOrder({ status: 'pending', externalUid: 'ext-1' });
      (service as any).orders = [order];

      mockExchangeService.getOrder.mockResolvedValue(
        buildCcxtOrder({ status: 'open', filled: 0 }),
      );

      await service.orderProcessor();

      expect(mockExchangeService.getOrder).toHaveBeenCalled();
    });

    it('should remove completed orders from memory after the cron cycle', async () => {
      const order = buildOrder({ status: 'pending', externalUid: 'ext-1' });
      (service as any).orders = [order];

      mockExchangeService.getOrder.mockResolvedValue(
        buildCcxtOrder({ status: 'closed', filled: 10 }),
      );

      await service.orderProcessor();

      expect((service as any).orders).toHaveLength(0);
    });

    it('should remove failed orders from memory', async () => {
      const order = buildOrder({ status: 'failed' });
      (service as any).orders = [order];

      await service.orderProcessor();

      expect((service as any).orders).toHaveLength(0);
    });
  });
});
