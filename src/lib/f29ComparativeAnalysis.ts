// ==========================================
// MOTOR DE ANÁLISIS COMPARATIVO F29
// Genera insights automáticos de múltiples formularios
// ==========================================

import { getF29Forms, upsertAnalysis } from './databaseSimple';

export interface F29FormData {
  id: string;
  period: string;
  year: number;
  month: number;
  ventas_netas: number;
  compras_netas: number;
  iva_debito: number;
  iva_credito: number;
  iva_determinado: number;
  margen_bruto: number;
  confidence_score: number;
  file_name: string;
  created_at: string;
}

export interface ComparativeAnalysis {
  // Datos temporales
  periods: string[];
  ventas: number[];
  compras: number[];
  margen: number[];
  iva_pagado: number[];
  
  // Análisis automático
  tendencias: {
    crecimiento_ventas: number;
    eficiencia_compras: number;
    salud_financiera: 'excelente' | 'buena' | 'regular' | 'preocupante';
    estacionalidad: Record<string, number>;
  };
  
  // Insights automáticos
  insights: {
    mejor_mes: { period: string; ventas: number; motivo: string };
    peor_mes: { period: string; ventas: number; motivo: string };
    anomalias: Array<{ period: string; tipo: string; descripcion: string }>;
    proyecciones: Array<{ period: string; ventas_proyectadas: number }>;
  };
  
  // Métricas ejecutivas
  metricas_ejecutivas: {
    total_ventas_periodo: number;
    promedio_mensual: number;
    mejor_trimestre: string;
    crecimiento_anual: number;
    eficiencia_fiscal: number;
  };
}

export async function generateComparativeAnalysis(companyId: string): Promise<ComparativeAnalysis | null> {
  try {
    console.log('📊 Generando análisis comparativo para empresa:', companyId);

    // 1. Obtener últimos 24 meses de datos
    const { data: forms, error } = await getF29Forms(companyId, 24);

    if (error) {
      console.error('❌ Error obteniendo datos F29:', error);
      return null;
    }

    if (!forms || forms.length < 3) {
      console.warn('⚠️ Necesitas al menos 3 meses de datos para análisis comparativo');
      return null;
    }

    console.log(`📈 Analizando ${forms.length} formularios F29`);

    // 2. Preparar datos temporales
    const periods = forms.map(f => f.period);
    const ventas = forms.map(f => f.ventas_netas || 0);
    const compras = forms.map(f => f.compras_netas || 0);
    const margen = forms.map(f => f.margen_bruto || 0);
    const iva_pagado = forms.map(f => Math.max(0, f.iva_determinado + f.ppm + f.remanente) || 0);

    // 3. Calcular tendencias principales
    const tendencias = calculateTrends(forms);

    // 4. Generar insights automáticos
    const insights = generateAutomaticInsights(forms);

    // 5. Calcular métricas ejecutivas
    const metricas_ejecutivas = calculateExecutiveMetrics(forms);

    const analysis: ComparativeAnalysis = {
      periods,
      ventas,
      compras,
      margen,
      iva_pagado,
      tendencias,
      insights,
      metricas_ejecutivas
    };

    // 6. Cachear el análisis
    await cacheAnalysis(companyId, analysis);

    console.log('✅ Análisis comparativo generado exitosamente');
    return analysis;

  } catch (error) {
    console.error('💥 Error generando análisis comparativo:', error);
    return null;
  }
}

function calculateTrends(forms: F29FormData[]) {
  // Crecimiento de ventas (anualizado)
  const crecimiento_ventas = calculateGrowthRate(forms.map(f => f.ventas_netas));
  
  // Eficiencia de compras (ratio compras/ventas promedio)
  const ratios = forms
    .filter(f => f.ventas_netas > 0)
    .map(f => f.compras_netas / f.ventas_netas);
  const eficiencia_compras = ratios.length > 0 
    ? 1 - (ratios.reduce((a, b) => a + b, 0) / ratios.length)
    : 0;

  // Salud financiera basada en múltiples factores
  const salud_financiera = assessFinancialHealth(forms);

  // Estacionalidad por mes
  const estacionalidad = detectSeasonality(forms);

  return {
    crecimiento_ventas,
    eficiencia_compras,
    salud_financiera,
    estacionalidad
  };
}

