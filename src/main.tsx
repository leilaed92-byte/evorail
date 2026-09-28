import React from 'react';
import {createRoot} from 'react-dom/client';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './v2.css';
import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('EvoRail root element is missing');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
