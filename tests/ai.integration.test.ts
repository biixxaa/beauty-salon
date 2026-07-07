import { describe, it, expect } from 'vitest';
import { createAiResponse, sanitizeAiHistory, sanitizeAiString, MAX_AI_MESSAGE_LENGTH } from '../src/lib/ai';

describe('AI helper validation and recommendation flows', () => {
  it('sanitizes string payloads correctly', () => {
    expect(sanitizeAiString('  hello  ')).toBe('hello');
    expect(sanitizeAiString(123)).toBe('');
    expect(sanitizeAiString('x'.repeat(1200)).length).toBe(1000);
  });

  it('sanitizes history safely', () => {
    const safe = sanitizeAiHistory([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'hacker', content: 'bad' } as any,
    ]);

    expect(safe.length).toBe(2);
    expect(safe[0].role).toBe('user');
    expect(safe[1].role).toBe('assistant');
  });

  it('rejects too-long createAiResponse prompts without API key', async () => {
    const longMessage = 'a'.repeat(MAX_AI_MESSAGE_LENGTH + 1);
    await expect(createAiResponse(longMessage)).rejects.toThrow('Prompt too long');
  });

  it('returns fallback response when openai key is missing', async () => {
    const result = await createAiResponse('Tell me about nail care.');
    expect(result).toContain('not configured');
  });
});
