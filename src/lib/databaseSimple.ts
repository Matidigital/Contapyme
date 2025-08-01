// ==========================================
// BASE DE DATOS SIMPLIFICADA - SOLO SUPABASE
// Para trabajar exclusivamente en Netlify
// ==========================================

import { createClient } from '@supabase/supabase-js';

// Configuración Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con privilegios para operaciones de servidor
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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