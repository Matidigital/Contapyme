import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/databaseSimple';

// POST - Generar asientos de depreciación desde activos fijos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, entry_date, auto_approve = false, asset_ids = null } = body;

    if (!period) {
      return NextResponse.json({
        success: false,
        error: 'period es requerido (formato YYYYMM)'
      }, { status: 400 });
    }

    console.log('🏭 Generando asientos de depreciación para período:', period);

    const supabase = getDatabaseConnection();
    const company_id = 'demo-company'; // TODO: obtener de sesión
    const final_entry_date = entry_date || new Date().toISOString().split('T')[0];

    // Verificar si ya existen asientos de depreciación para este período
    const { data: existingEntries, error: checkError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('entry_type', 'fixed_asset')
      .eq('source_type', 'asset_depreciation')
      .eq('source_period', period)
      .eq('company_id', company_id);

    if (checkError) {
      console.error('❌ Error verificando asientos existentes:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Error verificando asientos existentes'
      }, { status: 500 });
    }

    if (existingEntries && existingEntries.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Ya existen asientos de depreciación para el período ${period}`
      }, { status: 409 });
    }

    // Construir query para obtener activos fijos
    let assetsQuery = supabase
      .from('fixed_assets')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'active')
      .gt('monthly_depreciation', 0);

    // Filtrar por IDs específicos si se proporcionan
    if (asset_ids && Array.isArray(asset_ids) && asset_ids.length > 0) {
      assetsQuery = assetsQuery.in('id', asset_ids);
    }

    const { data: assets, error: assetsError } = await assetsQuery;

    if (assetsError) {
      console.error('❌ Error obteniendo activos fijos:', assetsError);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo activos fijos'
      }, { status: 500 });
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron activos fijos activos con depreciación'
      }, { status: 404 });
    }

    console.log(`📋 Procesando depreciación de ${assets.length} activos fijos`);

    // Agrupar activos por categoría para crear asientos separados
    const assetsByCategory = assets.reduce((groups: any, asset) => {
      const category = asset.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(asset);
      return groups;
    }, {});

    const generatedEntries = [];

    // Generar un asiento por cada categoría
    for (const [category, categoryAssets] of Object.entries(assetsByCategory) as [string, any[]][]) {
      const totalDepreciation = categoryAssets.reduce((sum, asset) => sum + asset.monthly_depreciation, 0);
      
      if (totalDepreciation <= 0) continue;

      // Crear asiento principal para la categoría
      const { data: depreciationEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          entry_date: final_entry_date,
          description: `Depreciación mensual ${category} - ${period}`,
          reference: `DEP-${category.toUpperCase()}-${period}`,
          entry_type: 'fixed_asset',
          source_type: 'asset_depreciation',
          source_period: period,
          status: auto_approve ? 'approved' : 'draft',
          total_debit: totalDepreciation,
          total_credit: totalDepreciation,
          created_by: 'system'
        })
        .select()
        .single();

      if (entryError) {
        console.error(`❌ Error creando asiento para categoría ${category}:`, entryError);
        return NextResponse.json({
          success: false,
          error: `Error creando asiento de depreciación para ${category}`
        }, { status: 500 });
      }

      // Crear líneas del asiento
      const lines = [];
      let lineNumber = 1;

      // Línea de gasto por depreciación (DEBE) - Una línea consolidada por categoría
      lines.push({
        journal_entry_id: depreciationEntry.id,
        account_code: '61010001',
        account_name: `Gasto Depreciación ${category}`,
        line_number: lineNumber++,
        debit_amount: totalDepreciation,
        credit_amount: 0,
        line_description: `Depreciación mensual ${category} - ${categoryAssets.length} activos`,
        reference: `DEP-${period}`,
        cost_center: category
      });

      // Líneas de depreciación acumulada (HABER) - Una línea por activo para detalle
      for (const asset of categoryAssets) {
        lines.push({
          journal_entry_id: depreciationEntry.id,
          account_code: asset.accumulated_depreciation_account || '13020001',
          account_name: `Depreciación Acumulada - ${asset.name}`,
          line_number: lineNumber++,
          debit_amount: 0,
          credit_amount: asset.monthly_depreciation,
          line_description: `Depreciación ${asset.name} (${asset.useful_life_months} meses)`,
          reference: asset.asset_code || asset.id,
          analytical_account: asset.id
        });
      }

      // Insertar todas las líneas
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) {
        console.error(`❌ Error creando líneas para ${category}:`, linesError);
        
        // Rollback: eliminar asiento principal
        await supabase
          .from('journal_entries')
          .delete()
          .eq('id', depreciationEntry.id);

        return NextResponse.json({
          success: false,
          error: `Error creando líneas del asiento de depreciación para ${category}`
        }, { status: 500 });
      }

      generatedEntries.push({
        ...depreciationEntry,
        category,
        assets_count: categoryAssets.length,
        assets_processed: categoryAssets.map(asset => ({
          id: asset.id,
          name: asset.name,
          monthly_depreciation: asset.monthly_depreciation
        })),
        lines
      });

      console.log(`✅ Asiento de depreciación creado para ${category}: ${depreciationEntry.id}`);
    }

    // Actualizar fecha de última depreciación en los activos procesados
    const allAssetIds = assets.map(asset => asset.id);
    const { error: updateError } = await supabase
      .from('fixed_assets')
      .update({
        last_depreciation_date: final_entry_date,
        updated_at: new Date().toISOString()
      })
      .in('id', allAssetIds);

    if (updateError) {
      console.warn('⚠️ Error actualizando fecha de depreciación en activos:', updateError);
      // No fallar la operación por esto, solo log warning
    }

    // Resumen de generación
    const summary = {
      period,
      categories_processed: Object.keys(assetsByCategory).length,
      total_assets: assets.length,
      entries_generated: generatedEntries.length,
      total_depreciation: generatedEntries.reduce((sum, entry) => sum + entry.total_debit, 0),
      auto_approved: auto_approve,
      entry_ids: generatedEntries.map(entry => entry.id),
      assets_by_category: Object.fromEntries(
        Object.entries(assetsByCategory).map(([category, categoryAssets]) => [
          category,
          {
            count: (categoryAssets as any[]).length,
            total_depreciation: (categoryAssets as any[]).reduce((sum, asset) => sum + asset.monthly_depreciation, 0)
          }
        ])
      )
    };

    console.log('✅ Asientos de depreciación generados exitosamente:', summary);

    return NextResponse.json({
      success: true,
      data: {
        entries: generatedEntries,
        summary
      },
      message: `${generatedEntries.length} asientos de depreciación generados para ${assets.length} activos fijos`
    });

  } catch (error) {
    console.error('❌ Error generando asientos de depreciación:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET - Obtener vista previa de depreciación sin generar asientos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');
    const asset_ids = searchParams.get('asset_ids')?.split(',').filter(Boolean);

    if (!period) {
      return NextResponse.json({
        success: false,
        error: 'period es requerido (formato YYYYMM)'
      }, { status: 400 });
    }

    console.log('👁️ Vista previa depreciación para período:', period);

    const supabase = getDatabaseConnection();
    const company_id = 'demo-company';

    // Construir query para obtener activos fijos
    let assetsQuery = supabase
      .from('fixed_assets')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'active')
      .gt('monthly_depreciation', 0);

    if (asset_ids && asset_ids.length > 0) {
      assetsQuery = assetsQuery.in('id', asset_ids);
    }

    const { data: assets, error: assetsError } = await assetsQuery;

    if (assetsError) {
      console.error('❌ Error obteniendo activos:', assetsError);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo activos fijos'
      }, { status: 500 });
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron activos fijos activos con depreciación'
      }, { status: 404 });
    }

    // Agrupar por categoría y calcular totales
    const preview = assets.reduce((groups: any, asset) => {
      const category = asset.category || 'General';
      if (!groups[category]) {
        groups[category] = {
          category,
          assets: [],
          total_depreciation: 0,
          assets_count: 0
        };
      }
      
      groups[category].assets.push({
        id: asset.id,
        name: asset.name,
        asset_code: asset.asset_code,
        monthly_depreciation: asset.monthly_depreciation,
        accumulated_depreciation: asset.accumulated_depreciation || 0,
        purchase_value: asset.purchase_value,
        current_book_value: (asset.purchase_value || 0) - (asset.accumulated_depreciation || 0)
      });
      
      groups[category].total_depreciation += asset.monthly_depreciation;
      groups[category].assets_count += 1;

      return groups;
    }, {});

    const previewData = Object.values(preview);
    const totalDepreciation = Object.values(preview).reduce((sum: number, group: any) => sum + group.total_depreciation, 0);

    console.log(`👁️ Vista previa: ${assets.length} activos, depreciación total: ${totalDepreciation}`);

    return NextResponse.json({
      success: true,
      data: {
        period,
        total_assets: assets.length,
        total_depreciation: totalDepreciation,
        categories: previewData,
        entries_to_generate: previewData.length
      }
    });

  } catch (error) {
    console.error('❌ Error en vista previa de depreciación:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}