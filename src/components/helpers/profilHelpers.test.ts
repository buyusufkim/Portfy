import { describe, it, expect } from 'vitest';
import { calculateProfileCompletionScore } from './profilHelpers';

describe('calculateProfileCompletionScore', () => {
  it('calculates 0 score for empty profile', () => {
    const { clampedScore, scoreMessage } = calculateProfileCompletionScore({ expertise_areas: [] }, null, null);
    expect(clampedScore).toBe(0);
    expect(scoreMessage).toBe("Profilini tamamla, Portfy seni daha iyi yönlendirsin.");
  });

  it('calculates 100 max score and correct message', () => {
    const { clampedScore, scoreMessage } = calculateProfileCompletionScore(
      { 
        display_name: 'Test', 
        phone: '123', 
        bio: 'bio', 
        city: 'ist', 
        company_name: 'test', 
        expertise_areas: ['test'] 
      }, 
      { region: { city: 'ist', district: '', neighborhoods: [] } }, 
      { id: '1' }
    );
    expect(clampedScore).toBe(100);
    expect(scoreMessage).toBe("Profil güçlü görünüyor.");
  });

  it('calculates mid score and correct message', () => {
    const { clampedScore, scoreMessage } = calculateProfileCompletionScore(
      { 
        display_name: 'Test', 
        phone: '123', 
        bio: 'bio', 
        company_name: 'test', 
        expertise_areas: [] 
      }, 
      null, 
      { id: '1' }
    );
    expect(clampedScore).toBe(60);
    expect(scoreMessage).toBe("İyi gidiyorsun, birkaç bilgi daha ekle.");
  });
});
