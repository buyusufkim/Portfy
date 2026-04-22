import { Property, Task } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

export const portalService = {
  getSecurePortalData: async (token: string) => {
    const response = await fetch(`${API_URL}/api/portal/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Portal data fetch failed');
    }

    return response.json();
  }
};
