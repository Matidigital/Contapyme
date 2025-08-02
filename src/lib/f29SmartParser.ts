// ==========================================
// F29 SMART PARSER - SOLUCIÓN REVOLUCIONARIA
// Extracción inteligente y adaptativa para cualquier F29
// ==========================================

export interface F29SmartData {
  // Información básica
  rut: string;
  periodo: string;
  folio: string;
  razonSocial: string;
  
  // Códigos F29 principales
  codigo538: number; // TOTAL DÉBITOS / DÉBITO FISCAL
  codigo511: number; // CRÉDITO FISCAL / CRÉD. IVA
  codigo563: number; // BASE IMPONIBLE / VENTAS NETAS
  codigo062: number; // PPM NETO DETERMINADO
  codigo077: number; // REMANENTE DE CRÉDITO FISCAL
  
  // Cálculos automáticos
  comprasNetas: number;     // codigo511 ÷ 0.19
  ivaDeterminado: number;   // codigo538 - codigo511
  totalAPagar: number;      // IVA + PPM + remanente
  margenBruto: number;      // ventas - compras
  
  // Metadatos
  confidence: number;
  method: string;
  extractedText: string;
  errors: string[];
}

// ==========================================
// ESTRATEGIA 1: REGEX PATTERNS INTELIGENTES
// ==========================================
export function parseF29WithRegex(pdfText: string): Partial<F29SmartData> {
  console.log('🧠 SMART PARSER: Iniciando análisis con regex inteligente...');
  
  const result: Partial<F29SmartData> = {
    method: 'smart-regex',
    confidence: 0,
    errors: [],
    extractedText: pdfText.substring(0, 1000) // Primera parte para debug
  };

  try {
    // 1. INFORMACIÓN BÁSICA
    result.rut = extractRUT(pdfText);
    result.periodo = extractPeriodo(pdfText);
    result.folio = extractFolio(pdfText);
    result.razonSocial = extractRazonSocial(pdfText);

    // 2. CÓDIGOS F29 - ESTRATEGIA MULTI-PATTERN
    result.codigo538 = extractCodigo(pdfText, '538', ['TOTAL DÉBITOS', 'DÉBITO FISCAL']);
    result.codigo511 = extractCodigo(pdfText, '511', ['CRÉD. IVA', 'CRÉDITO FISCAL']);
    result.codigo563 = extractCodigo(pdfText, '563', ['BASE IMPONIBLE', 'VENTAS NETAS']);
    result.codigo062 = extractCodigo(pdfText, '062', ['PPM NETO', 'PPM DETERMINADO']);
    result.codigo077 = extractCodigo(pdfText, '077', ['REMANENTE', 'CRÉDITO FISC']);

    // 3. CÁLCULOS AUTOMÁTICOS
    if (result.codigo511) {
      result.comprasNetas = Math.round(result.codigo511 / 0.19);
    }
    
    if (result.codigo538 && result.codigo511) {
      result.ivaDeterminado = result.codigo538 - result.codigo511;
    }
    
    if (result.ivaDeterminado && result.codigo062 && result.codigo077) {
      result.totalAPagar = Math.max(0, result.ivaDeterminado) + (result.codigo062 || 0) + (result.codigo077 || 0);
    }
    
    if (result.codigo563 && result.comprasNetas) {
      result.margenBruto = result.codigo563 - result.comprasNetas;
    }

    // 4. CONFIDENCE SCORE
    result.confidence = calculateConfidence(result);
    
    console.log('✅ Parsing completado:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en smart parser:', error);
    result.errors?.push(`Parsing error: ${error.message}`);
    return result;
  }
}

// ==========================================
// FUNCIONES DE EXTRACCIÓN ESPECÍFICAS
// ==========================================

function extractRUT(text: string): string {
  // Buscar RUT en formato chileno
  const rutPatterns = [
    /RUT\s*\[?\d*\]?\s*(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/i,
    /(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/g
  ];
  
  for (const pattern of rutPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return '';
}

function extractPeriodo(text: string): string {
  // Buscar período en formato YYYYMM
  const periodoPatterns = [
    /PERIODO\s*\[?\d*\]?\s*(\d{6})/i,
    /(\d{4})(0[1-9]|1[0-2])/g
  ];
  
  for (const pattern of periodoPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return '';
}

function extractFolio(text: string): string {
  // Buscar folio
  const folioPatterns = [
    /FOLIO\s*\[?\d*\]?\s*(\d+)/i,
    /(\d{10,})/g
  ];
  
  for (const pattern of folioPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return '';
}

function extractRazonSocial(text: string): string {
  // Buscar razón social después de campos específicos
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Razón Social') || lines[i].includes('APELLIDO') || lines[i].includes('NOMBRES')) {
      // La razón social suele estar en la siguiente línea
      if (lines[i + 1]) {
        return lines[i + 1].trim();
      }
    }
  }
  return '';
}

function extractCodigo(text: string, codigo: string, aliases: string[] = []): number {
  console.log(`🔍 Buscando código ${codigo}...`);
  
  // ESTRATEGIA 1: Búsqueda directa por código
  const directPattern = new RegExp(`${codigo}\\s+[^\\d]*([\\d.,]+)`, 'g');
  let match = directPattern.exec(text);
  if (match) {
    const value = cleanNumber(match[1]);
    if (value > 0) {
      console.log(`✅ Código ${codigo} encontrado directamente: ${value}`);
      return value;
    }
  }

  // ESTRATEGIA 2: Búsqueda por alias/descripción
  for (const alias of aliases) {
    const aliasPattern = new RegExp(`${alias}\\s+([\\d.,]+)`, 'gi');
    match = aliasPattern.exec(text);
    if (match) {
      const value = cleanNumber(match[1]);
      if (value > 0) {
        console.log(`✅ Código ${codigo} encontrado por alias "${alias}": ${value}`);
        return value;
      }
    }
  }

  // ESTRATEGIA 3: Búsqueda en tabla estructurada
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(codigo)) {
      // Buscar número en la misma línea o líneas siguientes
      const numbers = extractAllNumbers(line);
      if (numbers.length > 0) {
        const value = numbers[numbers.length - 1]; // Último número suele ser el valor
        if (value > 0) {
          console.log(`✅ Código ${codigo} encontrado en tabla: ${value}`);
          return value;
        }
      }
      
      // Buscar en líneas siguientes
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextNumbers = extractAllNumbers(lines[j]);
        if (nextNumbers.length > 0) {
          const value = nextNumbers[0];
          if (value > 0) {
            console.log(`✅ Código ${codigo} encontrado en línea siguiente: ${value}`);
            return value;
          }
        }
      }
    }
  }

  console.log(`❌ Código ${codigo} no encontrado`);
  return 0;
}

