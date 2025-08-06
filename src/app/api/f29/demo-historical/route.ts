import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  console.log('🎭 F29 Demo Historical API: Creando datos históricos demo...');
  
  try {
    const { companyId = '550e8400-e29b-41d4-a716-446655440001', userId = '550e8400-e29b-41d4-a716-446655440000' } = await request.json();

    // Generar 18 meses de datos históricos (Ene 2023 - Jun 2024)
    const demoF29Records = [];
    
    for (let year = 2023; year <= 2024; year++) {
      const maxMonth = year === 2024 ? 6 : 12; // Solo hasta junio 2024
      
      for (let month = 1; month <= maxMonth; month++) {
        const period = `${year}${String(month).padStart(2, '0')}`;
        
        // Simular estacionalidad real de un negocio chileno
        let seasonalFactor = 1.0;
        if (month >= 11 || month <= 2) seasonalFactor = 1.3; // Nov-Feb alto (verano/fiestas)
        else if (month >= 6 && month <= 8) seasonalFactor = 0.8; // Jun-Ago bajo (invierno)
        
        // Tendencia de crecimiento anual
        const growthFactor = year === 2023 ? 1.0 : 1.15; // 15% crecimiento 2024
        
        // Variación mensual aleatoria
        const randomVariation = 0.85 + Math.random() * 0.3; // ±15%
        
        // Ventas base de $18M mensuales
        const baseVentas = 18000000;
        const ventasNetas = Math.round(baseVentas * seasonalFactor * growthFactor * randomVariation);
        
        // Compras como % de ventas (65-75%)
        const comprasRatio = 0.65 + Math.random() * 0.1;
        const comprasNetas = Math.round(ventasNetas * comprasRatio);
        
        // Cálculos IVA
        const codigo538 = Math.round(ventasNetas * 0.19); // Débito fiscal
        const codigo511 = Math.round(comprasNetas * 0.19); // Crédito fiscal  
        const ivaDeterminado = codigo538 - codigo511;
        
        // PPM (1% de ventas)
        const ppm = Math.round(ventasNetas * 0.01);
        
        // Remanente (simulado)
        const remanente = Math.max(0, Math.round(Math.random() * 500000));
        
        // Total a pagar
        const totalAPagar = Math.max(0, ivaDeterminado + ppm + remanente);
        
        // Margen bruto
        const margenBruto = ventasNetas - comprasNetas;
        
        const demoRecord = {
          user_id: userId,
          company_id: companyId,
          period: period,
          file_name: `F29_${getMonthName(month)}_${year}_Demo.pdf`,
          year: year,
          month: month,
          rut: '76.123.456-7',
          folio: `${year}${String(month).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          
          // Datos JSON
          raw_data: {
            rut: '76.123.456-7',
            periodo: period,
            codigo538: codigo538,
            codigo511: codigo511,
            codigo563: ventasNetas,
            codigo062: ppm,
            codigo077: remanente,
            ventasNetas: ventasNetas,
            comprasNetas: comprasNetas,
            debitoFiscal: codigo538,
            creditoFiscal: codigo511,
            ivaDeterminado: ivaDeterminado,
            ppm: ppm,
            remanente: remanente,
            totalAPagar: totalAPagar,
            margenBruto: margenBruto,
            method: 'demo_generator',
            confidence: 95
          },
          calculated_data: {
            method: 'demo_generator',
            confidence: 95,
            processing_time: new Date().toISOString(),
            seasonal_factor: seasonalFactor,
            growth_factor: growthFactor
          },
          
          // Campos principales
          ventas_netas: ventasNetas,
          compras_netas: comprasNetas,
          iva_debito: codigo538,
          iva_credito: codigo511,
          iva_determinado: ivaDeterminado,
          ppm: ppm,
          remanente: remanente,
          total_a_pagar: totalAPagar,
          margen_bruto: margenBruto,
          
          // Códigos específicos
          codigo_538: codigo538,
          codigo_511: codigo511,
          codigo_563: ventasNetas,
          codigo_062: ppm,
          codigo_077: remanente,
          
          // Validación
          confidence_score: 95,
          validation_status: 'validated',
          validation_errors: []
        };
        
        demoF29Records.push(demoRecord);
      }
    }

    console.log(`📊 Generando ${demoF29Records.length} F29 demo históricos...`);

    // Insertar en lotes para evitar timeouts
    const batchSize = 6;
    let insertedCount = 0;
    
    for (let i = 0; i < demoF29Records.length; i += batchSize) {
      const batch = demoF29Records.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('f29_forms')
        .upsert(batch, {
          onConflict: 'company_id,period',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.warn(`⚠️ Error en lote ${Math.floor(i/batchSize) + 1}:`, error);
      } else {
        insertedCount += batch.length;
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} insertado (${batch.length} registros)`);
      }
      
      // Pequeña pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Calcular estadísticas
    const totalVentas = demoF29Records.reduce((sum, record) => sum + record.ventas_netas, 0);
    const promedioMensual = totalVentas / demoF29Records.length;
    const primerPeriodo = demoF29Records[0];
    const ultimoPeriodo = demoF29Records[demoF29Records.length - 1];
    const crecimiento = ((ultimoPeriodo.ventas_netas - primerPeriodo.ventas_netas) / primerPeriodo.ventas_netas) * 100;

    return NextResponse.json({
      success: true,
      message: `${insertedCount} F29 históricos demo creados exitosamente`,
      summary: {
        total_records: insertedCount,
        period_range: `${demoF29Records[0].period} - ${demoF29Records[demoF29Records.length - 1].period}`,
        total_ventas: totalVentas,
        promedio_mensual: Math.round(promedioMensual),
        crecimiento_periodo: Math.round(crecimiento * 100) / 100,
        mejor_mes: demoF29Records.reduce((max, current) => 
          current.ventas_netas > max.ventas_netas ? current : max
        ),
        peor_mes: demoF29Records.reduce((min, current) => 
          current.ventas_netas < min.ventas_netas ? current : min
        )
      },
      company_id: companyId,
      user_id: userId
    });

  } catch (error) {
    console.error('❌ Error creando F29 históricos demo:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Error creando datos demo'
    }, { status: 500 });
  }
}

// Función auxiliar para nombres de meses
function getMonthName(month: number): string {
  const months = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month] || month.toString();
}