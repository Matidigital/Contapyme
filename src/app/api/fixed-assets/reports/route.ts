import { NextRequest, NextResponse } from 'next/server';
import { getFixedAssetsReport } from '@/lib/databaseSimple';

// Hacer la ruta dinámica explícitamente
export const dynamic = 'force-dynamic';

// GET /api/fixed-assets/reports - Generar reportes de activos fijos
export async function GET(request: NextRequest) {
  try {
    // Usar searchParams directamente del request en lugar de URL
    const reportType = request.nextUrl.searchParams.get('type') || 'summary';
    const year = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();

    if (reportType === 'summary') {
      // Usar la nueva función de Supabase
      const { data: report, error } = await getFixedAssetsReport('demo-user-id', parseInt(year));

      if (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json(
          { error: 'Error al generar reporte de activos fijos' },
          { status: 500 }
        );
      }

      return NextResponse.json({ report, year: parseInt(year) });

    } else if (reportType === 'depreciation') {
      // Para reporte de depreciación, usar función simplificada
      const { data: report, error } = await getFixedAssetsReport('demo-user-id', parseInt(year));

      if (error) {
        console.error('Error fetching depreciation report:', error);
        return NextResponse.json(
          { error: 'Error al generar reporte de depreciación' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        depreciation_details: report?.assets_near_full_depreciation || [],
        year: parseInt(year)
      });

    } else {
      return NextResponse.json(
        { error: 'Tipo de reporte no válido. Use: summary, depreciation' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}