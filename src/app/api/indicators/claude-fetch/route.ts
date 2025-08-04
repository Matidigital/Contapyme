import { NextRequest, NextResponse } from 'next/server';
import { updateIndicatorValue } from '@/lib/databaseSimple';

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
- Responde SOLO con un JSON válido en este formato exacto:

{
  "indicators": [
    {
      "code": "UF",
      "value": 37284.50,
      "source": "Banco Central de Chile",
      "date": "2025-01-04"
    },
    {
      "code": "UTM", 
      "value": 65443,
      "source": "SII Chile",
      "date": "2025-01-04"
    }
    // ... etc para todos los indicadores solicitados
  ],
  "updated_at": "2025-01-04T10:30:00Z",
  "success": true
}

NO agregues texto adicional, solo el JSON.`;

    // Hacer llamada a Claude con retry logic
    let claudeResponse;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Intento ${attempt}/${maxRetries} de llamada a Claude...`);
        
        claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
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
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      console.error('Claude response:', content);
      return NextResponse.json(
        { error: 'Respuesta inválida de Claude', debug: content },
        { status: 500 }
      );
    }

    if (!parsedResponse.indicators || !Array.isArray(parsedResponse.indicators)) {
      return NextResponse.json(
        { error: 'Formato de respuesta inválido de Claude' },
        { status: 500 }
      );
    }

    // Actualizar valores en la base de datos
    const updateResults = [];
    
    for (const indicator of parsedResponse.indicators) {
      try {
        const { data, error } = await updateIndicatorValue(
          indicator.code,
          indicator.value,
          indicator.date || new Date().toISOString().split('T')[0]
        );

        updateResults.push({
          code: indicator.code,
          value: indicator.value,
          source: indicator.source,
          success: !error,
          error: error?.message
        });

        if (!error) {
          console.log(`✅ Updated ${indicator.code}: $${indicator.value.toLocaleString()}`);
        } else {
          console.error(`❌ Failed to update ${indicator.code}:`, error);
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