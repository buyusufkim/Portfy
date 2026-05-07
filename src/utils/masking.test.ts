import { describe, it, expect } from 'vitest';
import { maskPhone, maskEmail, maskSensitiveText } from './masking';

describe('masking utils', () => {
  describe('maskPhone', () => {
    it('masks standard Turkish phone with leading 0', () => {
      expect(maskPhone('05321234567')).toBe('0532 *** ** 67');
    });

    it('masks standard Turkish phone with +90', () => {
      expect(maskPhone('+905321234567')).toBe('+90 0532 *** ** 67');
    });

    it('masks standard Turkish phone without 0', () => {
      expect(maskPhone('5321234567')).toBe('0532 *** ** 67');
    });

    it('handles short phones safely', () => {
      expect(maskPhone('12')).toBe('***');
      expect(maskPhone('1234')).toBe('12***4');
    });

    it('handles empty/undefined inputs safely', () => {
      expect(maskPhone('')).toBe('');
      expect(maskPhone(null)).toBe('');
      expect(maskPhone(undefined)).toBe('');
    });
  });

  describe('maskEmail', () => {
    it('masks standard email', () => {
      expect(maskEmail('yusuf@example.com')).toBe('yu***@example.com');
      expect(maskEmail('john.doe@gmail.com')).toBe('jo***@gmail.com');
    });

    it('handles short local parts', () => {
      expect(maskEmail('a@example.com')).toBe('***@example.com');
      expect(maskEmail('ab@example.com')).toBe('***@example.com');
    });

    it('handles invalid format safely', () => {
      expect(maskEmail('notanemail')).toBe('***');
    });

    it('handles empty/undefined inputs safely', () => {
      expect(maskEmail('')).toBe('');
      expect(maskEmail(null)).toBe('');
      expect(maskEmail(undefined)).toBe('');
    });
  });

  describe('maskSensitiveText', () => {
    it('masks generic text', () => {
      expect(maskSensitiveText('SecretData')).toBe('Se***');
      expect(maskSensitiveText('123')).toBe('***');
    });

    it('handles empty/undefined inputs safely', () => {
      expect(maskSensitiveText('')).toBe('');
      expect(maskSensitiveText(null)).toBe('');
      expect(maskSensitiveText(undefined)).toBe('');
    });
  });
});
