import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { hana } from '@hana/plugin-sdk';
import '@hana/plugin-components/styles.css';
import './styles.css';
import { App } from './App';

hana.ready();
hana.ui.resize({ height: window.innerHeight });

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
