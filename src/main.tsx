import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Hava yastığı tüm uygulamayı sarmalıyor */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);