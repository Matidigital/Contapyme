// ==========================================
// BASE DE DATOS SIMPLIFICADA - SOLO SUPABASE
// Para trabajar exclusivamente en Netlify
// ==========================================

import { createClient } from '@supabase/supabase-js';

// ✅ Configuración Supabase con fallbacks robustos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yttdnmokivtayeunlvlk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Detectar si estamos en servidor o cliente
const isServer = typeof window === 'undefined';

// 🚨 VALIDACIÓN SEGÚN CONTEXTO
if (!supabaseUrl) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL no configurada, usando fallback');
}

if (isServer) {
  // En servidor: requerimos service key
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada - Funcionalidad de servidor limitada');
  } else {
    console.log('✅ Supabase servidor configurado correctamente');
  }
} else {
  // En cliente: usamos anon key
  if (!supabaseAnonKey) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada');
  } else {
    console.log('✅ Supabase cliente configurado correctamente');
  }
}

// ✅ Cliente apropiado según contexto
const supabase = isServer && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient(supabaseUrl, 'fallback-key'); // Fallback temporal

// ✅ Helper para verificar si Supabase está configurado correctamente
export function isSupabaseConfigured(): boolean {
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return !!(supabaseUrl && supabaseServiceKey);
  } else {
    return !!(supabaseUrl && supabaseAnonKey);
  }
}

// Función para obtener conexión (para compatibilidad con APIs)
export function getDatabaseConnection() {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase no está completamente configurado');
    return null;
  }
  return supabase;
}

// Función para probar la conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error conectando a Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('💥 Error crítico en conexión:', error);
    return false;
  }
}

// Funciones directas para F29
export async function insertF29Form(data: any) {
  try {
    const { data: result, error } = await supabase
      .from('f29_forms')
      .insert([{
        company_id: data.company_id,
        user_id: data.user_id,
        period: data.period,
        file_name: data.file_name,
        file_size: data.file_size,
        rut: data.rut,
        folio: data.folio,
        raw_data: data.raw_data,
        calculated_data: data.calculated_data,
        ventas_netas: data.ventas_netas,
        compras_netas: data.compras_netas,
        iva_debito: data.iva_debito,
        iva_credito: data.iva_credito,
        iva_determinado: data.iva_determinado,
        ppm: data.ppm,
        remanente: data.remanente,
        margen_bruto: data.margen_bruto,
        codigo_538: data.codigo_538,
        codigo_511: data.codigo_511,
        codigo_563: data.codigo_563,
        codigo_062: data.codigo_062,
        codigo_077: data.codigo_077,
        confidence_score: data.confidence_score,
        validation_status: data.validation_status,
        year: data.year,
        month: data.month
      }])
      .select();

    return { data: result, error };
  } catch (error) {
    console.error('❌ Error insertando F29:', error);
    return { data: null, error };
  }
}

export async function getF29Forms(companyId: string, limit = 24) {
  try {
    const { data, error } = await supabase
      .from('f29_forms')
      .select('*')
      .eq('company_id', companyId)
      .order('period', { ascending: true })
      .limit(limit);

    return { data, error };
  } catch (error) {
    console.error('❌ Error obteniendo F29s:', error);
    return { data: null, error };
  }
}

export async function upsertAnalysis(data: any) {
  try {
    const { error } = await supabase
      .from('f29_comparative_analysis')
      .upsert({
        company_id: data.company_id,
        period_start: data.period_start,
        period_end: data.period_end,
        analysis_data: data.analysis_data,
        total_periods: data.total_periods,
        avg_monthly_sales: data.avg_monthly_sales,
        growth_rate: data.growth_rate,
        best_month: data.best_month,
        worst_month: data.worst_month,
        insights: data.insights,
        trends: data.trends,
        seasonality: data.seasonality,
        anomalies: data.anomalies,
        generated_at: data.generated_at,
        expires_at: data.expires_at
      });

    return { error };
  } catch (error) {
    console.error('❌ Error guardando análisis:', error);
    return { error };
  }
}

