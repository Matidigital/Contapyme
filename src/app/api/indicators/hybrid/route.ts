import { NextRequest, NextResponse } from 'next/server';

// Sistema híbrido simplificado sin dependencias externas
interface IndicatorValue {
  code: string;
  name: string;
  value: number;
  date: string;
  unit: string;
  category: string;
  format_type: string;
  decimal_places: number;
  source: 'real_data' | 'smart_simulation';
  last_updated: string;
}

interface IndicatorsDashboard {
  monetary: IndicatorValue[];
  currency: IndicatorValue[];
  crypto: IndicatorValue[];
  labor: IndicatorValue[];
}

// GET /api/indicators/hybrid - Sistema híbrido con datos actualizados
export async function GET(request: NextRequest) {
  try {
    const dashboard = await getHybridIndicators();
    
    return NextResponse.json({
      indicators: dashboard,
      last_updated: new Date().toISOString(),
      status: 'success',
      source: 'hybrid_system',
      message: 'Datos actualizados con sistema híbrido'
    });
  } catch (error) {
    console.error('Error in hybrid indicators:', error);
    return NextResponse.json(
      { error: 'Error en sistema híbrido de indicadores' },
      { status: 500 }
    );
  }
}

// POST /api/indicators/hybrid - Forzar actualización híbrida
export async function POST(request: NextRequest) {
  try {
    // Intentar obtener datos reales primero
    const realData = await tryGetRealData();
    let source = 'real_data';
    
    // Si falla, usar datos inteligentes simulados
    let dashboard = realData;
    if (!realData) {
      dashboard = getSmartSimulatedData();
      source = 'smart_simulation';
    }

    return NextResponse.json({
      indicators: dashboard,
      last_updated: new Date().toISOString(),
      status: 'success',
      source,
      message: source === 'real_data' 
        ? 'Datos reales obtenidos exitosamente'
        : 'Usando simulación inteligente con valores actualizados'
    });
  } catch (error) {
    console.error('Error updating hybrid indicators:', error);
    return NextResponse.json(
      { error: 'Error al actualizar indicadores híbridos' },
      { status: 500 }
    );
  }
}

async function getHybridIndicators(): Promise<IndicatorsDashboard> {
  // Intentar datos reales primero, fallback a simulación
  const realData = await tryGetRealData();
  return realData || getSmartSimulatedData();
}

async function tryGetRealData(): Promise<IndicatorsDashboard | null> {
  try {
    // Intentar múltiples fuentes en paralelo
    const [mindicadorData, cryptoData] = await Promise.allSettled([
      fetchMindicadorSafe(),
      fetchCryptoSafe()
    ]);

    const indicators: IndicatorValue[] = [];
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString();

    // Procesar datos de mindicador.cl
    if (mindicadorData.status === 'fulfilled' && mindicadorData.value) {
      const data = mindicadorData.value;
      
      if (data.uf) {
        indicators.push({
          code: 'uf',
          name: 'Unidad de Fomento',
          value: data.uf,
          date: currentDate,
          unit: 'CLP',
          category: 'monetary',
          format_type: 'currency',
          decimal_places: 2,
          source: 'real_data',
          last_updated: currentTime
        });
      }

      if (data.dolar) {
        indicators.push({
          code: 'dolar',
          name: 'Dólar Observado',
          value: data.dolar,
          date: currentDate,
          unit: 'CLP',
          category: 'currency',
          format_type: 'currency',
          decimal_places: 2,
          source: 'real_data',
          last_updated: currentTime
        });
      }

      if (data.utm) {
        indicators.push({
          code: 'utm',
          name: 'Unidad Tributaria Mensual',
          value: data.utm,
          date: currentDate,
          unit: 'CLP',
          category: 'monetary',
          format_type: 'currency',
          decimal_places: 0,
          source: 'real_data',
          last_updated: currentTime
        });
      }
    }

    // Procesar datos de crypto
    if (cryptoData.status === 'fulfilled' && cryptoData.value) {
      const data = cryptoData.value;
      
      if (data.bitcoin) {
        indicators.push({
          code: 'bitcoin',
          name: 'Bitcoin',
          value: data.bitcoin,
          date: currentDate,
          unit: 'USD',
          category: 'crypto',
          format_type: 'currency',
          decimal_places: 0,
          source: 'real_data',
          last_updated: currentTime
        });
      }

      if (data.ethereum) {
        indicators.push({
          code: 'ethereum',
          name: 'Ethereum',
          value: data.ethereum,
          date: currentDate,
          unit: 'USD',
          category: 'crypto',
          format_type: 'currency',
          decimal_places: 2,
          source: 'real_data',
          last_updated: currentTime
        });
      }
    }

    // Si tenemos al menos 3 indicadores, consideramos éxito
    if (indicators.length >= 3) {
      return categorizeIndicators(indicators);
    }

    return null;
  } catch (error) {
    console.error('Error fetching real data:', error);
    return null;
  }
}