function calculateGrowthRate(ventas: number[]): number {
  if (ventas.length < 2) return 0;
  
  // Crecimiento simple: comparar último trimestre vs primer trimestre
  const primeros = ventas.slice(0, Math.min(3, Math.floor(ventas.length / 2)));
  const ultimos = ventas.slice(-Math.min(3, Math.floor(ventas.length / 2)));
  
  const promedioInicial = primeros.reduce((a, b) => a + b, 0) / primeros.length;
  const promedioFinal = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
  
  if (promedioInicial === 0) return 0;
  
  const crecimientoMensual = (promedioFinal - promedioInicial) / promedioInicial;
  
  // Anualizar el crecimiento
  const mesesComparados = ventas.length;
  const factorAnualizacion = 12 / Math.max(mesesComparados, 1);
  
  return crecimientoMensual * factorAnualizacion * 100;
}

function assessFinancialHealth(forms: F29FormData[]): 'excelente' | 'buena' | 'regular' | 'preocupante' {
  let score = 0;
  
  // Factor 1: Consistencia en ventas
  const ventas = forms.map(f => f.ventas_netas).filter(v => v > 0);
  if (ventas.length >= 3) {
    const cv = calculateCoefficientOfVariation(ventas);
    if (cv < 0.2) score += 25; // Ventas consistentes
    else if (cv < 0.4) score += 15;
    else if (cv < 0.6) score += 5;
  }
  
  // Factor 2: Márgenes positivos
  const margenesPositivos = forms.filter(f => f.margen_bruto > 0).length;
  const porcentajeMargenesPositivos = margenesPositivos / forms.length;
  if (porcentajeMargenesPositivos >= 0.9) score += 25;
  else if (porcentajeMargenesPositivos >= 0.7) score += 15;
  else if (porcentajeMargenesPositivos >= 0.5) score += 5;
  
  // Factor 3: Crecimiento
  const crecimiento = calculateGrowthRate(ventas);
  if (crecimiento > 10) score += 25;
  else if (crecimiento > 0) score += 15;
  else if (crecimiento > -10) score += 5;
  
  // Factor 4: Eficiencia fiscal (IVA bien manejado)
  const ivaProblemas = forms.filter(f => 
    f.iva_determinado < -f.ventas_netas * 0.05 || // IVA muy negativo
    f.iva_determinado > f.ventas_netas * 0.25     // IVA muy alto
  ).length;
  const eficienciaFiscal = 1 - (ivaProblemas / forms.length);
  if (eficienciaFiscal >= 0.9) score += 25;
  else if (eficienciaFiscal >= 0.7) score += 15;
  else if (eficienciaFiscal >= 0.5) score += 5;
  
  // Clasificar según score
  if (score >= 80) return 'excelente';
  if (score >= 60) return 'buena';
  if (score >= 40) return 'regular';
  return 'preocupante';
}

function detectSeasonality(forms: F29FormData[]): Record<string, number> {
  const ventasPorMes: Record<number, number[]> = {};
  
  // Agrupar ventas por mes
  forms.forEach(form => {
    const mes = form.month;
    if (!ventasPorMes[mes]) ventasPorMes[mes] = [];
    ventasPorMes[mes].push(form.ventas_netas);
  });
  
  // Calcular promedio por mes
  const promedioGeneral = forms.reduce((sum, f) => sum + f.ventas_netas, 0) / forms.length;
  const estacionalidad: Record<string, number> = {};
  
  for (let mes = 1; mes <= 12; mes++) {
    if (ventasPorMes[mes] && ventasPorMes[mes].length > 0) {
      const promedioMes = ventasPorMes[mes].reduce((a, b) => a + b, 0) / ventasPorMes[mes].length;
      const factor = promedioMes / promedioGeneral;
      estacionalidad[mes.toString().padStart(2, '0')] = factor;
    }
  }
  
  return estacionalidad;
}

