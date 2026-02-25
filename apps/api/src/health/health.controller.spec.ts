import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthController } from '@/health/health.controller';
import { DatabaseHealthIndicator } from '@/health/database.health';

describe('HealthController', () => {
  let healthController: HealthController;

  const mockResult: HealthCheckResult = {
    status: 'ok',
    info: { database: { status: 'up' } },
    error: {},
    details: { database: { status: 'up' } },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest
              .fn<() => Promise<HealthCheckResult>>()
              .mockResolvedValue(mockResult),
          },
        },
        {
          provide: DatabaseHealthIndicator,
          useValue: {
            isHealthy: jest
              .fn<() => Promise<{ database: { status: string } }>>()
              .mockResolvedValue({ database: { status: 'up' } }),
          },
        },
      ],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('health', () => {
    it('should return healthy status', async () => {
      const result = await healthController.check();

      expect(result.status).toBe('ok');
      expect(result.info?.database?.status).toBe('up');
    });
  });
});
