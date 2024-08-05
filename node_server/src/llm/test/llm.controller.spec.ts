import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from '../llm.controller';
import { LlmService } from '../llm.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('LlmController', () => {
  let controller: LlmController;
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [
        {
          provide: LlmService,
          useValue: {
            createSession: jest.fn(),
            createConversation: jest.fn(),
            query: jest.fn(),
            switchModel: jest.fn(),
            getConversationHistory: jest.fn(),
            getConversations: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LlmController>(LlmController);
    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const sessionId = 'unique-session-id';
      jest.spyOn(service, 'createSession').mockResolvedValue(sessionId);

      const result = await controller.createSession({ model_name: 'llama2' });
      expect(result).toEqual({ sessionId });
    });

    it('should throw BadRequestException if service throws BadRequestException', async () => {
      jest
        .spyOn(service, 'createSession')
        .mockRejectedValue(new BadRequestException());

      await expect(
        controller.createSession({ model_name: 'llama2' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException if service throws InternalServerErrorException', async () => {
      jest
        .spyOn(service, 'createSession')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(
        controller.createSession({ model_name: 'llama2' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createConversation', () => {
    it('should create a conversation successfully', async () => {
      const conversationId = 'unique-conversation-id';
      jest
        .spyOn(service, 'createConversation')
        .mockResolvedValue(conversationId);

      const result = await controller.createConversation('unique-session-id');
      expect(result).toEqual({ conversationId });
    });

    it('should throw BadRequestException if service throws BadRequestException', async () => {
      jest
        .spyOn(service, 'createConversation')
        .mockRejectedValue(new BadRequestException());

      await expect(
        controller.createConversation('unique-session-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      jest
        .spyOn(service, 'createConversation')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.createConversation('unique-session-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if service throws InternalServerErrorException', async () => {
      jest
        .spyOn(service, 'createConversation')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(
        controller.createConversation('unique-session-id'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('query', () => {
    it('should process query successfully', async () => {
      const response = 'model-response';
      jest.spyOn(service, 'query').mockResolvedValue(response);

      const result = await controller.query(
        'unique-session-id',
        'unique-conversation-id',
        { query: 'your-query' },
      );
      expect(result).toEqual({ response });
    });

    it('should throw BadRequestException if service throws BadRequestException', async () => {
      jest.spyOn(service, 'query').mockRejectedValue(new BadRequestException());

      await expect(
        controller.query('unique-session-id', 'unique-conversation-id', {
          query: 'your-query',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      jest.spyOn(service, 'query').mockRejectedValue(new NotFoundException());

      await expect(
        controller.query('unique-session-id', 'unique-conversation-id', {
          query: 'your-query',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if service throws InternalServerErrorException', async () => {
      jest
        .spyOn(service, 'query')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(
        controller.query('unique-session-id', 'unique-conversation-id', {
          query: 'your-query',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('switchModel', () => {
    it('should switch model successfully', async () => {
      jest.spyOn(service, 'switchModel').mockResolvedValue(undefined);

      const result = await controller.switchModel('unique-session-id', {
        model_name: 'new-model-name',
      });
      expect(result).toEqual({ message: 'Model switched successfully' });
    });

    it('should throw BadRequestException if service throws BadRequestException', async () => {
      jest
        .spyOn(service, 'switchModel')
        .mockRejectedValue(new BadRequestException());

      await expect(
        controller.switchModel('unique-session-id', {
          model_name: 'new-model-name',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      jest
        .spyOn(service, 'switchModel')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.switchModel('unique-session-id', {
          model_name: 'new-model-name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if service throws InternalServerErrorException', async () => {
      jest
        .spyOn(service, 'switchModel')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(
        controller.switchModel('unique-session-id', {
          model_name: 'new-model-name',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history successfully', async () => {
      const history = [{ role: 'user', content: 'your-query' }];
      jest.spyOn(service, 'getConversationHistory').mockResolvedValue(history);

      const result = await controller.getConversationHistory(
        'unique-session-id',
        'unique-conversation-id',
      );
      expect(result).toEqual(history);
    });

    it('should throw BadRequestException if service throws BadRequestException', async () => {
      jest
        .spyOn(service, 'getConversationHistory')
        .mockRejectedValue(new BadRequestException());

      await expect(
        controller.getConversationHistory(
          'unique-session-id',
          'unique-conversation-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      jest
        .spyOn(service, 'getConversationHistory')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.getConversationHistory(
          'unique-session-id',
          'unique-conversation-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if service throws InternalServerErrorException', async () => {
      jest
        .spyOn(service, 'getConversationHistory')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(
        controller.getConversationHistory(
          'unique-session-id',
          'unique-conversation-id',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getConversations', () => {
    it('should retrieve conversations successfully', async () => {
      const conversations = ['conversation-id-1', 'conversation-id-2'];
      jest.spyOn(service, 'getConversations').mockResolvedValue(conversations);

      const result = await controller.getConversations('unique-session-id');
      expect(result).toEqual(conversations);
    });

    it('should throw BadRequestException if service throws BadRequestException', async () => {
      jest
        .spyOn(service, 'getConversations')
        .mockRejectedValue(new BadRequestException());

      await expect(
        controller.getConversations('unique-session-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      jest
        .spyOn(service, 'getConversations')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.getConversations('unique-session-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if service throws InternalServerErrorException', async () => {
      jest
        .spyOn(service, 'getConversations')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(
        controller.getConversations('unique-session-id'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