// Función para generar datos demo
export async function generateDemoData() {
  console.log('🎭 Generando datos demo en Supabase...');

  const companyId = 'demo-company';
  const userId = 'demo-user';

  const demoData = [
    { period: '202401', ventas_base: 15800000, variation: 0.95 },
    { period: '202402', ventas_base: 16200000, variation: 0.98 },
    { period: '202403', ventas_base: 17950795, variation: 1.0 },
    { period: '202404', ventas_base: 18200000, variation: 1.02 },
    { period: '202405', ventas_base: 19500000, variation: 1.08 },
    { period: '202406', ventas_base: 20100000, variation: 1.12 },
    { period: '202407', ventas_base: 18900000, variation: 1.05 },
    { period: '202408', ventas_base: 19200000, variation: 1.07 },
    { period: '202409', ventas_base: 21000000, variation: 1.17 },
    { period: '202410', ventas_base: 22500000, variation: 1.25 },
    { period: '202411', ventas_base: 24000000, variation: 1.34 },
    { period: '202412', ventas_base: 26500000, variation: 1.48 }
  ];

  let insertedCount = 0;

  for (const data of demoData) {
    const ventas_netas = Math.round(data.ventas_base * data.variation);
    const iva_debito = Math.round(ventas_netas * 0.19);
    const iva_credito = Math.round(iva_debito * (0.7 + Math.random() * 0.6));
    const compras_netas = Math.round(iva_debito / 0.19);
    const margen_bruto = ventas_netas - compras_netas;
    const iva_determinado = iva_debito - iva_credito;
    const ppm = Math.round(ventas_netas * 0.002);
    const remanente = Math.round(Math.random() * 100000);

    const dbRecord = {
      company_id: companyId,
      user_id: userId,
      period: data.period,
      file_name: `F29_${data.period.substring(4)}_${data.period.substring(0, 4)}.pdf`,
      file_size: 250000 + Math.round(Math.random() * 100000),
      rut: '76.123.456-7',
      folio: `${Math.floor(Math.random() * 999999)}`,
      raw_data: {
        source: 'demo_generator',
        extraction_method: 'simulated',
        timestamp: new Date().toISOString()
      },
      calculated_data: {
        codigo563: ventas_netas,
        codigo538: iva_debito,
        codigo511: iva_credito,
        codigo062: ppm,
        codigo077: remanente,
        compras_calculadas: compras_netas,
        iva_determinado: iva_determinado,
        margen_bruto: margen_bruto,
        total_a_pagar: Math.max(0, iva_determinado + ppm + remanente)
      },
      ventas_netas,
      compras_netas,
      iva_debito,
      iva_credito,
      iva_determinado,
      ppm,
      remanente,
      margen_bruto,
      codigo_538: iva_debito,
      codigo_511: iva_credito,
      codigo_563: ventas_netas,
      codigo_062: ppm,
      codigo_077: remanente,
      confidence_score: 85 + Math.round(Math.random() * 15),
      validation_status: 'validated',
      year: parseInt(data.period.substring(0, 4)),
      month: parseInt(data.period.substring(4, 6))
    };

    try {
      const { error } = await insertF29Form(dbRecord);
      
      if (error) {
        console.error(`❌ Error insertando ${data.period}:`, error);
      } else {
        insertedCount++;
        console.log(`✅ ${data.period}: $${ventas_netas.toLocaleString()}`);
      }
    } catch (error) {
      console.error(`💥 Error procesando ${data.period}:`, error);
    }
  }

  return {
    total_records: demoData.length,
    inserted: insertedCount,
    failed: demoData.length - insertedCount
  };
}

// ==========================================
// FUNCIONES PARA ACTIVOS FIJOS - SUPABASE REAL
// ==========================================

