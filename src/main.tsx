import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('--- main.tsx starting now (final check) ---');
console.log('--- main.tsx starting now ---');
console.log('--- main.tsx starting ---');
console.log('Starting main.tsx...');
console.log('main.tsx is running...');
console.log('Main entry point running...');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
