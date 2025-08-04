import { NextRequest, NextResponse } from 'next/server';
import { updateIndicatorValue, ensureIndicatorConfig } from '@/lib/databaseSimple';

export const dynamic = 'force-dynamic';

// Rate limiting simple en memoria
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 3; // Máximo 3 requests por minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  const recentRequests = requests.filter((time: number) => time > windowStart);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

// POST /api/indicators/claude-fetch - Obtener indicadores reales usando Claude
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      console.log('⚠️ Rate limit exceeded for:', ip);
      return NextResponse.json(
        { error: 'Demasiadas requests. Inténtalo en un minuto.' },
        { status: 429 }
      );
    }

    const { indicators } = await request.json();
    
    if (!indicators || !Array.isArray(indicators)) {
      return NextResponse.json(
        { error: 'Se requiere array de indicadores a consultar' },
        { status: 400 }
      );
    }

    // Prompt para Claude para obtener valores reales
    const prompt = `Por favor, proporciona los valores actuales (hoy ${new Date().toLocaleDateString('es-CL')}) de los siguientes indicadores económicos chilenos:

${indicators.map(ind => `- ${ind.name} (${ind.code}): ${ind.description || 'valor actual'}`).join('\n')}

IMPORTANTE: 
- Busca los valores más recientes y precisos disponibles
- Para UF y UTM usa fuentes oficiales del Banco Central de Chile
- Para divisas usa tasas de cambio actuales del mercado
- Para criptomonedas usa valores de mercado actuales
- TODOS los valores deben ser NÚMEROS válidos (no null, no undefined, no strings)
- Si no conoces un valor exacto, usa una estimación razonable basada en valores históricos
- Responde SOLO con un JSON válido en este formato exacto:

{
  "indicators": [
    {
      "code": "UF",
      "value": 37784.50,
      "source": "Banco Central de Chile",
      "date": "2025-08-04"
    },
    {
      "code": "UTM", 
      "value": 66443,
      "source": "SII Chile",
      "date": "2025-08-04"
    },
    {
      "code": "USD",
      "value": 950.45,
      "source": "Banco Central de Chile",
      "date": "2025-08-04"
    },
    {
      "code": "EUR",
      "value": 1032.20,
      "source": "Banco Central de Chile",
      "date": "2025-08-04"
    },
    {
      "code": "SUELDO_MIN",
      "value": 500000,
      "source": "Dirección del Trabajo",
      "date": "2025-08-04"
    },
    {
      "code": "BTC",
      "value": 65432.50,
      "source": "CoinGecko",
      "date": "2025-08-04"
    },
    {
      "code": "ETH",
      "value": 3234.75,
      "source": "CoinGecko",
      "date": "2025-08-04"
    },
    {
      "code": "SP500",
      "value": 5547.25,
      "source": "Yahoo Finance",
      "date": "2025-08-04"
    },
    {
      "code": "NASDAQ",
      "value": 17843.73,
      "source": "Yahoo Finance",
      "date": "2025-08-04"
    }
  ],
  "updated_at": "2025-08-04T10:30:00Z",
  "success": true
}

NO agregues texto adicional, solo el JSON. TODOS los campos "value" DEBEN ser números válidos.`;

    // Hacer llamada a Claude con retry logic y modelos alternativos
    let claudeResponse;
    let lastError;
    const maxRetries = 3;
    const models = [
      'claude-3-5-sonnet-20241022', // Modelo principal más reciente
      'claude-3-5-haiku-20241022',  // Modelo de respaldo más reciente
      'claude-3-haiku-20240307'     // Modelo más básico como último recurso
    ];
    
    let modelIndex = 0;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const currentModel = models[modelIndex];
        console.log(`🤖 Intento ${attempt}/${maxRetries} con modelo ${currentModel}...`);
        
        claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: currentModel,
            max_tokens: 1500, // Reducido para ser más conservador
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        if (claudeResponse.ok) {
          console.log('✅ Claude API respondió exitosamente');
          break;
        } else {
          const errorText = await claudeResponse.text();
          lastError = {
            status: claudeResponse.status,
            message: errorText
          };
          
          console.error(`❌ Claude API error (intento ${attempt}):`, claudeResponse.status, errorText);
          
          // Si es error 404 (modelo no encontrado), probar siguiente modelo
          if (claudeResponse.status === 404) {
            console.error(`❌ Error 404: Modelo ${models[modelIndex]} no encontrado.`);
            modelIndex++;
            
            if (modelIndex < models.length) {
              console.log(`🔄 Probando siguiente modelo: ${models[modelIndex]}`);
              continue; // Probar siguiente modelo
            } else {
              console.error('❌ Todos los modelos de Claude fallaron con 404.');
              lastError = {
                status: claudeResponse.status,
                message: errorText,
                modelError: true
              };
              break; // No más modelos para probar
            }
          }
          
          // Si es error 40x (rate limit o auth), esperar más tiempo
          if (claudeResponse.status >= 400 && claudeResponse.status < 500) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`⏱️ Esperando ${waitTime}ms antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      } catch (fetchError) {
        console.error(`❌ Error de red en intento ${attempt}:`, fetchError);
        lastError = fetchError;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!claudeResponse || !claudeResponse.ok) {
      console.error('❌ Todos los intentos de Claude fallaron:', lastError);
      return NextResponse.json(
        { 
          error: 'Claude API no disponible temporalmente. Usando sistema de respaldo.',
          claude_error: lastError,
          fallback_active: true
        },
        { status: 503 }
      );
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: 'Respuesta vacía de Claude' },
        { status: 500 }
      );
    }

    // Parsear respuesta JSON de Claude
    let parsedResponse;
    try {
      // Extraer JSON de la respuesta (en caso de que tenga texto adicional)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      parsedResponse = JSON.parse(jsonString);
      
      console.log('📝 Claude response parsed:', JSON.stringify(parsedResponse, null, 2));
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      console.error('Claude response:', content);
      return NextResponse.json(
        { error: 'Respuesta inválida de Claude', debug: content },
        { status: 500 }
      );
    }

    if (!parsedResponse.indicators || !Array.isArray(parsedResponse.indicators)) {
      console.error('❌ Formato inválido de respuesta:', parsedResponse);
      return NextResponse.json(
        { error: 'Formato de respuesta inválido de Claude' },
        { status: 500 }
      );
    }

    // Asegurar que existe la configuración de indicadores antes de actualizar
    await ensureIndicatorConfig();
    
    // Actualizar valores en la base de datos
    const updateResults = [];
    
    for (const indicator of parsedResponse.indicators) {
      try {
        // Validar que el indicador tenga un valor válido
        if (indicator.value === null || indicator.value === undefined || isNaN(indicator.value)) {
          console.error(`❌ Valor inválido para ${indicator.code}:`, indicator.value);
          updateResults.push({
            code: indicator.code,
            value: null,
            success: false,
            error: `Valor inválido: ${indicator.value}`
          });
          continue;
        }
        
        const { data, error } = await updateIndicatorValue(
          indicator.code,
          Number(indicator.value), // Asegurar que es número
          indicator.date || new Date().toISOString().split('T')[0]
        );

        updateResults.push({
          code: indicator.code,
          value: indicator.value,
          source: indicator.source,
          success: !error,
          error: error?.message
        });

        if (!error && data) {
          console.log(`✅ Updated ${indicator.code}: $${indicator.value.toLocaleString()}`);
        } else {
          console.error(`❌ Failed to update ${indicator.code}:`, error);
          // Intentar crear el indicador si el error es que no existe
          if (error?.code === 'PGRST116') {
            console.log(`🔄 Intentando crear indicador ${indicator.code} que no existe...`);
          }
        }
      } catch (updateError) {
        console.error(`Error updating ${indicator.code}:`, updateError);
        updateResults.push({
          code: indicator.code,
          value: indicator.value,
          success: false,
          error: updateError.message
        });
      }
    }

    const successCount = updateResults.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Actualizados ${successCount}/${updateResults.length} indicadores usando Claude`,
      results: updateResults,
      claude_response: parsedResponse,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Claude fetch API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}