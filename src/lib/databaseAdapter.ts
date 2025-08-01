// ==========================================
// ADAPTADOR DE BASE DE DATOS HÍBRIDO
// SQLite en local, Supabase en producción
// ==========================================

import { isProduction } from './supabaseConfig';

// Importaciones condicionales
let localDB: any = null;
let supabaseDB: any = null;

// Inicializar según entorno
async function initializeDatabase() {
  // Forzar Supabase en Netlify/producción o si SQLite no está disponible
  const useSupabase = isProduction() || process.env.NETLIFY === 'true';
  
  if (useSupabase) {
    // Producción: usar Supabase
    const { insertF29FormSupabase, getF29FormsSupabase, upsertAnalysisSupabase } = await import('./supabaseConfig');
    supabaseDB = { insertF29FormSupabase, getF29FormsSupabase, upsertAnalysisSupabase };
    console.log('🌐 Usando Supabase en producción/Netlify');
  } else {
    // Local: intentar SQLite, fallback a Supabase
    try {
      const { insertF29Form, getF29Forms, upsertAnalysis } = await import('./database');
      localDB = { insertF29Form, getF29Forms, upsertAnalysis };
      console.log('💾 Usando SQLite en desarrollo local');
    } catch (error) {
      console.warn('⚠️ SQLite no disponible, usando Supabase como fallback');
      const { insertF29FormSupabase, getF29FormsSupabase, upsertAnalysisSupabase } = await import('./supabaseConfig');
      supabaseDB = { insertF29FormSupabase, getF29FormsSupabase, upsertAnalysisSupabase };
    }
  }
}

// Funciones adaptativas
export async function insertF29FormAdapter(data: any) {
  if (!localDB && !supabaseDB) {
    await initializeDatabase();
  }

  const useSupabase = isProduction() || process.env.NETLIFY === 'true' || !localDB;
  
  if (useSupabase) {
    return await supabaseDB.insertF29FormSupabase(data);
  } else {
    return await localDB.insertF29Form(data);
  }
}

export async function getF29FormsAdapter(companyId: string, limit = 24) {
  if (!localDB && !supabaseDB) {
    await initializeDatabase();
  }

  const useSupabase = isProduction() || process.env.NETLIFY === 'true' || !localDB;
  
  if (useSupabase) {
    return await supabaseDB.getF29FormsSupabase(companyId, limit);
  } else {
    return await localDB.getF29Forms(companyId, limit);
  }
}

export async function upsertAnalysisAdapter(data: any) {
  if (!localDB && !supabaseDB) {
    await initializeDatabase();
  }

  const useSupabase = isProduction() || process.env.NETLIFY === 'true' || !localDB;
  
  if (useSupabase) {
    return await supabaseDB.upsertAnalysisSupabase(data);
  } else {
    return await localDB.upsertAnalysis(data);
  }
}

// Función para generar datos demo que funcione en ambos entornos
export async function generateDemoDataAdapter() {
  console.log('🎭 Generando datos demo para', isProduction() ? 'producción' : 'desarrollo');

  const companyId = 'demo-company';
  const userId = 'demo-user';

  // Datos de ejemplo consistentes
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
      const { error } = await insertF29FormAdapter(dbRecord);
      
      if (error) {
        console.error(`❌ Error insertando ${data.period}:`, error);
      } else {
        insertedCount++;
        console.log(`✅ Insertado: ${data.period} - Ventas: $${ventas_netas.toLocaleString()}`);
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