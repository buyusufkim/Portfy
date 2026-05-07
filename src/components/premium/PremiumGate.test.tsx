import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PremiumGate } from './PremiumGate';
import * as useFeatureAccessHook from '../../hooks/useFeatureAccess';

interface MockComponentProps {
  onUpgrade?: () => void;
  isOpen?: boolean;
}

// Mock the child components to avoid complex renders
vi.mock('./LockedOverlay', () => ({
  LockedOverlay: ({ onUpgrade }: MockComponentProps) => <div data-testid="locked-overlay" onClick={onUpgrade}>Locked</div>
}));

vi.mock('./UpgradeModal', () => ({
  UpgradeModal: ({ isOpen }: MockComponentProps) => isOpen ? <div data-testid="upgrade-modal">Modal</div> : null
}));

type UseFeatureAccessReturn = ReturnType<typeof useFeatureAccessHook.useFeatureAccess>;

const createMockFeatureAccess = (overrides?: Partial<UseFeatureAccessReturn>): UseFeatureAccessReturn => ({
  hasAccess: () => true,
  subscribe: vi.fn(),
  userTier: 'free',
  getFeatureConfig: vi.fn(),
  isFree: true,
  isPro: false,
  isElite: false,
  isMaster: false,
  ...overrides,
});

describe('PremiumGate', () => {
  it('renders children when user has access', () => {
    vi.spyOn(useFeatureAccessHook, 'useFeatureAccess').mockReturnValue(createMockFeatureAccess({
      hasAccess: () => true,
      userTier: 'pro',
      isFree: false,
      isPro: true,
    }));

    render(
      <PremiumGate featureKey="ai_coach">
        <div data-testid="premium-content">Secret Content</div>
      </PremiumGate>
    );

    expect(screen.getByTestId('premium-content')).toBeInTheDocument();
    expect(screen.queryByTestId('locked-overlay')).not.toBeInTheDocument();
  });

  it('renders locked overlay when user lacks access and showOverlay = true', () => {
    vi.spyOn(useFeatureAccessHook, 'useFeatureAccess').mockReturnValue(createMockFeatureAccess({
      hasAccess: () => false,
      userTier: 'free',
      isFree: true,
      isPro: false,
    }));

    render(
      <PremiumGate featureKey="ai_coach" showOverlay={true}>
        <div data-testid="premium-content">Secret Content</div>
      </PremiumGate>
    );

    expect(screen.getByTestId('locked-overlay')).toBeInTheDocument();
  });

  it('renders fallback when user lacks access and showOverlay = false', () => {
    vi.spyOn(useFeatureAccessHook, 'useFeatureAccess').mockReturnValue(createMockFeatureAccess({
      hasAccess: () => false,
      userTier: 'free',
      isFree: true,
      isPro: false,
    }));

    render(
      <PremiumGate featureKey="ai_coach" showOverlay={false} fallback={<div data-testid="fallback">Fallback</div>}>
        <div data-testid="premium-content">Secret Content</div>
      </PremiumGate>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('locked-overlay')).not.toBeInTheDocument();
  });
});
