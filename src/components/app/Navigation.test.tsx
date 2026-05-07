import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DesktopSidebar, MobileNav } from './Navigation';
import { UserProfile } from '../../types';

// Mock PortfyLogo so we don't have to deal with missing SVG
vi.mock('../PortfyLogo', () => ({
  PortfyLogo: () => <div data-testid="portfy-logo" />
}));

type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };

// Mock motion to render synchronously
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, onClick }: MotionDivProps) => <div className={className} onClick={onClick} data-testid="motion-div">{children}</div>
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}));

const createMockProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  id: 'test-id',
  email: 'test@example.com',
  display_name: 'Test User',
  subscription_type: 'none',
  subscription_end_date: null,
  role: 'agent',
  current_streak: 0,
  longest_streak: 0,
  total_xp: 0,
  broker_level: 1,
  streak_freeze_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tier: 'free',
  ai_tokens_used: 0,
  ...overrides,
});

describe('Navigation components', () => {
  describe('DesktopSidebar', () => {
    it('shows Admin item for admin role', () => {
      render(
        <DesktopSidebar 
          activeTab="dashboard"
          showAdminPanel={false}
          profile={createMockProfile({ role: 'admin' })}
          onTabChange={vi.fn()}
          onAdminClick={vi.fn()}
        />
      );
      expect(screen.getByText('Admin Paneli')).toBeInTheDocument();
    });

    it('hides Admin item for agent role', () => {
      render(
        <DesktopSidebar 
          activeTab="dashboard"
          showAdminPanel={false}
          profile={createMockProfile({ role: 'agent' })}
          onTabChange={vi.fn()}
          onAdminClick={vi.fn()}
        />
      );
      expect(screen.queryByText('Admin Paneli')).not.toBeInTheDocument();
    });
  });

  describe('MobileNav', () => {
    it('shows Admin item in more menu for admin role', async () => {
      render(
        <MobileNav
          activeTab="dashboard"
          showAdminPanel={false}
          profile={createMockProfile({ role: 'admin' })}
          onTabChange={vi.fn()}
          onAdminClick={vi.fn()}
        />
      );

      // Open the "Daha Fazla" drawer
      const moreButton = screen.getByText('Daha Fazla');
      await act(async () => {
        fireEvent.click(moreButton);
      });

      // Check if Admin exists in the drawer
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('hides Admin item in more menu for agent role', async () => {
      render(
        <MobileNav
          activeTab="dashboard"
          showAdminPanel={false}
          profile={createMockProfile({ role: 'agent' })}
          onTabChange={vi.fn()}
          onAdminClick={vi.fn()}
        />
      );

      // Open the "Daha Fazla" drawer
      const moreButton = screen.getByText('Daha Fazla');
      await act(async () => {
        fireEvent.click(moreButton);
      });

      // Check if Admin DOES NOT exist in the drawer
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });
});
