import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import * as uuid from 'uuid';
import axios from 'axios';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly pythonServerUrl = process.env.PYTHON_SERVER;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async createSession(modelName: string): Promise<string> {
    try {
      const sessionId = uuid.v4();
      await this.redis.set(`session:${sessionId}:model_name`, modelName);
      this.logger.log(`Session ${sessionId} created for model ${modelName}.`);

      // Notify Python server about the new session
      const response = await axios.post(
        `${this.pythonServerUrl}/select_model`,
        { model: modelName },
      );

      if (response.data.error) {
        throw new InternalServerErrorException(response.data.error);
      }

      return sessionId;
    } catch (error) {
      this.logger.error(
        `Failed to create session for model ${modelName}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to create session.');
    }
  }

  async createConversation(sessionId: string): Promise<string> {
    try {
      const conversationId = uuid.v4();
      await this.redis.sadd(
        `session:${sessionId}:conversations`,
        conversationId,
      );
      this.logger.log(
        `Conversation ${conversationId} created for session ${sessionId}.`,
      );
      return conversationId;
    } catch (error) {
      this.logger.error(
        `Failed to create conversation for session ${sessionId}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to create conversation.');
    }
  }

  async query(
    sessionId: string,
    conversationId: string,
    userQuery: string,
  ): Promise<string> {
    try {
      const modelName = await this.redis.get(`session:${sessionId}:model_name`);
      if (!modelName) {
        throw new NotFoundException(`Invalid session ID ${sessionId}.`);
      }

      // Get the conversation history
      const history = await this.getConversationHistory(
        sessionId,
        conversationId,
      );

      // Prepare the context for the current query
      const context = history
        .map((entry) => `${entry.role}: ${entry.content}`)
        .join('\n');
      const inputWithContext = `${context}\nuser: ${userQuery}`;

      const response = await axios.post(`${this.pythonServerUrl}/query`, {
        query: inputWithContext,
        model: modelName,
        max_length: 8000,
      });

      if (response.data.error) {
        throw new InternalServerErrorException(response.data.error);
      }

      const botResponseLines: string[] =
        response.data.response.split('\nbot: ');
      const botResponse: string =
        botResponseLines[botResponseLines.length - 1].trim();
      let resultLines = botResponse.split('assistant: ');
      if (botResponse.includes('\nassistant: ')) {
        resultLines = botResponse.split('\nassistant: ');
      }
      const result = resultLines[resultLines.length - 1].trim();
      const timestamp = Date.now();
      await this.redis.zadd(
        `session:${sessionId}:conversation:${conversationId}:history`,
        timestamp,
        JSON.stringify({ role: 'user', content: userQuery }),
      );
      await this.redis.zadd(
        `session:${sessionId}:conversation:${conversationId}:history`,
        timestamp,
        JSON.stringify({ role: 'bot', content: result }),
      );
      this.logger.log(
        `Conversation is ongoing for conversation ${conversationId} & session ${sessionId}.`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process query for session ${sessionId} and conversation ${conversationId}: ${error.message}`,
      );
      if (error.response) {
        throw new InternalServerErrorException(error.response.data?.error);
      }
      throw error;
    }
  }

  async switchModel(sessionId: string, newModelName: string): Promise<void> {
    try {
      const modelName = await this.redis.get(`session:${sessionId}:model_name`);
      if (!modelName) {
        throw new NotFoundException(`Invalid session ID ${sessionId}.`);
      }

      // Update the session with the new model name
      await this.redis.set(`session:${sessionId}:model_name`, newModelName);
      this.logger.log(
        `Model for session ${sessionId} switched to ${newModelName}.`,
      );

      // Notify Python server about the model switch
      const response = await axios.post(
        `${this.pythonServerUrl}/select_model`,
        { model_name: newModelName },
      );

      if (response.data.error) {
        throw new InternalServerErrorException(response.data.error);
      }
    } catch (error) {
      this.logger.error(
        `Failed to switch model for session ${sessionId} to ${newModelName}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to switch model.');
    }
  }

  async getConversations(sessionId: string): Promise<string[]> {
    try {
      return await this.redis.smembers(`session:${sessionId}:conversations`);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve conversations for session ${sessionId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve conversations.',
      );
    }
  }

  async getConversationHistory(
    sessionId: string,
    conversationId: string,
  ): Promise<{ role: string; content: string }[]> {
    try {
      const history = await this.redis.zrevrange(
        `session:${sessionId}:conversation:${conversationId}:history`,
        0,
        -1,
      );
      const uniqueHistory = [
        ...new Map(
          history.map((item) => [JSON.parse(item).content, item]),
        ).values(),
      ];
      return uniqueHistory
        .map((entry) => JSON.parse(entry))
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve conversation history for session ${sessionId} and conversation ${conversationId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve conversation history.',
      );
    }
  }
}
