import { Test, TestingModule } from '@nestjs/testing';
import { LlmModule } from '../llm.module';
import { LlmService } from '../llm.service';
import { LlmController } from '../llm.controller';
import { ConfigService } from '@nestjs/config';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';

const mockRedis = {
  quit: jest.fn(),
};

describe('LlmModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        LlmModule,
        RedisModule.forRoot({
          url: 'redis://localhost:6379',
          type: 'single',
        }),
      ],
      providers: [
        {
          provide: `default_IORedisModuleConnectionToken`,
          useValue: mockRedis,
        },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          switch (key) {
            case 'REDIS_HOST':
              return 'localhost';
            case 'REDIS_PORT':
              return 6379;
            default:
              return null;
          }
        }),
      })
      .compile();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await mockRedis.quit();
  });

  it('should be defined', () => {
    const llmModule = module.get<LlmModule>(LlmModule);
    expect(llmModule).toBeDefined();
  });

  it('should have LlmService', () => {
    const llmService = module.get<LlmService>(LlmService);
    expect(llmService).toBeDefined();
  });

  it('should have LlmController', () => {
    const llmController = module.get<LlmController>(LlmController);
    expect(llmController).toBeDefined();
  });

  it('should configure RedisModule with correct options', async () => {
    const configService = module.get<ConfigService>(ConfigService);
    const redisOptions: RedisModuleOptions = {
      type: 'single',
      options: {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      },
    };

    expect(redisOptions).toEqual({
      type: 'single',
      options: {
        host: 'localhost',
        port: 6379,
      },
    });
  });
});
