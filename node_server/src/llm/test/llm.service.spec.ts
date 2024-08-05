import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from '../llm.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import {
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  zadd: jest.fn(),
  zrevrange: jest.fn(),
  on: jest.fn(),
  quit: jest.fn(),
};

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot({
          url: 'redis://localhost:6379',
          type: 'single',
          options: {
            password: "admin"
          }
        }),
      ],
      providers: [
        LlmService,
        {
          provide: `default_IORedisModuleConnectionToken`,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await mockRedis.quit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });
      const sessionId = await service.createSession('llama2');
      expect(sessionId).toBeDefined();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if axios request fails', async () => {
      mockedAxios.post.mockRejectedValue({ error: "Error" });
      await expect(service.createSession('llama2')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createConversation', () => {
    it('should create a conversation successfully', async () => {
      const sessionId = 'valid-session-id';
      mockRedis.sadd.mockResolvedValue(1);
      const conversationId = await service.createConversation(sessionId);
      expect(conversationId).toBeDefined();
      expect(mockRedis.sadd).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if redis command fails', async () => {
      const sessionId = 'valid-session-id';
      mockRedis.sadd.mockRejectedValue(new Error('Redis error'));
      await expect(service.createConversation(sessionId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('query', () => {
    it('should throw InternalServerErrorException if session ID is invalid', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(
        service.query('invalid-session-id', 'conversation-id', 'query'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should process query successfully', async () => {
      const sessionId = 'valid-session-id';
      const conversationId = 'valid-conversation-id';
      mockRedis.get.mockResolvedValue('llama2');
      mockRedis.zrevrange.mockResolvedValue([]);
      mockedAxios.post.mockResolvedValue({
        data: { response: 'Test response' },
      });

      const response = await service.query(
        sessionId,
        conversationId,
        'What is the capital of France?',
      );
      expect(response).toBe('Test response');
      expect(mockRedis.zadd).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if axios request fails', async () => {
      const sessionId = 'valid-session-id';
      const conversationId = 'valid-conversation-id';
      mockRedis.get.mockResolvedValue('llama2');
      mockRedis.zrevrange.mockResolvedValue([]);
      mockedAxios.post.mockRejectedValue(new InternalServerErrorException('Axios error'));

      await expect(
        service.query(
          sessionId,
          conversationId,
          'What is the capital of France?',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('switchModel', () => {
    it('should throw NotFoundException if session ID is invalid', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(
        service.switchModel('invalid-session-id', 'new-model'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should switch model successfully', async () => {
      const sessionId = 'valid-session-id';
      const newModelName = 'new-model';
      mockRedis.get.mockResolvedValue('old-model');
      mockRedis.set.mockResolvedValue('OK');
      mockedAxios.post.mockResolvedValue({ data: {} });

      await expect(
        service.switchModel(sessionId, newModelName),
      ).resolves.toBeUndefined();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if axios request fails', async () => {
      const sessionId = 'valid-session-id';
      const newModelName = 'new-model';
      mockRedis.get.mockResolvedValue('old-model');
      mockRedis.set.mockResolvedValue('OK');
      mockedAxios.post.mockRejectedValue(new Error('Axios error'));

      await expect(
        service.switchModel(sessionId, newModelName),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getConversations', () => {
    it('should retrieve conversations successfully', async () => {
      const sessionId = 'valid-session-id';
      const conversations = ['conversation-id-1', 'conversation-id-2'];
      mockRedis.smembers.mockResolvedValue(conversations);

      const result = await service.getConversations(sessionId);
      expect(result).toEqual(conversations);
      expect(mockRedis.smembers).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if redis command fails', async () => {
      const sessionId = 'valid-session-id';
      mockRedis.smembers.mockRejectedValue(new Error('Redis error'));

      await expect(service.getConversations(sessionId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history successfully', async () => {
      const sessionId = 'valid-session-id';
      const conversationId = 'valid-conversation-id';
      const history = [
        JSON.stringify({
          role: 'user',
          content: 'What is the capital of France?',
        }),
        JSON.stringify({
          role: 'bot',
          content: 'The capital of France is Paris.',
        }),
      ];
      mockRedis.zrevrange.mockResolvedValue(history);

      const result = await service.getConversationHistory(
        sessionId,
        conversationId,
      );
      expect(result).toEqual([
        { role: 'user', content: 'What is the capital of France?' },
        { role: 'bot', content: 'The capital of France is Paris.' },
      ]);
      expect(mockRedis.zrevrange).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if redis command fails', async () => {
      const sessionId = 'valid-session-id';
      const conversationId = 'valid-conversation-id';
      mockRedis.zrevrange.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.getConversationHistory(sessionId, conversationId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
