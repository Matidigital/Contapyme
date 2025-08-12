/**
 * Servicio para obtener indicadores económicos actualizados
 * Integra con el módulo de indicadores para valores en tiempo real
 */

import { getIndicatorsDashboard } from '@/lib/database/databaseSimple';

export interface EconomicIndicators {
  minimum_wage: number;
  uf: number;
  utm: number;
  ipc: number;
  tpm: number;
  usd: number;
  eur: number;
  last_updated: string;
}

/**
 * Obtiene indicadores económicos desde la base de datos
 * SIMPLIFICADO: Usa valores por defecto para evitar errores de integración
 */
export async function getEconomicIndicators(): Promise<EconomicIndicators> {
  try {
    // TEMPORAL: Usar valores por defecto mientras se resuelve la integración
    console.log('Usando indicadores económicos por defecto (modo seguro)');
    return getDefaultIndicators();
    
    /* CODIGO ORIGINAL COMENTADO PARA DEBUGGING:
    const { data, error } = await getIndicatorsDashboard();
    
    if (error || !data) {
      console.warn('Error obteniendo indicadores, usando valores por defecto:', error);
      return getDefaultIndicators();
    }

    // Verificar que data sea un array antes de usar .find()
    if (!Array.isArray(data)) {
      console.warn('Los datos de indicadores no son un array, usando valores por defecto');
      return getDefaultIndicators();
    }

    // Extraer valores de los indicadores organizados por categoría
    const indicators: EconomicIndicators = {
      minimum_wage: 529000, // Valor por defecto si no se encuentra
      uf: 0,
      utm: 0,
      ipc: 0,
      tpm: 0,
      usd: 0,
      eur: 0,
      last_updated: new Date().toISOString()
    };

    // Buscar sueldo mínimo en la categoría laboral
    const laborCategory = data.find(cat => cat && cat.category === 'laboral');
    if (laborCategory && laborCategory.indicators && Array.isArray(laborCategory.indicators)) {
      const minimumWageIndicator = laborCategory.indicators.find(
        ind => ind && (ind.code === 'SUELDO_MINIMO' || ind.code === 'minimum_wage')
      );
      if (minimumWageIndicator) {
        indicators.minimum_wage = minimumWageIndicator.current_value;
        indicators.last_updated = minimumWageIndicator.last_updated || indicators.last_updated;
      }
    }

    // Buscar otros indicadores útiles para remuneraciones
    const monetaryCategory = data.find(cat => cat && cat.category === 'monetarios');
    if (monetaryCategory && monetaryCategory.indicators && Array.isArray(monetaryCategory.indicators)) {
      const ufIndicator = monetaryCategory.indicators.find(ind => ind && ind.code === 'UF');
      if (ufIndicator) {
        indicators.uf = ufIndicator.current_value;
      }
      
      const utmIndicator = monetaryCategory.indicators.find(ind => ind && ind.code === 'UTM');
      if (utmIndicator) {
        indicators.utm = utmIndicator.current_value;
      }
    }

    const currencyCategory = data.find(cat => cat && cat.category === 'divisas');
    if (currencyCategory && currencyCategory.indicators && Array.isArray(currencyCategory.indicators)) {
      const usdIndicator = currencyCategory.indicators.find(ind => ind && ind.code === 'USD');
      if (usdIndicator) {
        indicators.usd = usdIndicator.current_value;
      }
    }

    return indicators;
    */
  } catch (error) {
    console.error('Error obteniendo indicadores económicos:', error);
    return getDefaultIndicators();
  }
}

/**
 * Valores por defecto cuando no se pueden obtener desde la base de datos
 */
function getDefaultIndicators(): EconomicIndicators {
  return {
    minimum_wage: 529000, // Sueldo mínimo Chile 2025
    uf: 37800, // Valor aproximado UF
    utm: 66391, // Valor aproximado UTM
    ipc: 0,
    tpm: 5.75, // Tasa política monetaria aproximada
    usd: 950, // Aproximado
    eur: 1000, // Aproximado
    last_updated: new Date().toISOString()
  };
}

/**
 * Obtiene solo el sueldo mínimo actualizado
 * Función optimizada para cálculos de remuneraciones
 */
export async function getCurrentMinimumWage(): Promise<number> {
  try {
    const indicators = await getEconomicIndicators();
    // Validar que el sueldo mínimo sea un número válido
    if (typeof indicators.minimum_wage === 'number' && indicators.minimum_wage > 0) {
      return indicators.minimum_wage;
    } else {
      console.warn('Sueldo mínimo no válido, usando valor por defecto');
      return 529000; // Valor por defecto Chile 2025
    }
  } catch (error) {
    console.error('Error obteniendo sueldo mínimo, usando valor por defecto:', error);
    return 529000; // Valor por defecto Chile 2025
  }
}

/**
 * Calcula el tope de gratificación legal según Art. 50
 * Tope: 4.75 sueldos mínimos dividido por 12 meses
 */
export async function calculateGratificationCap(): Promise<number> {
  const minimumWage = await getCurrentMinimumWage();
  const monthlyCap = (minimumWage * 4.75) / 12;
  return Math.round(monthlyCap);
}

/**
 * Cache simple para evitar múltiples requests en la misma sesión
 */
const indicatorsCache = new Map<string, { data: EconomicIndicators; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Versión con cache para mejor performance
 */
export async function getCachedEconomicIndicators(): Promise<EconomicIndicators> {
  const cacheKey = 'economic_indicators';
  const now = Date.now();
  const cached = indicatorsCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const indicators = await getEconomicIndicators();
  indicatorsCache.set(cacheKey, { data: indicators, timestamp: now });
  
  return indicators;
}