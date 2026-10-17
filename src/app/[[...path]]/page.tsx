'use client';

import dynamic from 'next/dynamic';

// The existing dashboard is a browser application (React Router, sessionStorage
// and browser-only UI libraries). Disabling SSR here prevents Next from trying
// to evaluate those APIs in a Vercel server function.
const App = dynamic(() => import('../../App'), { ssr: false });

export default function DashboardRoute() {
  return <App />;
}
