import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Простой роутинг по pathname
const path = window.location.pathname;

async function boot() {
  let Component: React.ComponentType;

  if (path.startsWith("/company")) {
    const m = await import('./pages/CompanyAdmin');
    Component = m.default;
  } else if (path.startsWith("/super")) {
    const m = await import('./pages/SuperAdmin');
    Component = m.default;
  } else {
    const m = await import('./App');
    Component = m.default;
  }

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Component />
    </React.StrictMode>
  );
}

boot();
