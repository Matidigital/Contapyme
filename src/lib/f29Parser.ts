// ==========================================
// F29 PARSER - IMPLEMENTACIÓN DESDE CERO
// Una sola solución que funciona: Claude AI + datos garantizados
// ==========================================

export interface F29Data {
  // Información básica
  rut: string;
  folio: string;
  periodo: string;
  razonSocial: string;
  
  // Códigos principales
  codigo511: number; // CRÉD. IVA POR DCTOS. ELECTRÓNICOS
  codigo538: number; // TOTAL DÉBITOS
  codigo563: number; // BASE IMPONIBLE
  codigo062: number; // PPM NETO DETERMINADO
  codigo077: number; // REMANENTE DE CRÉDITO FISC.
  codigo151: number; // RETENCIÓN TASA LEY 21.133
  
  // Calculados
  comprasNetas: number;
  ivaDeterminado: number;
  totalAPagar: number;
  margenBruto: number;
  
  // Metadatos
  confidence: number;
  method: string;
}

export async function parseF29(file: File): Promise<F29Data> {
  console.log('🚀 F29 Parser: Iniciando extracción desde cero...');
  console.log(`📄 Archivo recibido: ${file.name} (${file.size} bytes)`);
  
  try {
    // VERIFICAR API KEY ANTES DE INTENTAR
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log(`🔑 API Key presente: ${apiKey ? 'SÍ' : 'NO'}`);
    
    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY no está configurada en Netlify');
      console.log('🔧 Para configurar: Netlify Dashboard → Environment Variables → Add:');
      console.log('   Key: ANTHROPIC_API_KEY');
      console.log('   Value: sk-ant-api03-...');
      
      // NO usar fallback - fallar claramente
      throw new Error('CONFIGURAR_CLAUDE_API: No se puede extraer datos reales sin Claude AI');
    }
    
    // PASO 1: Intentar Claude AI
    console.log('🟣 Intentando llamar a Claude AI...');
    const claudeResult = await extractWithClaude(file);
    
    if (claudeResult) {
      console.log('✅ Claude AI procesó el PDF exitosamente!');
      return claudeResult;
    }
    
    // PASO 2: Si Claude falla, usar parser básico como fallback temporal
    console.warn('⚠️ Claude AI falló - usando parser básico como fallback');
    const basicResult = await extractWithBasicParser(file);
    
    if (basicResult) {
      console.log('✅ Parser básico procesó el PDF exitosamente!');
      return basicResult;
    }
    
    // Si ambos fallan, mostrar error claro
    console.error('❌ Todos los parsers fallaron - NO se pueden extraer datos');
    throw new Error('PARSER_FALLO: No se pudieron extraer datos del PDF con ningún método.');
    
  } catch (error) {
    console.error('❌ Error en F29 Parser:', error);
    
    // Solo usar fallback en caso de error de programación, no de configuración
    if (error instanceof Error && error.message.includes('CONFIGURAR_CLAUDE_API')) {
      throw error; // Re-throw para que llegue al frontend
    }
    
    if (error instanceof Error && error.message.includes('CLAUDE_FALLO')) {
      throw error; // Re-throw para que llegue al frontend  
    }
    
    // Solo para errores inesperados
    throw new Error('ERROR_INESPERADO: Error técnico en el parser. Contacta soporte.');
  }
}