// ==========================================
// UTILIDADES
// ==========================================

function cleanNumber(str: string): number {
  // Limpiar y convertir string a número
  const cleaned = str.replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
}

function extractAllNumbers(text: string): number[] {
  // Extraer todos los números de un texto
  const numberPattern = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g;
  const matches = text.match(numberPattern) || [];
  return matches.map(cleanNumber).filter(n => n > 0);
}

function calculateConfidence(data: Partial<F29SmartData>): number {
  let score = 0;
  let maxScore = 0;

  // Información básica (30 puntos)
  maxScore += 30;
  if (data.rut) score += 10;
  if (data.periodo) score += 10;
  if (data.folio) score += 10;

  // Códigos principales (50 puntos)
  maxScore += 50;
  if (data.codigo538) score += 15;
  if (data.codigo511) score += 15;
  if (data.codigo563) score += 10;
  if (data.codigo062) score += 5;
  if (data.codigo077) score += 5;

  // Validaciones matemáticas (20 puntos)
  maxScore += 20;
  if (data.codigo538 && data.codigo511) {
    if (Math.abs(data.codigo538 - data.codigo511) === Math.abs(data.ivaDeterminado || 0)) {
      score += 10; // IVA calculation is correct
    }
  }
  if (data.comprasNetas && data.codigo511) {
    const expectedCompras = Math.round(data.codigo511 / 0.19);
    if (Math.abs(data.comprasNetas - expectedCompras) < 100) {
      score += 10; // Compras calculation is correct
    }
  }

  return Math.round((score / maxScore) * 100);
}

// ==========================================
// FUNCIÓN PRINCIPAL DE PARSING
// ==========================================
export async function parseF29Smart(file: File): Promise<F29SmartData> {
  console.log('🚀 INICIANDO F29 SMART PARSER...');
  
  try {
    // Leer archivo como texto plano (funciona para muchos PDFs)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Intentar múltiples decodificadores
    const decoders = [
      new TextDecoder('utf-8'),
      new TextDecoder('latin1'),
      new TextDecoder('windows-1252')
    ];
    
    let bestResult: Partial<F29SmartData> = { confidence: 0 };
    
    for (const decoder of decoders) {
      try {
        const text = decoder.decode(uint8Array);
        const result = parseF29WithRegex(text);
        
        if ((result.confidence || 0) > (bestResult.confidence || 0)) {
          bestResult = result;
        }
      } catch (error) {
        console.log(`Decoder ${decoder.encoding} failed:`, error.message);
      }
    }
    
    // Completar campos faltantes con valores por defecto
    const finalResult: F29SmartData = {
      rut: bestResult.rut || '',
      periodo: bestResult.periodo || '',
      folio: bestResult.folio || '',
      razonSocial: bestResult.razonSocial || '',
      codigo538: bestResult.codigo538 || 0,
      codigo511: bestResult.codigo511 || 0,
      codigo563: bestResult.codigo563 || 0,
      codigo062: bestResult.codigo062 || 0,
      codigo077: bestResult.codigo077 || 0,
      comprasNetas: bestResult.comprasNetas || 0,
      ivaDeterminado: bestResult.ivaDeterminado || 0,
      totalAPagar: bestResult.totalAPagar || 0,
      margenBruto: bestResult.margenBruto || 0,
      confidence: bestResult.confidence || 0,
      method: bestResult.method || 'smart-parser',
      extractedText: bestResult.extractedText || '',
      errors: bestResult.errors || []
    };
    
    console.log('✅ F29 SMART PARSER COMPLETADO:', finalResult);
    return finalResult;
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN SMART PARSER:', error);
    
    // Retornar resultado vacío pero válido
    return {
      rut: '',
      periodo: '',
      folio: '',
      razonSocial: '',
      codigo538: 0,
      codigo511: 0,
      codigo563: 0,
      codigo062: 0,
      codigo077: 0,
      comprasNetas: 0,
      ivaDeterminado: 0,
      totalAPagar: 0,
      margenBruto: 0,
      confidence: 0,
      method: 'smart-parser-error',
      extractedText: '',
      errors: [`Critical parsing error: ${error.message}`]
    };
  }
}