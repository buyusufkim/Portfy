import { describe, it, expect } from 'vitest';
import { calculateContentTextLength, normalizeAiUsage } from './ai-api';
import { getFeatureConfig } from './ai-features';

describe('normalizeAiUsage', () => {
  it('handles empty usage', () => {
    expect(normalizeAiUsage(null)).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    expect(normalizeAiUsage({})).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  });

  it('reads totalTokenCount for Gemini', () => {
    const usage = { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 };
    expect(normalizeAiUsage(usage)).toEqual({ promptTokens: 10, completionTokens: 20, totalTokens: 30 });
  });

  it('reads OpenAI style snake_case tokens', () => {
    const usage = { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 };
    expect(normalizeAiUsage(usage)).toEqual({ promptTokens: 15, completionTokens: 25, totalTokens: 40 });
  });

  it('calculates totalTokens if missing', () => {
    const usage = { prompt_tokens: 10, completion_tokens: 20 };
    expect(normalizeAiUsage(usage)).toEqual({ promptTokens: 10, completionTokens: 20, totalTokens: 30 });
  });
});

describe('calculateContentTextLength', () => {
  it('calculates length for a simple string', () => {
    expect(calculateContentTextLength('hello world')).toBe(11);
  });

  it('calculates length for parts array', () => {
    const input = [
      {
        role: "user",
        parts: [
          { text: "test" },
          { text: " example" }
        ]
      }
    ];
    // "test" (4) + " example" (8) = 12
    expect(calculateContentTextLength(input)).toBe(12);
  });

  it('calculates length for base64 inline data appropriately', () => {
    const input = [
      {
        role: "user",
        parts: [
          { inlineData: { data: "YWJj", mimeType: "image/png" } }
        ]
      }
    ];
    // "YWJj" is 4 characters
    expect(calculateContentTextLength(input)).toBe(4);
  });

  it('returns 0 for invalid or empty input', () => {
    expect(calculateContentTextLength(null)).toBe(0);
    expect(calculateContentTextLength(undefined)).toBe(0);
    expect(calculateContentTextLength([])).toBe(0);
    expect(calculateContentTextLength({})).toBe(0);
  });
});

describe('getFeatureConfig', () => {
  it('throws error when no key provided', () => {
    expect(() => getFeatureConfig()).toThrow("AI featureKey zorunludur.");
  });

  it('throws error for invalid key', () => {
    expect(() => getFeatureConfig('invalid_random_key_12345')).toThrow();
  });

  it('returns generic_safe_json when explicitly requested', () => {
    const config = getFeatureConfig('generic_safe_json');
    expect(config.allowClientSystemInstruction).toBe(false);
    expect(config.allowClientResponseSchema).toBe(false);
    expect(config.maxInputChars).toBe(100000);
  });

  it('returns specific config for ai_coach', () => {
    const config = getFeatureConfig('ai_coach');
    expect(config.allowClientSystemInstruction).toBe(false);
  });

  it('returns specific config for property_marketing_content', () => {
    const config = getFeatureConfig('property_marketing_content');
    expect(config.allowClientSystemInstruction).toBe(false);
    expect(config.allowClientResponseSchema).toBe(false);
    expect(config.defaultModel).toBe("gemini-2.5-flash");
    expect(config.maxInputChars).toBe(12000);
  });
});
