import { describe, it, expect } from 'vitest';
import { featureKeyToLabel, shortRequestId } from './aiHelpers';

describe('aiHelpers', () => {
  describe('featureKeyToLabel', () => {
    it('returns default for null/undefined/empty', () => {
      expect(featureKeyToLabel(null)).toBe('Bilinmeyen İşlem');
      expect(featureKeyToLabel(undefined)).toBe('Bilinmeyen İşlem');
      expect(featureKeyToLabel('')).toBe('Bilinmeyen İşlem');
    });

    it('maps known keys', () => {
      expect(featureKeyToLabel('ai_coach')).toBe('AI Koç');
      expect(featureKeyToLabel('whatsapp_analysis')).toBe('WhatsApp Analizi');
    });

    it('returns generic for unknown key', () => {
      expect(featureKeyToLabel('some_random_key')).toBe('AI İşlemi');
    });
  });

  describe('shortRequestId', () => {
    it('returns empty string for null/undefined', () => {
      expect(shortRequestId(null)).toBe('');
      expect(shortRequestId(undefined)).toBe('');
    });

    it('shortens string to 8 characters', () => {
      expect(shortRequestId('req-1234567890abcdef')).toBe('req-1234');
      expect(shortRequestId('123')).toBe('123');
    });
  });
});
