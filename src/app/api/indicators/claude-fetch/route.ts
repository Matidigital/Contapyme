import { NextRequest, NextResponse } from 'next/server';
import { updateIndicatorValue } from '@/lib/databaseSimple';

export const dynamic = 'force-dynamic';

// POST /api/indicators/claude-fetch - Obtener indicadores reales usando Claude
export async function POST(request: NextRequest) {
  try {
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

    // Hacer llamada a la API de Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      console.error('Claude API error:', claudeResponse.status);
      return NextResponse.json(
        { error: 'Error al consultar Claude API' },
        { status: claudeResponse.status }
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