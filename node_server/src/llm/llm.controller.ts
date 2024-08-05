import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Param,
  Get,
} from '@nestjs/common';
import { LlmService } from './llm.service';
import { CreateSessionDto, QueryDto, SwitchModelDto } from './llm.dto';
import {
  ValidateUUIDPipe,
} from '../common/pipes/param-validator.pipe';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('sessions')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<{ sessionId: string }> {
    try {
      const sessionId = await this.llmService.createSession(
        createSessionDto.model_name,
      );
      return { sessionId };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to create session.');
    }
  }

  @Post('sessions/:sessionId/conversations')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createConversation(
    @Param('sessionId', ValidateUUIDPipe) sessionId: string,
  ): Promise<{ conversationId: string }> {
    try {
      const conversationId =
        await this.llmService.createConversation(sessionId);
      return { conversationId };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException('Failed to create conversation.');
    }
  }

  @Post('sessions/:sessionId/conversations/:conversationId/query')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async query(
    @Param('sessionId', ValidateUUIDPipe) sessionId: string,
    @Param('conversationId', ValidateUUIDPipe) conversationId: string,
    @Body() queryDto: QueryDto,
  ): Promise<{ response: string }> {
    try {
      const response = await this.llmService.query(
        sessionId,
        conversationId,
        queryDto.query,
      );
      return { response };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw new InternalServerErrorException('Failed to process query.');
    }
  }

  @Get('sessions/:sessionId/conversations/:conversationId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getConversationHistory(
    @Param('sessionId', ValidateUUIDPipe) sessionId: string,
    @Param('conversationId', ValidateUUIDPipe) conversationId: string,
  ): Promise<{ role: string; content: string }[]> {
    try {
      return await this.llmService.getConversationHistory(
        sessionId,
        conversationId,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException(
        'Failed to retrieve conversation history.',
      );
    }
  }

  @Post('sessions/:sessionId/switch-model')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async switchModel(
    @Param('sessionId', ValidateUUIDPipe)
    sessionId: string,
    @Body() switchModelDto: SwitchModelDto,
  ): Promise<{ message: string }> {
    try {
      await this.llmService.switchModel(sessionId, switchModelDto.model_name);
      return { message: 'Model switched successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw new InternalServerErrorException('Failed to switch model.');
    }
  }

  @Get('sessions/:sessionId/conversations')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getConversations(
    @Param('sessionId', ValidateUUIDPipe) sessionId: string,
  ): Promise<string[]> {
    try {
      return await this.llmService.getConversations(sessionId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException(
        'Failed to retrieve conversations.',
      );
    }
  }
}
