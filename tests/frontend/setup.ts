import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';

Object.defineProperty(window, 'matchMedia', {writable: true, value: (query: string) => ({matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }})});
globalThis.ResizeObserver = class {observe() {} unobserve() {} disconnect() {}};

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});