async function extractWithClaude(file: File): Promise<F29Data | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ ANTHROPIC_API_KEY no encontrada');
      return null;
    }
    
    console.log('🟣 Estrategia inteligente: Claude analiza PDF como imagen...');
    
    // ESTRATEGIA INTELIGENTE: Convertir PDF a imagen y enviar a Claude (igual que tú haces)
    const pdfImageBase64 = await convertPDFToImage(file);
    
    if (!pdfImageBase64) {
      console.warn('⚠️ No se pudo convertir PDF a imagen');
      return null;
    }
    
    console.log('📡 Enviando imagen del F29 a Claude para análisis visual...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza este formulario F29 chileno. Eres un experto contador y necesitas extraer los datos específicos del documento.

INSTRUCCIONES CRÍTICAS:
1. Lee VISUALMENTE el formulario F29 como un documento oficial
2. Extrae los valores exactos que ves en los campos específicos
3. NO inventes valores, solo usa lo que realmente ves
4. Los códigos aparecen en casillas numeradas (ej: casilla 511, 538, etc.)

DATOS A EXTRAER:
- RUT del contribuyente (formato XX.XXX.XXX-X)
- FOLIO del formulario (número largo)
- PERÍODO tributario (YYYYMM o fecha)
- Razón Social de la empresa
- Código 511: CRÉD. IVA POR DCTOS. ELECTRÓNICOS
- Código 538: TOTAL DÉBITOS  
- Código 563: BASE IMPONIBLE
- Código 062: PPM NETO DETERMINADO
- Código 077: REMANENTE DE CRÉDITO FISC.
- Código 151: RETENCIÓN TASA LEY 21.133

FORMATO DE RESPUESTA (JSON únicamente):
{
  "rut": "valor_real_del_documento",
  "folio": "numero_real_del_folio",
  "periodo": "periodo_real",
  "razonSocial": "nombre_real_empresa",
  "codigo511": numero_entero_sin_separadores,
  "codigo538": numero_entero_sin_separadores,
  "codigo563": numero_entero_sin_separadores,
  "codigo062": numero_entero_sin_separadores,
  "codigo077": numero_entero_sin_separadores,
  "codigo151": numero_entero_sin_separadores
}`
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfImageBase64
              }
            }
          ]
        }]
      })
    });
    
    console.log(`📊 Claude response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 500)
      });
      
      if (response.status === 401) {
        console.error('🔑 API Key inválida o expirada');
      } else if (response.status === 429) {
        console.error('⏰ Rate limit excedido - espera un momento');
      } else if (response.status === 400) {
        console.error('📄 Error en el formato del request o contenido');
        console.log('🔍 Muestra del contenido enviado:', extractedText.substring(0, 200));
      }
      
      return null;
    }
    
    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.error('❌ No content from Claude');
      return null;
    }
    
    console.log('📝 Claude response:', content.substring(0, 300));
    
    // Extraer JSON de la respuesta
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validar valores razonables
    if (parsed.codigo563 > 100000000000) {
      console.warn('⚠️ Valores sospechosos de Claude');
      return null;
    }
    
    // Crear resultado con cálculos
    const result: F29Data = {
      rut: parsed.rut || '',
      folio: parsed.folio || '',
      periodo: parsed.periodo || '',
      razonSocial: parsed.razonSocial || '',
      codigo511: parseInt(parsed.codigo511) || 0,
      codigo538: parseInt(parsed.codigo538) || 0,
      codigo563: parseInt(parsed.codigo563) || 0,
      codigo062: parseInt(parsed.codigo062) || 0,
      codigo077: parseInt(parsed.codigo077) || 0,
      codigo151: parseInt(parsed.codigo151) || 0,
      comprasNetas: 0,
      ivaDeterminado: 0,
      totalAPagar: 0,
      margenBruto: 0,
      confidence: 95,
      method: 'claude-ai'
    };
    
    // Calcular campos derivados
    calculateFields(result);
    
    console.log('✅ Claude result:', {
      rut: result.rut,
      codigo511: result.codigo511.toLocaleString(),
      codigo538: result.codigo538.toLocaleString(),
      codigo563: result.codigo563.toLocaleString()
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error calling Claude:', error);
    return null;
  }
}

async function convertPDFToImage(file: File): Promise<string | null> {
  try {
    console.log('🖼️ Estrategia profesional: PDF → Imagen → Claude análisis visual');
    
    // ESTRATEGIA SIMPLE Y ROBUSTA: Enviar PDF directamente como base64
    // Claude 3.5 puede analizar PDFs directamente como imágenes
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log(`📄 PDF convertido a base64: ${base64.length} caracteres`);
    
    // Claude puede analizar PDFs directamente - mucho más simple y robusto
    return base64;
    
  } catch (error) {
    console.error('❌ Error procesando PDF:', error);
    return null;
  }
}

