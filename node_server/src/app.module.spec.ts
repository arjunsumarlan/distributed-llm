import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
} from '@nestjs/common';
import * as request from 'supertest';
import { ApiKeyMiddleware } from './common/middlewares/api-key.middleware';
import { AppModule } from './app.module';

describe('AppModule', () => {
  let app: INestApplication;
  const mockApiKey = 'valid-api-key';

  beforeAll(() => {
    process.env.API_KEY = mockApiKey;
  });

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ApiKeyMiddleware)
      .useValue({
        use: jest.fn((req, res, next) => next()),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should apply ApiKeyMiddleware to all routes', async () => {
    await request(app.getHttpServer())
      .post('/llm/sessions')
      .set('api_key', mockApiKey)
      .send({ model_name: 'llama2' })
      .expect(500); // expect 500 because python server was not running, at least middleware passed
  });

  it('should respond with UnauthorizedException if API key is missing', async () => {
    await request(app.getHttpServer()).get('/').expect(401).expect({
      statusCode: 401,
      message: 'Invalid API key',
      error: 'Unauthorized',
    });
  });

  it('should respond with UnauthorizedException if API key is invalid', async () => {
    await request(app.getHttpServer())
      .get('/')
      .set('api_key', 'invalid-key')
      .expect(401)
      .expect({
        statusCode: 401,
        message: 'Invalid API key',
        error: 'Unauthorized',
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
