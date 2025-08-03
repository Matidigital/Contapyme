import { NextRequest, NextResponse } from 'next/server';
import { databaseSimple } from '@/lib/databaseSimple';

// GET /api/fixed-assets/reports - Generar reportes de activos fijos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    if (reportType === 'summary') {
      // Reporte resumen general
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_assets,
          COALESCE(SUM(purchase_value), 0) as total_purchase_value,
          COALESCE(SUM(purchase_value - COALESCE(current_accumulated_dep.accumulated, 0)), 0) as total_book_value,
          COALESCE(SUM(current_accumulated_dep.accumulated), 0) as total_accumulated_depreciation,
          COALESCE(SUM(monthly_dep.monthly), 0) as monthly_depreciation
        FROM fixed_assets fa
        LEFT JOIN (
          SELECT 
            fixed_asset_id,
            MAX(accumulated_depreciation) as accumulated
          FROM fixed_assets_depreciation
          WHERE period_year <= $2
          GROUP BY fixed_asset_id
        ) current_accumulated_dep ON fa.id = current_accumulated_dep.fixed_asset_id
        LEFT JOIN (
          SELECT 
            fixed_asset_id,
            AVG(monthly_depreciation) as monthly
          FROM fixed_assets_depreciation
          WHERE period_year = $2
          GROUP BY fixed_asset_id
        ) monthly_dep ON fa.id = monthly_dep.fixed_asset_id
        WHERE fa.user_id = auth.uid() AND fa.status = 'active'
      `;

      const { data: summaryData, error: summaryError } = await databaseSimple.query(summaryQuery, [year, year]);

      if (summaryError) {
        console.error('Error fetching summary report:', summaryError);
        return NextResponse.json(
          { error: 'Error al generar reporte resumen' },
          { status: 500 }
        );
      }

      // Reporte por categorías
      const categoryQuery = `
        SELECT 
          fa.category,
          COUNT(*) as count,
          COALESCE(SUM(fa.purchase_value), 0) as purchase_value,
          COALESCE(SUM(fa.purchase_value - COALESCE(current_accumulated_dep.accumulated, 0)), 0) as book_value,
          COALESCE(SUM(current_accumulated_dep.accumulated), 0) as accumulated_depreciation
        FROM fixed_assets fa
        LEFT JOIN (
          SELECT 
            fixed_asset_id,
            MAX(accumulated_depreciation) as accumulated
          FROM fixed_assets_depreciation
          WHERE period_year <= $1
          GROUP BY fixed_asset_id
        ) current_accumulated_dep ON fa.id = current_accumulated_dep.fixed_asset_id
        WHERE fa.user_id = auth.uid() AND fa.status = 'active'
        GROUP BY fa.category
        ORDER BY purchase_value DESC
      `;

      const { data: categoryData, error: categoryError } = await databaseSimple.query(categoryQuery, [year]);

      if (categoryError) {
        console.error('Error fetching category report:', categoryError);
        return NextResponse.json(
          { error: 'Error al generar reporte por categorías' },
          { status: 500 }
        );
      }

      // Activos próximos a depreciación completa (90% o más)
      const nearFullDepreciationQuery = `
        SELECT 
          fa.id,
          fa.name,
          fa.category,
          fa.purchase_value,
          fa.residual_value,
          COALESCE(current_accumulated_dep.accumulated, 0) as accumulated_depreciation,
          fa.purchase_value - COALESCE(current_accumulated_dep.accumulated, 0) as book_value,
          ROUND((COALESCE(current_accumulated_dep.accumulated, 0) / NULLIF(fa.depreciable_value, 0)) * 100, 2) as depreciation_percentage
        FROM fixed_assets fa
        LEFT JOIN (
          SELECT 
            fixed_asset_id,
            MAX(accumulated_depreciation) as accumulated
          FROM fixed_assets_depreciation
          WHERE period_year <= $1
          GROUP BY fixed_asset_id
        ) current_accumulated_dep ON fa.id = current_accumulated_dep.fixed_asset_id
        WHERE fa.user_id = auth.uid() 
          AND fa.status = 'active'
          AND fa.depreciable_value > 0
          AND (COALESCE(current_accumulated_dep.accumulated, 0) / fa.depreciable_value) >= 0.9
        ORDER BY depreciation_percentage DESC
        LIMIT 10
      `;

      const { data: nearFullData, error: nearFullError } = await databaseSimple.query(nearFullDepreciationQuery, [year]);

      if (nearFullError) {
        console.error('Error fetching near full depreciation assets:', nearFullError);
        return NextResponse.json(
          { error: 'Error al obtener activos próximos a depreciación completa' },
          { status: 500 }
        );
      }

      // Formatear datos por categoría
      const assetsByCategory: any = {};
      (categoryData || []).forEach((cat: any) => {
        assetsByCategory[cat.category] = {
          count: parseInt(cat.count),
          purchase_value: parseFloat(cat.purchase_value),
          book_value: parseFloat(cat.book_value),
          accumulated_depreciation: parseFloat(cat.accumulated_depreciation)
        };
      });

      const report = {
        total_assets: parseInt(summaryData?.[0]?.total_assets || '0'),
        total_purchase_value: parseFloat(summaryData?.[0]?.total_purchase_value || '0'),
        total_book_value: parseFloat(summaryData?.[0]?.total_book_value || '0'),
        total_accumulated_depreciation: parseFloat(summaryData?.[0]?.total_accumulated_depreciation || '0'),
        monthly_depreciation: parseFloat(summaryData?.[0]?.monthly_depreciation || '0'),
        assets_by_category: assetsByCategory,
        assets_near_full_depreciation: nearFullData || []
      };

      return NextResponse.json({ report, year: parseInt(year) });

    } else if (reportType === 'depreciation') {
      // Reporte detallado de depreciación por año
      const depreciationQuery = `
        SELECT 
          fa.id,
          fa.name,
          fa.category,
          fa.purchase_value,
          fa.residual_value,
          fad.period_year,
          fad.period_month,
          fad.monthly_depreciation,
          fad.accumulated_depreciation,
          fad.book_value
        FROM fixed_assets fa
        LEFT JOIN fixed_assets_depreciation fad ON fa.id = fad.fixed_asset_id
        WHERE fa.user_id = auth.uid() 
          AND fa.status = 'active'
          AND fad.period_year = $1
        ORDER BY fa.name ASC, fad.period_month ASC
      `;

      const { data, error } = await databaseSimple.query(depreciationQuery, [year]);

      if (error) {
        console.error('Error fetching depreciation report:', error);
        return NextResponse.json(
          { error: 'Error al generar reporte de depreciación' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        depreciation_details: data || [],
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