function generateAutomaticInsights(forms: F29FormData[]) {
  const sortedByVentas = [...forms].sort((a, b) => a.ventas_netas - b.ventas_netas);
  
  const mejor_mes = {
    period: sortedByVentas[sortedByVentas.length - 1].period,
    ventas: sortedByVentas[sortedByVentas.length - 1].ventas_netas,
    motivo: generateMotivo(sortedByVentas[sortedByVentas.length - 1], 'mejor')
  };
  
  const peor_mes = {
    period: sortedByVentas[0].period,
    ventas: sortedByVentas[0].ventas_netas,
    motivo: generateMotivo(sortedByVentas[0], 'peor')
  };
  
  // Detectar anomalías
  const anomalias = detectAnomalies(forms);
  
  // Generar proyecciones simples
  const proyecciones = generateProjections(forms);
  
  return {
    mejor_mes,
    peor_mes,
    anomalias,
    proyecciones
  };
}

function generateMotivo(form: F29FormData, tipo: 'mejor' | 'peor'): string {
  const mes = getMonthName(form.month);
  
  if (tipo === 'mejor') {
    if (form.month === 12) return `Diciembre típicamente es un mes fuerte por las fiestas`;
    if (form.month >= 10) return `${mes} suele ser bueno para el cierre del año`;
    if (form.month >= 6 && form.month <= 8) return `${mes} beneficiado por el invierno`;
    return `${mes} mostró un rendimiento excepcional`;
  } else {
    if (form.month === 1 || form.month === 2) return `${mes} típicamente es más lento post-fiestas`;
    if (form.month >= 3 && form.month <= 5) return `${mes} puede ser afectado por cambios estacionales`;
    return `${mes} requiere análisis adicional para mejoras`;
  }
}

function detectAnomalies(forms: F29FormData[]): Array<{ period: string; tipo: string; descripcion: string }> {
  const anomalias: Array<{ period: string; tipo: string; descripcion: string }> = [];
  
  // Detectar caídas abruptas
  for (let i = 1; i < forms.length; i++) {
    const actual = forms[i].ventas_netas;
    const anterior = forms[i - 1].ventas_netas;
    
    if (anterior > 0 && actual > 0) {
      const cambio = (actual - anterior) / anterior;
      
      if (cambio < -0.3) {
        anomalias.push({
          period: forms[i].period,
          tipo: 'caida_abrupta',
          descripcion: `Caída del ${Math.abs(cambio * 100).toFixed(1)}% vs mes anterior`
        });
      } else if (cambio > 0.5) {
        anomalias.push({
          period: forms[i].period,
          tipo: 'crecimiento_atipico',
          descripcion: `Crecimiento excepcional del ${(cambio * 100).toFixed(1)}%`
        });
      }
    }
  }
  
  // Detectar márgenes negativos consecutivos
  let mesesMargenNegativo = 0;
  for (const form of forms) {
    if (form.margen_bruto < 0) {
      mesesMargenNegativo++;
    } else {
      if (mesesMargenNegativo >= 2) {
        anomalias.push({
          period: form.period,
          tipo: 'margen_negativo',
          descripcion: `${mesesMargenNegativo} meses consecutivos con margen negativo`
        });
      }
      mesesMargenNegativo = 0;
    }
  }
  
  return anomalias;
}

