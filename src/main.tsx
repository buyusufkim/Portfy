import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Suppress known noisy console errors to prevent UI alerts in preview
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    if (args[0].includes('BillingNotEnabledMapError') || 
        args[0].includes('REQUEST_DENIED') ||
        args[0].includes('Geocoding Hatası')) {
      return; // Suppress
    }
  }
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    if (args[0].includes('google.maps.Marker is deprecated') ||
        args[0].includes('Geocoding Uyarı')) {
      return; // Suppress
    }
  }
  originalConsoleWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Hava yastığı tüm uygulamayı sarmalıyor */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);