'use client';

import App from '../../App';

// The clinical dashboard remains a client-side application while API routes and
// database access run on the Next.js server. This keeps all existing URLs working.
export default function DashboardRoute() {
  return <App />;
}