function generateProjections(forms: F29FormData[]): Array<{ period: string; ventas_proyectadas: number }> {
  if (forms.length < 3) return [];
  
  // Proyección simple basada en tendencia
  const ultimosTres = forms.slice(-3);
  const promedioUltimosTres = ultimosTres.reduce((sum, f) => sum + f.ventas_netas, 0) / 3;
  
  const crecimientoPromedio = calculateGrowthRate(forms.map(f => f.ventas_netas)) / 100 / 12;
  
  const proyecciones = [];
  for (let i = 1; i <= 3; i++) {
    const ultimoPeriodo = forms[forms.length - 1].period;
    const year = parseInt(ultimoPeriodo.substring(0, 4));
    const month = parseInt(ultimoPeriodo.substring(4, 6));
    
    let nuevoMes = month + i;
    let nuevoYear = year;
    
    if (nuevoMes > 12) {
      nuevoMes = nuevoMes - 12;
      nuevoYear++;
    }
    
    const nuevoPeriodo = `${nuevoYear}${nuevoMes.toString().padStart(2, '0')}`;
    const ventasProyectadas = promedioUltimosTres * (1 + crecimientoPromedio) ** i;
    
    proyecciones.push({
      period: nuevoPeriodo,
      ventas_proyectadas: Math.round(ventasProyectadas)
    });
  }
  
  return proyecciones;
}

function calculateExecutiveMetrics(forms: F29FormData[]) {
  const totalVentas = forms.reduce((sum, f) => sum + f.ventas_netas, 0);
  const promedioMensual = totalVentas / forms.length;
  
  // Mejor trimestre
  const trimestres = groupByQuarter(forms);
  const mejorTrimestre = Object.entries(trimestres)
    .map(([key, forms]) => ({
      trimestre: key,
      ventas: forms.reduce((sum, f) => sum + f.ventas_netas, 0)
    }))
    .sort((a, b) => b.ventas - a.ventas)[0]?.trimestre || '';
  
  const crecimientoAnual = calculateGrowthRate(forms.map(f => f.ventas_netas));
  
  // Eficiencia fiscal: qué tan bien maneja sus obligaciones tributarias
  const ivaPromedio = forms.reduce((sum, f) => sum + f.iva_determinado, 0) / forms.length;
  const ventasPromedio = forms.reduce((sum, f) => sum + f.ventas_netas, 0) / forms.length;
  const eficienciaFiscal = ventasPromedio > 0 
    ? Math.max(0, Math.min(100, 100 - Math.abs(ivaPromedio / ventasPromedio) * 100))
    : 0;
  
  return {
    total_ventas_periodo: totalVentas,
    promedio_mensual: promedioMensual,
    mejor_trimestre: mejorTrimestre,
    crecimiento_anual: crecimientoAnual,
    eficiencia_fiscal: eficienciaFiscal
  };
}

// Funciones auxiliares
function calculateCoefficientOfVariation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? stdDev / mean : 0;
}

function groupByQuarter(forms: F29FormData[]): Record<string, F29FormData[]> {
  const quarters: Record<string, F29FormData[]> = {};
  
  forms.forEach(form => {
    const quarter = Math.ceil(form.month / 3);
    const key = `${form.year}Q${quarter}`;
    if (!quarters[key]) quarters[key] = [];
    quarters[key].push(form);
  });
  
  return quarters;
}

function getMonthName(month: number): string {
  const nombres = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return nombres[month] || `Mes ${month}`;
}

async function cacheAnalysis(companyId: string, analysis: ComparativeAnalysis) {
  try {
    const periodStart = analysis.periods[0];
    const periodEnd = analysis.periods[analysis.periods.length - 1];
    
    const { error } = await upsertAnalysis({
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      analysis_data: analysis,
      total_periods: analysis.periods.length,
      avg_monthly_sales: analysis.metricas_ejecutivas.promedio_mensual,
      growth_rate: analysis.tendencias.crecimiento_ventas,
      best_month: analysis.insights.mejor_mes.period,
      worst_month: analysis.insights.peor_mes.period,
      insights: analysis.insights,
      trends: analysis.tendencias,
      seasonality: analysis.tendencias.estacionalidad,
      anomalies: analysis.insights.anomalias,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
    });
    
    if (error) {
      console.error('❌ Error cacheando análisis:', error);
    } else {
      console.log('💾 Análisis cacheado exitosamente');
    }
  } catch (error) {
    console.error('💥 Error en caché de análisis:', error);
  }
}