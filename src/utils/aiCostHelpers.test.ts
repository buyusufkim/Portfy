import { describe, it, expect } from 'vitest';
import { 
  estimateGemini25FlashCostTRY, 
  estimateTokenCostTRY, 
  featureKeyToLabel, 
  formatTRY, 
  formatToken 
} from './aiCostHelpers';

describe('aiCostHelpers', () => {
  it('should return 0 TL for 0 tokens', () => {
    expect(estimateGemini25FlashCostTRY(0, 0)).toBe(0);
  });

  it('should calculate correct cost with prompt and completion tokens', () => {
    // 1M prompt -> $0.30 -> 15 TL
    // 1M completion -> $2.50 -> 125 TL
    expect(estimateGemini25FlashCostTRY(1_000_000, 1_000_000)).toBe(140);
  });

  it('should calculate correct basic cost using fallback', () => {
    // 1M total -> 750k prompt, 250k completion
    // 750k prompt -> $0.225 -> 11.25 TL
    // 250k completion -> $0.625 -> 31.25 TL
    // Total: 42.5 TL
    expect(estimateTokenCostTRY(1_000_000)).toBeCloseTo(42.5);
  });

  it('should return correct feature label', () => {
    expect(featureKeyToLabel('dashboard_coach')).toBe('Dashboard AI Koç');
    expect(featureKeyToLabel('unknown_key')).toBe('unknown_key');
    expect(featureKeyToLabel(null)).toBe('Bilinmiyor');
  });

  it('should format TRY correctly', () => {
    expect(formatTRY(140).replace(/\s/g, ' ')).toMatch(/140,00 ₺|₺140.00/);
  });

  it('should format Token correctly', () => {
    expect(formatToken(1000000)).toBe('1.000.000');
  });
});
