import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

function app() {
  const instance = express();
  instance.use(express.json());
  // 라우터는 모듈 로드 시 GoogleGenAI를 참조하므로 mock 이후에 불러온다.
  return import('./ai').then(({ aiRouter }) => {
    instance.use('/api', aiRouter);
    return instance;
  });
}

describe('aiRouter', () => {
  beforeEach(() => {
    generateContent.mockReset();
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prompt가 없으면 400을 준다', async () => {
    const res = await request(await app()).post('/api/ai-squad-assistant').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Prompt');
  });

  it('GEMINI_API_KEY가 없으면 고정 조언으로 폴백한다 (항상 200)', async () => {
    const res = await request(await app())
      .post('/api/ai-squad-assistant')
      .send({ prompt: '스쿼드 조언' });

    expect(res.status).toBe(200);
    expect(res.body.advice).toBeTruthy();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('키가 있으면 Gemini 응답을 전달한다', async () => {
    process.env.GEMINI_API_KEY = 'gemini_key';
    generateContent.mockResolvedValue({ text: '측면 자원을 보강하세요.' });

    const res = await request(await app())
      .post('/api/ai-squad-assistant')
      .send({ prompt: '스쿼드 조언' });

    expect(res.status).toBe(200);
    expect(res.body.advice).toBe('측면 자원을 보강하세요.');
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-flash' })
    );
  });

  it('Gemini 호출이 실패해도 200과 폴백 조언을 준다', async () => {
    process.env.GEMINI_API_KEY = 'gemini_key';
    generateContent.mockRejectedValue(new Error('quota exceeded'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(await app())
      .post('/api/ai-squad-assistant')
      .send({ prompt: '스쿼드 조언' });

    expect(res.status).toBe(200);
    expect(res.body.advice).toBeTruthy();
  });

  it('응답 텍스트가 비면 기본 문구로 채운다', async () => {
    process.env.GEMINI_API_KEY = 'gemini_key';
    generateContent.mockResolvedValue({ text: '' });

    const res = await request(await app())
      .post('/api/ai-squad-assistant')
      .send({ prompt: '조언' });

    expect(res.body.advice).toBeTruthy();
  });
});
