import { describe, it, expect } from 'vitest';
import { isAdminRole } from './types';

describe('isAdminRole', () => {
  it('returns true for admin or super_admin', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('super_admin')).toBe(true);
  });

  it('returns false for agent or other roles', () => {
    expect(isAdminRole('agent')).toBe(false);
    expect(isAdminRole('user')).toBe(false);
    expect(isAdminRole('')).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});
