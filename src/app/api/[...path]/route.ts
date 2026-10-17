import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../server/auth';
import { unauthorized } from '../../../server/http';

const emptyDashboard = {
  patients: { active: 0, inactive: 0, total: 0 },
  appointments: { completed: 0, scheduled: 0, cancelled: 0, noShow: 0, attendanceRate: 0 },
  sessions: { completed: 0, pending: 0, total: 0, completionRate: 0 },
  revenue: { total: 0, byMonth: [], byPaymentMethod: [] },
  packages: { total: 0, byType: [], nearCompletion: [] },
  professionals: { top: [] },
  recentPayments: [],
};

function pagination(request: NextRequest) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20));
  return { total: 0, page, limit, totalPages: 1, hasNextPage: false, hasPreviousPage: page > 1 };
}

// During the staged backend rebuild, this route ensures an unimplemented API
// path is handled as an API response instead of falling through to the web app
// catch-all route (which previously produced `document is not defined` on SSR).
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    await requireUser(request);
    const path = (await context.params).path.join('/');

    if (['quotes/all', 'professionals/get-all', 'cie10/all'].includes(path)) {
      return NextResponse.json({ status: 200, message: 'Sin registros todavía', response: [], pagination: pagination(request) });
    }
    if (path === 'reports/dashboard') {
      return NextResponse.json({ status: 200, message: 'Reporte inicial', response: emptyDashboard });
    }

    return NextResponse.json({ status: 404, message: `Ruta API no implementada: /api/${path}` }, { status: 404 });
  } catch (error) {
    return error instanceof Error && /Token/.test(error.message)
      ? unauthorized()
      : NextResponse.json({ status: 500, message: 'No se pudo procesar la solicitud.' }, { status: 500 });
  }
}
