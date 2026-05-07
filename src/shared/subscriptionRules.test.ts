import { describe, it, expect } from 'vitest';
import { 
  getEffectiveAiTokenLimit, 
  normalizeTier, 
  isTrialActive, 
  AI_TOKEN_LIMITS 
} from './subscriptionRules';

describe('subscriptionRules', () => {
  describe('normalizeTier', () => {
    it('normalizes admin roles to admin', () => {
      expect(normalizeTier({ role: 'admin' })).toBe('admin');
      expect(normalizeTier({ role: 'super_admin' })).toBe('admin');
    });

    it('normalizes specific tier strings', () => {
      expect(normalizeTier({ tier: 'master' })).toBe('master');
      expect(normalizeTier({ tier: 'elite' })).toBe('elite');
      expect(normalizeTier({ subscription_type: '1-month' })).toBe('pro');
      expect(normalizeTier({ subscription_type: 'trial' })).toBe('trial');
      expect(normalizeTier({})).toBe('free');
    });
  });

  describe('isTrialActive', () => {
    it('returns true for active trial', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      expect(isTrialActive({ tier: 'trial', subscription_end_date: future.toISOString() })).toBe(true);
    });

    it('returns false for expired trial', () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect(isTrialActive({ tier: 'trial', subscription_end_date: past.toISOString() })).toBe(false);
    });
  });

  describe('getEffectiveAiTokenLimit', () => {
    it('returns free limit (1000) for standard free user', () => {
      expect(getEffectiveAiTokenLimit({})).toBe(AI_TOKEN_LIMITS.free);
    });

    it('returns trial limit (10000) for active trial', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      expect(getEffectiveAiTokenLimit({ tier: 'trial', subscription_end_date: future.toISOString() })).toBe(AI_TOKEN_LIMITS.trial);
    });

    it('returns free limit (1000) for expired trial', () => {
       const past = new Date();
       past.setDate(past.getDate() - 1);
       expect(getEffectiveAiTokenLimit({ tier: 'trial', subscription_end_date: past.toISOString() })).toBe(AI_TOKEN_LIMITS.free);
    });

    it('returns pro limit (10000) for active pro', () => {
      expect(getEffectiveAiTokenLimit({ tier: 'pro' })).toBe(AI_TOKEN_LIMITS.pro);
    });

    it('returns elite limit (50000) for active elite', () => {
      expect(getEffectiveAiTokenLimit({ tier: 'elite' })).toBe(AI_TOKEN_LIMITS.elite);
    });

    it('returns master limit (100000) for active master', () => {
      expect(getEffectiveAiTokenLimit({ tier: 'master' })).toBe(AI_TOKEN_LIMITS.master);
    });

    it('returns admin limit (1000000) for admin/super_admin', () => {
      expect(getEffectiveAiTokenLimit({ role: 'admin' })).toBe(AI_TOKEN_LIMITS.admin);
      expect(getEffectiveAiTokenLimit({ role: 'super_admin' })).toBe(AI_TOKEN_LIMITS.admin);
    });

    it('respects custom ai_token_limit if positive', () => {
       expect(getEffectiveAiTokenLimit({ tier: 'free', ai_token_limit: 5000 })).toBe(5000);
       expect(getEffectiveAiTokenLimit({ tier: 'pro', ai_token_limit: 15000 })).toBe(15000);
    });

    it('ignores invalid custom ai_token_limit', () => {
       expect(getEffectiveAiTokenLimit({ tier: 'free', ai_token_limit: 0 })).toBe(AI_TOKEN_LIMITS.free);
       expect(getEffectiveAiTokenLimit({ tier: 'free', ai_token_limit: -500 })).toBe(AI_TOKEN_LIMITS.free);
       expect(getEffectiveAiTokenLimit({ tier: 'free', ai_token_limit: 'invalid' })).toBe(AI_TOKEN_LIMITS.free);
    });
  });
});
