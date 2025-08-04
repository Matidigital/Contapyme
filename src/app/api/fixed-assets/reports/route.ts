import { NextRequest, NextResponse } from 'next/server';
import { getFixedAssetsReport, databaseSimple } from '@/lib/databaseSimple';

// Hacer la ruta dinámica explícitamente
export const dynamic = 'force-dynamic';

// GET /api/fixed-assets/reports - Generar reportes de activos fijos
export async function GET(request: NextRequest) {
  try {
    // Usar searchParams directamente del request en lugar de URL
    const reportType = request.nextUrl.searchParams.get('type') || 'summary';
    const year = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();

    // Verificar si la tabla existe primero
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fixed_assets'
      );
    `;

    const { data: tableExists, error: tableError } = await databaseSimple.query(tableExistsQuery);
    
    if (tableError || !tableExists || !tableExists[0]?.exists) {
      // Retornar reporte vacío si la tabla no existe
      const emptyReport = {
        total_assets: 0,
        total_purchase_value: 0,
        total_book_value: 0,
        monthly_depreciation: 0,
        total_accumulated_depreciation: 0,
        assets_near_full_depreciation: []
      };
      
      return NextResponse.json({ 
        report: emptyReport, 
        year: parseInt(year),
        message: 'Funcionalidad en desarrollo - mostrando datos vacíos'
      });
    }

    if (reportType === 'summary') {
      // Usar la nueva función de Supabase
      const { data: report, error } = await getFixedAssetsReport('demo-user-12345678-9abc-def0-1234-56789abcdef0', parseInt(year));

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
      const { data: report, error } = await getFixedAssetsReport('demo-user-12345678-9abc-def0-1234-56789abcdef0', parseInt(year));

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