// Crear activo fijo
export async function createFixedAsset(assetData: any) {
  try {
    const { data, error } = await supabase
      .from('fixed_assets')
      .insert([{
        user_id: assetData.user_id || 'demo-user',
        name: assetData.name,
        description: assetData.description,
        category: assetData.category || 'Activo Fijo',
        purchase_value: assetData.purchase_value,
        residual_value: assetData.residual_value || 0,
        purchase_date: assetData.purchase_date,
        start_depreciation_date: assetData.start_depreciation_date,
        useful_life_years: assetData.useful_life_years,
        depreciation_method: 'linear',
        asset_account_code: assetData.asset_account_code,
        depreciation_account_code: assetData.depreciation_account_code,
        expense_account_code: assetData.expense_account_code,
        serial_number: assetData.serial_number,
        brand: assetData.brand,
        model: assetData.model,
        location: assetData.location,
        responsible_person: assetData.responsible_person,
        status: 'active'
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('❌ Error creando activo fijo:', error);
    return { data: null, error };
  }
}

// Obtener activos fijos
export async function getFixedAssets(filters: any = {}) {
  try {
    let query = supabase
      .from('fixed_assets')
      .select('*')  // Solo seleccionar de fixed_assets, sin JOIN
      .eq('user_id', filters.user_id || 'demo-user')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    return { data, error };
  } catch (error) {
    console.error('❌ Error obteniendo activos fijos:', error);
    return { data: null, error };
  }
}

// Obtener activo fijo por ID
export async function getFixedAssetById(id: string, userId: string = 'demo-user') {
  try {
    const { data, error } = await supabase
      .from('fixed_assets')
      .select('*, id_fixed_assets as id')  // Mapear id_fixed_assets como id para compatibilidad
      .eq('id_fixed_assets', id)
      .eq('user_id', userId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('❌ Error obteniendo activo fijo:', error);
    return { data: null, error };
  }
}

// Actualizar activo fijo
export async function updateFixedAsset(id: string, updateData: any, userId: string = 'demo-user') {
  try {
    const { data, error } = await supabase
      .from('fixed_assets')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id_fixed_assets', id)
      .eq('user_id', userId)
      .select('*, id_fixed_assets as id')
      .single();

    return { data, error };
  } catch (error) {
    console.error('❌ Error actualizando activo fijo:', error);
    return { data: null, error };
  }
}

// Eliminar activo fijo
export async function deleteFixedAsset(id: string, userId: string = 'demo-user') {
  try {
    const { data, error } = await supabase
      .from('fixed_assets')
      .delete()
      .eq('id_fixed_assets', id)
      .eq('user_id', userId)
      .select('id_fixed_assets as id, name')
      .single();

    return { data, error };
  } catch (error) {
    console.error('❌ Error eliminando activo fijo:', error);
    return { data: null, error };
  }
}

// Obtener categorías de activos fijos
export async function getFixedAssetCategories() {
  try {
    const { data, error } = await supabase
      .from('fixed_assets_categories')
      .select('*')
      .order('name');

    return { data, error };
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    return { data: null, error };
  }
}

// Generar reporte de activos fijos
export async function getFixedAssetsReport(userId: string = 'demo-user', year?: number) {
  try {
    // Obtener TODOS los activos para cálculos correctos
    // Incluimos todos los estados para que los totales sean precisos
    const { data: assets, error: assetsError } = await supabase
      .from('fixed_assets')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'disposed', 'fully_depreciated']); // Incluir todos los estados relevantes

    if (assetsError) {
      return { data: null, error: assetsError };
    }

    if (!assets || assets.length === 0) {
      return {
        data: {
          total_assets: 0,
          total_purchase_value: 0,
          total_book_value: 0,
          total_accumulated_depreciation: 0,
          monthly_depreciation: 0,
          assets_by_category: {},
          assets_near_full_depreciation: []
        },
        error: null
      };
    }

    // Calcular métricas
    const currentDate = new Date();
    const report = {
      total_assets: assets.length,
      total_purchase_value: 0,
      total_book_value: 0,
      total_accumulated_depreciation: 0,
      monthly_depreciation: 0,
      assets_by_category: {} as any,
      assets_near_full_depreciation: [] as any[]
    };

    assets.forEach(asset => {
      // Para activos dados de baja, usar valores finales
      if (asset.status === 'disposed' && asset.disposal_date) {
        const disposalValue = asset.disposal_value || 0;
        report.total_purchase_value += asset.purchase_value;
        report.total_book_value += disposalValue; // Valor de venta/disposición
        report.total_accumulated_depreciation += (asset.purchase_value - disposalValue);
        // No contribuyen a la depreciación mensual actual
        return;
      }
      
      // Calcular depreciación acumulada aproximada para activos activos
      const startDate = new Date(asset.start_depreciation_date);
      const monthsElapsed = Math.max(0, Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
      
      const monthlyDepreciation = (asset.purchase_value - asset.residual_value) / (asset.useful_life_years * 12);
      const accumulatedDepreciation = Math.min(
        monthsElapsed * monthlyDepreciation,
        asset.purchase_value - asset.residual_value
      );
      const bookValue = Math.max(asset.purchase_value - accumulatedDepreciation, asset.residual_value);

      // Acumular totales
      report.total_purchase_value += asset.purchase_value;
      report.total_book_value += bookValue;
      report.total_accumulated_depreciation += accumulatedDepreciation;
      report.monthly_depreciation += monthlyDepreciation;

      // Agrupar por categoría
      if (!report.assets_by_category[asset.category]) {
        report.assets_by_category[asset.category] = {
          count: 0,
          purchase_value: 0,
          book_value: 0,
          accumulated_depreciation: 0
        };
      }
      
      report.assets_by_category[asset.category].count += 1;
      report.assets_by_category[asset.category].purchase_value += asset.purchase_value;
      report.assets_by_category[asset.category].book_value += bookValue;
      report.assets_by_category[asset.category].accumulated_depreciation += accumulatedDepreciation;

      // Detectar activos próximos a depreciación completa (90%+)
      const depreciationPercentage = accumulatedDepreciation / (asset.purchase_value - asset.residual_value);
      if (depreciationPercentage >= 0.9) {
        report.assets_near_full_depreciation.push({
          ...asset,
          accumulated_depreciation: accumulatedDepreciation,
          book_value: bookValue,
          depreciation_percentage: depreciationPercentage * 100
        });
      }
    });

    return { data: report, error: null };
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    return { data: null, error };
  }
}

// Función genérica compatible con las queries existentes (para compatibilidad)
export const databaseSimple = {
  async query(sql: string, params: any[] = []) {
    try {
      console.log('🔄 Database query:', sql.substring(0, 100) + '...');
      
      // Mapear queries SQL a funciones de Supabase
      if (sql.includes('INSERT INTO fixed_assets')) {
        const assetData = {
          user_id: params[0],              // DEMO_USER_ID
          name: params[1],                 // body.name  
          description: params[2],          // body.description
          category: params[3],             // body.category
          purchase_value: params[4],       // body.purchase_value
          residual_value: params[5],       // body.residual_value
          purchase_date: params[6],        // body.purchase_date
          start_depreciation_date: params[7], // body.start_depreciation_date
          useful_life_years: params[8],    // body.useful_life_years
          depreciation_method: params[9],  // 'linear'
          asset_account_code: params[10],  // body.asset_account_code
          depreciation_account_code: params[11], // body.depreciation_account_code
          expense_account_code: params[12], // body.expense_account_code
          serial_number: params[13],       // body.serial_number
          brand: params[14],               // body.brand
          model: params[15],               // body.model
          location: params[16],            // body.location
          responsible_person: params[17]   // body.responsible_person
        };
        
        return await createFixedAsset(assetData);
      }
      
      if (sql.includes('SELECT') && sql.includes('FROM fixed_assets') && !sql.includes('WHERE id =')) {
        const filters = { user_id: 'demo-user' };  // Corregido para coincidir con migración
        return await getFixedAssets(filters);
      }
      
      if (sql.includes('SELECT') && sql.includes('WHERE fa.id = $1')) {
        return await getFixedAssetById(params[0]);
      }
      
      if (sql.includes('DELETE FROM fixed_assets')) {
        return await deleteFixedAsset(params[0]);
      }
      
      if (sql.includes('FROM fixed_assets_categories')) {
        return await getFixedAssetCategories();
      }
      
      // Para queries de actualización, usar función específica
      if (sql.includes('UPDATE fixed_assets')) {
        // Esta es más compleja, podría necesitar parsing del SQL
        console.log('⚠️ UPDATE query detectada, usar updateFixedAsset() directamente');
        return { data: [], error: null };
      }
      
      // Chart of accounts queries
      if (sql.includes('FROM chart_of_accounts')) {
        console.log('🏦 Chart of accounts query detected');
        
        // Usar la nueva función robusta de plan de cuentas
        const filters: any = {};
        
        // Mapear parámetros SQL a filtros
        if (sql.includes('level_type =') && params[0]) {
          filters.level_type = params[0];
        }
        
        if (sql.includes('account_type =')) {
          const accountTypeIndex = sql.includes('level_type =') ? 1 : 0;
          if (params[accountTypeIndex]) {
            filters.account_type = params[accountTypeIndex];
          }
        }
        
        // Llamar a la función robusta
        const result = await getChartOfAccounts(filters);
        
        console.log(`✅ Chart of accounts: ${result.data?.length || 0} records`);
        return result;
      }
      
      // Para queries no reconocidas, retornar vacío
      console.log('⚠️ Query no reconocida:', sql);
      return { data: [], error: null };
      
    } catch (error) {
      console.error('❌ Database query error:', error);
      return { data: null, error };
    }
  }
};

// ======================================
// ECONOMIC INDICATORS FUNCTIONS
// ======================================

export async function getIndicatorsDashboard(): Promise<{ data: any; error: any }> {
  try {
    // ✅ Verificar configuración antes de hacer requests
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase no configurado - saltando obtención de indicadores');
      return { data: null, error: { message: 'Supabase no configurado', code: 'SUPABASE_NOT_CONFIGURED' } };
    }
    
    // Obtener indicadores por categoría
    const { data: monetary, error: monetaryError } = await supabase.rpc('get_indicators_by_category', { cat: 'monetary' });
    const { data: currency, error: currencyError } = await supabase.rpc('get_indicators_by_category', { cat: 'currency' });
    const { data: crypto, error: cryptoError } = await supabase.rpc('get_indicators_by_category', { cat: 'crypto' });
    const { data: labor, error: laborError } = await supabase.rpc('get_indicators_by_category', { cat: 'labor' });

    if (monetaryError || currencyError || cryptoError || laborError) {
      console.error('Error fetching indicators by category:', { monetaryError, currencyError, cryptoError, laborError });
      return { data: null, error: monetaryError || currencyError || cryptoError || laborError };
    }

    const dashboard = {
      monetary: monetary || [],
      currency: currency || [],
      crypto: crypto || [],
      labor: labor || [],
    };

    return { data: dashboard, error: null };
  } catch (error) {
    console.error('Unexpected error in getIndicatorsDashboard:', error);
    return { data: null, error };
  }
}

export async function getIndicatorHistory(code: string, days: number = 30): Promise<{ data: any; error: any }> {
  try {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('economic_indicators')
      .select('*')
      .eq('code', code)
      .gte('date', fromDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching indicator history:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getIndicatorHistory:', error);
    return { data: null, error };
  }
}

export async function updateIndicatorValue(
  code: string, 
  value: number, 
  date: string = new Date().toISOString().split('T')[0]
): Promise<{ data: any; error: any }> {
  try {
    // Obtener configuración del indicador
    const { data: config, error: configError } = await supabase
      .from('indicator_config')
      .select('*')
      .eq('code', code)
      .single();

    if (configError) {
      console.error(`❌ No se encontró configuración para indicador ${code}:`, configError);
      return { data: null, error: configError };
    }

    // Primero intentar actualizar si existe
    const { data: existingData, error: selectError } = await supabase
      .from('economic_indicators')
      .select('*')
      .eq('code', code)
      .eq('date', date)
      .maybeSingle(); // Usar maybeSingle en lugar de single

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing indicator:', selectError);
      return { data: null, error: selectError };
    }

    let result;
    
    if (existingData) {
      // Actualizar registro existente
      const { data, error } = await supabase
        .from('economic_indicators')
        .update({
          value,
          name: config.name,
          unit: config.unit,
          category: config.category,
          updated_at: new Date().toISOString()
        })
        .eq('code', code)
        .eq('date', date)
        .select()
        .single();
      
      result = { data, error };
    } else {
      // Insertar nuevo registro
      const { data, error } = await supabase
        .from('economic_indicators')
        .insert({
          code,
          name: config.name,
          unit: config.unit,
          value,
          date,
          category: config.category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      result = { data, error };
    }

    if (result.error) {
      console.error(`❌ Error ${existingData ? 'updating' : 'inserting'} indicator ${code}:`, result.error);
      return { data: null, error: result.error };
    }

    console.log(`✅ Indicador ${code} ${existingData ? 'actualizado' : 'insertado'}: ${value}`);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateIndicatorValue:', error);
    return { data: null, error };
  }
}

// Función para asegurar que existe la configuración de indicadores
export async function ensureIndicatorConfig(): Promise<{ data: any; error: any }> {
  try {
    // Configuración básica de indicadores
    const indicatorConfigs = [
      { code: 'UF', name: 'Unidad de Fomento', unit: 'CLP', category: 'monetary' },
      { code: 'UTM', name: 'Unidad Tributaria Mensual', unit: 'CLP', category: 'monetary' },
      { code: 'USD', name: 'Dólar Observado', unit: 'CLP', category: 'currency' },
      { code: 'EUR', name: 'Euro', unit: 'CLP', category: 'currency' },
      { code: 'SUELDO_MIN', name: 'Sueldo Mínimo', unit: 'CLP', category: 'labor' },
      { code: 'BTC', name: 'Bitcoin', unit: 'USD', category: 'crypto' },
    ];

    for (const config of indicatorConfigs) {
      // Verificar si existe
      const { data: existing } = await supabase
        .from('indicator_config')
        .select('code')
        .eq('code', config.code)
        .maybeSingle();

      if (!existing) {
        // Insertar si no existe
        const { error } = await supabase
          .from('indicator_config')
          .insert(config);
        
        if (error) {
          console.error(`Error insertando config para ${config.code}:`, error);
        } else {
          console.log(`✅ Configuración creada para indicador ${config.code}`);
        }
      }
    }

    return { data: { message: 'Configuración de indicadores verificada' }, error: null };
  } catch (error) {
    console.error('Error en ensureIndicatorConfig:', error);
    return { data: null, error };
  }
}

export async function getLatestIndicators(): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from('economic_indicators')
      .select(`
        *,
        indicator_config!inner(
          display_order,
          format_type,
          decimal_places,
          is_active
        )
      `)
      .eq('indicator_config.is_active', true)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching latest indicators:', error);
      return { data: null, error };
    }

    // Agrupar por código para obtener solo el más reciente de cada uno
    const latest = data.reduce((acc: any, indicator: any) => {
      if (!acc[indicator.code]) {
        acc[indicator.code] = indicator;
      }
      return acc;
    }, {});

    const result = Object.values(latest).sort(
      (a: any, b: any) => a.indicator_config.display_order - b.indicator_config.display_order
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Unexpected error in getLatestIndicators:', error);
    return { data: null, error };
  }
}

// ==========================================
// FUNCIONES PARA PLAN DE CUENTAS - SUPABASE REAL
// ==========================================

// Plan de cuentas básico IFRS para Chile
const BASIC_CHART_OF_ACCOUNTS = [
  // Nivel 1
  { code: '1', name: 'ACTIVO', level_type: '1er Nivel', account_type: 'ACTIVO', parent_code: null },
  { code: '2', name: 'PASIVO', level_type: '1er Nivel', account_type: 'PASIVO', parent_code: null },
  { code: '3', name: 'PATRIMONIO', level_type: '1er Nivel', account_type: 'PATRIMONIO', parent_code: null },
  { code: '5', name: 'INGRESOS', level_type: '1er Nivel', account_type: 'INGRESO', parent_code: null },
  { code: '6', name: 'GASTOS', level_type: '1er Nivel', account_type: 'GASTO', parent_code: null },

  // Nivel 2 - Activos
  { code: '1.1', name: 'ACTIVO CORRIENTE', level_type: '2do Nivel', account_type: 'ACTIVO', parent_code: '1' },
  { code: '1.2', name: 'ACTIVO NO CORRIENTE', level_type: '2do Nivel', account_type: 'ACTIVO', parent_code: '1' },

  // Nivel 3 - Activos Fijos
  { code: '1.2.1', name: 'PROPIEDAD, PLANTA Y EQUIPO', level_type: '3er Nivel', account_type: 'ACTIVO', parent_code: '1.2' },
  { code: '1.2.2', name: 'DEPRECIACIÓN ACUMULADA', level_type: '3er Nivel', account_type: 'ACTIVO', parent_code: '1.2' },
  { code: '6.1', name: 'GASTOS OPERACIONALES', level_type: '3er Nivel', account_type: 'GASTO', parent_code: '6' },

  // Cuentas Imputables - Activos Fijos
  { code: '1.2.1.001', name: 'Equipos de Computación', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.1' },
  { code: '1.2.1.002', name: 'Muebles y Enseres', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.1' },
  { code: '1.2.1.003', name: 'Equipos de Oficina', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.1' },
  { code: '1.2.1.004', name: 'Vehículos', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.1' },

  // Cuentas Imputables - Depreciación Acumulada
  { code: '1.2.2.001', name: 'Dep. Acum. Equipos de Computación', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.2' },
  { code: '1.2.2.002', name: 'Dep. Acum. Muebles y Enseres', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.2' },
  { code: '1.2.2.003', name: 'Dep. Acum. Equipos de Oficina', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.2' },
  { code: '1.2.2.004', name: 'Dep. Acum. Vehículos', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.2.2' },

  // Cuentas Imputables - Gastos Depreciación
  { code: '6.1.1.001', name: 'Gasto Depreciación Equipos Computación', level_type: 'Imputable', account_type: 'GASTO', parent_code: '6.1' },
  { code: '6.1.1.002', name: 'Gasto Depreciación Muebles y Enseres', level_type: 'Imputable', account_type: 'GASTO', parent_code: '6.1' },
  { code: '6.1.1.003', name: 'Gasto Depreciación Equipos Oficina', level_type: 'Imputable', account_type: 'GASTO', parent_code: '6.1' },
  { code: '6.1.1.004', name: 'Gasto Depreciación Vehículos', level_type: 'Imputable', account_type: 'GASTO', parent_code: '6.1' },

  // Otras cuentas básicas
  { code: '1.1.1.001', name: 'Caja', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.1' },
  { code: '1.1.1.002', name: 'Banco Estado', level_type: 'Imputable', account_type: 'ACTIVO', parent_code: '1.1' }
];

// Crear plan de cuentas básico
export async function createBasicChartOfAccounts() {
  try {
    console.log('🏗️ Creando plan de cuentas básico...');
    
    const accountsToCreate = BASIC_CHART_OF_ACCOUNTS.map(account => ({
      ...account,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .upsert(accountsToCreate, { 
        onConflict: 'code',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Error creando plan de cuentas:', error);
      return BASIC_CHART_OF_ACCOUNTS; // Retornar datos hardcodeados como fallback
    }

    console.log('✅ Plan de cuentas creado:', data.length, 'cuentas');
    return data;

  } catch (error) {
    console.error('❌ Error inesperado creando plan de cuentas:', error);
    return BASIC_CHART_OF_ACCOUNTS; // Retornar datos hardcodeados como fallback
  }
}

// Obtener cuentas del plan contable
export async function getChartOfAccounts(filters: any = {}) {
  try {
    let query = supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('is_active', true)
      .order('code');

    // Aplicar filtros
    if (filters.level_type) {
      query = query.eq('level_type', filters.level_type);
    }
    
    if (filters.account_type) {
      query = query.eq('account_type', filters.account_type);
    }
    
    if (filters.parent_code) {
      query = query.eq('parent_code', filters.parent_code);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo plan de cuentas:', error);
      // Si falla, crear plan básico
      return { data: await createBasicChartOfAccounts(), error: null };
    }

    // Si no hay datos, crear plan básico
    if (!data || data.length === 0) {
      console.log('📋 Plan de cuentas vacío, creando básico...');
      return { data: await createBasicChartOfAccounts(), error: null };
    }

    return { data, error: null };

  } catch (error) {
    console.error('❌ Error inesperado en getChartOfAccounts:', error);
    return { data: await createBasicChartOfAccounts(), error: null };
  }
}

// Obtener cuentas imputables (para activos fijos)
export async function getImputableAccounts(accountType?: string) {
  try {
    const filters: any = { level_type: 'Imputable' };
    if (accountType) {
      filters.account_type = accountType;
    }
    
    return await getChartOfAccounts(filters);
  } catch (error) {
    console.error('❌ Error obteniendo cuentas imputables:', error);
    return { data: [], error };
  }
}

// Validar que una cuenta existe
export async function validateAccountCode(code: string) {
  try {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('code, name, account_type')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    return { exists: !error && data, account: data, error: null };
  } catch (error) {
    return { exists: false, account: null, error };
  }
}