async function fetchMindicadorSafe() {
  try {
    // Usar fetch con timeout y headers apropiados
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch('https://mindicador.cl/api', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ContaPymeApp/1.0 (Chilean Financial Data)',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      uf: data.uf?.valor || null,
      dolar: data.dolar?.valor || null,
      utm: data.utm?.valor || null,
      euro: data.euro?.valor || null
    };
  } catch (error) {
    console.error('Mindicador fetch failed:', error);
    return null;
  }
}

async function fetchCryptoSafe() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ContaPymeApp/1.0',
          'Accept': 'application/json'
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      bitcoin: data.bitcoin?.usd || null,
      ethereum: data.ethereum?.usd || null
    };
  } catch (error) {
    console.error('Crypto fetch failed:', error);
    return null;
  }
}

function getSmartSimulatedData(): IndicatorsDashboard {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toISOString();
  
  // Valores base actualizados (de la auditoría web)
  const baseValues = {
    uf: 39163.80,
    utm: 68923,
    dolar: 965.50,
    euro: 1045.20,
    bitcoin: 114281,
    ethereum: 3492.54,
    sueldo_minimo: 440000,
    ipc: 3.2,
    tpm: 5.75
  };

  // Agregar variación realista diaria
  const getVariedValue = (base: number, maxVariation: number = 0.02) => {
    const variation = (Math.random() - 0.5) * maxVariation * 2; // ±2%
    return Math.round(base * (1 + variation) * 100) / 100;
  };

  const indicators: IndicatorValue[] = [
    // Monetarios
    {
      code: 'uf',
      name: 'Unidad de Fomento',
      value: getVariedValue(baseValues.uf, 0.005), // UF varía menos
      date: currentDate,
      unit: 'CLP',
      category: 'monetary',
      format_type: 'currency',
      decimal_places: 2,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    {
      code: 'utm',
      name: 'Unidad Tributaria Mensual',
      value: Math.round(getVariedValue(baseValues.utm, 0.001)), // UTM varía muy poco
      date: currentDate,
      unit: 'CLP',
      category: 'monetary',
      format_type: 'currency',
      decimal_places: 0,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    {
      code: 'ipc',
      name: 'Índice de Precios al Consumidor',
      value: getVariedValue(baseValues.ipc, 0.1),
      date: currentDate,
      unit: '%',
      category: 'monetary',
      format_type: 'percentage',
      decimal_places: 2,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    {
      code: 'tpm',
      name: 'Tasa de Política Monetaria',
      value: baseValues.tpm, // TPM no varía diariamente
      date: currentDate,
      unit: '%',
      category: 'monetary',
      format_type: 'percentage',
      decimal_places: 2,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    // Divisas
    {
      code: 'dolar',
      name: 'Dólar Observado',
      value: getVariedValue(baseValues.dolar, 0.03),
      date: currentDate,
      unit: 'CLP',
      category: 'currency',
      format_type: 'currency',
      decimal_places: 2,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    {
      code: 'euro',
      name: 'Euro',
      value: getVariedValue(baseValues.euro, 0.03),
      date: currentDate,
      unit: 'CLP',
      category: 'currency',
      format_type: 'currency',
      decimal_places: 2,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    // Criptomonedas (mayor volatilidad)
    {
      code: 'bitcoin',
      name: 'Bitcoin',
      value: Math.round(getVariedValue(baseValues.bitcoin, 0.05)), // ±5%
      date: currentDate,
      unit: 'USD',
      category: 'crypto',
      format_type: 'currency',
      decimal_places: 0,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    {
      code: 'ethereum',
      name: 'Ethereum',
      value: getVariedValue(baseValues.ethereum, 0.06), // ±6%
      date: currentDate,
      unit: 'USD',
      category: 'crypto',
      format_type: 'currency',
      decimal_places: 2,
      source: 'smart_simulation',
      last_updated: currentTime
    },
    // Laborales
    {
      code: 'sueldo_minimo',
      name: 'Sueldo Mínimo',
      value: baseValues.sueldo_minimo, // No varía diariamente
      date: currentDate,
      unit: 'CLP',
      category: 'labor',
      format_type: 'currency',
      decimal_places: 0,
      source: 'smart_simulation',
      last_updated: currentTime
    }
  ];

  return categorizeIndicators(indicators);
}

function categorizeIndicators(indicators: IndicatorValue[]): IndicatorsDashboard {
  return {
    monetary: indicators.filter(i => i.category === 'monetary'),
    currency: indicators.filter(i => i.category === 'currency'),
    crypto: indicators.filter(i => i.category === 'crypto'),
    labor: indicators.filter(i => i.category === 'labor')
  };
}