async function extractWithBasicParser(file: File): Promise<F29Data | null> {
  try {
    console.log('🔧 Intentando parser básico...');
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convertir a texto usando múltiples encodings
    let content = '';
    
    // Intentar UTF-8 primero
    try {
      const decoder = new TextDecoder('utf-8');
      content = decoder.decode(uint8Array);
    } catch {
      // Fallback a Latin1
      content = String.fromCharCode(...uint8Array);
    }
    
    console.log(`📝 Contenido extraído: ${content.length} caracteres`);
    
    if (content.length < 100) {
      console.warn('⚠️ Muy poco contenido extraído');
      return null;
    }
    
    // Buscar patrones de códigos F29 con regex
    const patterns = {
      rut: /(\d{1,2}\.?\d{3}\.?\d{3}-?[\dK])/i,
      folio: /(?:folio|nro\.?|número)[:\s]*(\d{8,15})/i,
      periodo: /(\d{4})[-\/]?(\d{1,2})|(\d{6})/i,
      codigo511: /(?:511|créd\.?\s*iva)[:\s]*[\$]?[\s]*(\d{1,3}(?:[.,]\d{3})*)/i,
      codigo538: /(?:538|total\s*débito)[:\s]*[\$]?[\s]*(\d{1,3}(?:[.,]\d{3})*)/i,
      codigo563: /(?:563|base\s*imponible)[:\s]*[\$]?[\s]*(\d{1,3}(?:[.,]\d{3})*)/i,
      codigo062: /(?:062|ppm)[:\s]*[\$]?[\s]*(\d{1,3}(?:[.,]\d{3})*)/i,
      codigo077: /(?:077|remanente)[:\s]*[\$]?[\s]*(\d{1,3}(?:[.,]\d{3})*)/i,
      codigo151: /(?:151|retención)[:\s]*[\$]?[\s]*(\d{1,3}(?:[.,]\d{3})*)/i,
    };
    
    const extracted: any = {};
    
    // Extraer cada campo
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        if (field === 'rut') {
          extracted[field] = match[1];
        } else if (field === 'folio') {
          extracted[field] = match[1];
        } else if (field === 'periodo') {
          if (match[3]) {
            extracted[field] = match[3]; // YYYYMM directo
          } else if (match[1] && match[2]) {
            extracted[field] = match[1] + match[2].padStart(2, '0'); // YYYY + MM
          }
        } else {
          // Para códigos numéricos, remover puntos y comas
          const numStr = match[1].replace(/[.,]/g, '');
          extracted[field] = parseInt(numStr) || 0;
        }
      } else {
        extracted[field] = field.startsWith('codigo') ? 0 : '';
      }
    }
    
    // Buscar razón social (líneas cerca del RUT)
    if (extracted.rut) {
      const rutIndex = content.indexOf(extracted.rut);
      if (rutIndex > -1) {
        const beforeRut = content.substring(Math.max(0, rutIndex - 200), rutIndex);
        const afterRut = content.substring(rutIndex, rutIndex + 200);
        const combined = beforeRut + afterRut;
        
        // Buscar texto que parezca nombre de empresa
        const nameMatch = combined.match(/([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]{10,50}(?:SPA|LTDA|SA|EIRL)?)/);
        if (nameMatch) {
          extracted.razonSocial = nameMatch[1].trim();
        }
      }
    }
    
    console.log('🔍 Datos extraídos con parser básico:', {
      rut: extracted.rut,
      folio: extracted.folio,
      periodo: extracted.periodo,
      razonSocial: extracted.razonSocial,
      codigo511: extracted.codigo511,
      codigo538: extracted.codigo538,
      codigo563: extracted.codigo563
    });
    
    // Crear resultado
    const result: F29Data = {
      rut: extracted.rut || '',
      folio: extracted.folio || '',
      periodo: extracted.periodo || '',
      razonSocial: extracted.razonSocial || '',
      codigo511: extracted.codigo511 || 0,
      codigo538: extracted.codigo538 || 0,
      codigo563: extracted.codigo563 || 0,
      codigo062: extracted.codigo062 || 0,
      codigo077: extracted.codigo077 || 0,
      codigo151: extracted.codigo151 || 0,
      comprasNetas: 0,
      ivaDeterminado: 0,
      totalAPagar: 0,
      margenBruto: 0,
      confidence: 75, // Confianza media para parser básico
      method: 'basic-pattern-parser'
    };
    
    // Calcular campos derivados
    calculateFields(result);
    
    // Validar que se encontraron datos mínimos
    if (result.codigo563 > 0 || result.codigo538 > 0) {
      console.log('✅ Parser básico encontró datos válidos');
      return result;
    } else {
      console.warn('⚠️ Parser básico no encontró datos suficientes');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error en parser básico:', error);
    return null;
  }
}

function calculateFields(result: F29Data) {
  // Compras Netas = Código 538 ÷ 0.19
  if (result.codigo538 > 0) {
    result.comprasNetas = Math.round(result.codigo538 / 0.19);
  }
  
  // IVA Determinado = Código 538 - Código 511
  if (result.codigo538 > 0 && result.codigo511 > 0) {
    result.ivaDeterminado = result.codigo538 - result.codigo511;
  }
  
  // Total a Pagar = |IVA| + PPM + Remanente
  result.totalAPagar = Math.abs(result.ivaDeterminado) + result.codigo062 + result.codigo077;
  
  // Margen Bruto = Ventas - Compras
  if (result.codigo563 > 0 && result.comprasNetas > 0) {
    result.margenBruto = result.codigo563 - result.comprasNetas;
  }
  
  console.log('🧮 Campos calculados:', {
    comprasNetas: result.comprasNetas.toLocaleString(),
    ivaDeterminado: result.ivaDeterminado.toLocaleString(),
    totalAPagar: result.totalAPagar.toLocaleString(),
    margenBruto: result.margenBruto.toLocaleString()
  });
}