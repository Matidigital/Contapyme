// ==========================================
// F29 DIAGNOSTIC PARSER - DEBUG COMPLETO
// Parser para diagnosticar problemas de extracción
// ==========================================

export interface F29DiagnosticData {
  // Información básica
  rut: string;
  folio: string;
  periodo: string;
  razonSocial: string;
  
  // Códigos F29
  codigo511: number;
  codigo538: number;
  codigo077: number;
  codigo151: number;
  codigo563: number;
  codigo062: number;
  
  // Campos calculados
  comprasNetas: number;
  ivaDeterminado: number;
  totalAPagar: number;
  margenBruto: number;
  
  // Debug info
  confidence: number;
  method: string;
  debugInfo: {
    extractedTextLength: number;
    extractedTextSample: string;
    numbersFound: string[];
    codesFound: string[];
    patternMatches: Record<string, string[]>;
    rawDataSample: string;
  };
}

export async function parseF29Diagnostic(file: File): Promise<F29DiagnosticData> {
  console.log('🔍 F29 DIAGNOSTIC PARSER: Iniciando diagnóstico completo...');
  
  const result: F29DiagnosticData = {
    rut: '',
    folio: '',
    periodo: '',
    razonSocial: '',
    codigo511: 0,
    codigo538: 0,
    codigo077: 0,
    codigo151: 0,
    codigo563: 0,
    codigo062: 0,
    comprasNetas: 0,
    ivaDeterminado: 0,
    totalAPagar: 0,
    margenBruto: 0,
    confidence: 0,
    method: 'diagnostic',
    debugInfo: {
      extractedTextLength: 0,
      extractedTextSample: '',
      numbersFound: [],
      codesFound: [],
      patternMatches: {},
      rawDataSample: ''
    }
  };

  try {
    // 1. ANÁLISIS COMPLETO DEL ARCHIVO
    const fileInfo = await analyzeFile(file);
    console.log('📄 File Info:', fileInfo);
    
    // 2. EXTRACCIÓN DE TEXTO CON MÚLTIPLES MÉTODOS
    const extractionResults = await extractTextWithAllMethods(file);
    console.log('📝 Extraction Results:', {
      methodsAttempted: extractionResults.length,
      bestMethod: extractionResults[0]?.method,
      textLength: extractionResults[0]?.text.length
    });
    
    if (extractionResults.length === 0) {
      throw new Error('No se pudo extraer texto con ningún método');
    }
    
    // Usar el mejor resultado
    const bestExtraction = extractionResults[0];
    const text = bestExtraction.text;
    
    // 3. LLENAR DEBUG INFO
    result.debugInfo.extractedTextLength = text.length;
    result.debugInfo.extractedTextSample = text.substring(0, 500);
    result.debugInfo.rawDataSample = text.substring(0, 200);
    
    // 4. BUSCAR TODOS LOS NÚMEROS
    const allNumbers = findAllNumbers(text);
    result.debugInfo.numbersFound = allNumbers.slice(0, 20); // Primeros 20
    console.log('🔢 Numbers found:', allNumbers.length, 'Samples:', allNumbers.slice(0, 10));
    
    // 5. BUSCAR CÓDIGOS F29
    const codesInText = findF29Codes(text);
    result.debugInfo.codesFound = codesInText;
    console.log('🏷️ F29 codes found:', codesInText);
    
    // 6. INTENTAR EXTRACCIÓN ESPECÍFICA
    extractSpecificData(text, result);
    
    // 7. INTENTAR PATRONES AVANZADOS
    result.debugInfo.patternMatches = findAdvancedPatterns(text);
    
    // 8. CALCULAR CONFIANZA
    result.confidence = calculateDiagnosticConfidence(result);
    
    console.log('✅ Diagnostic complete:', {
      textLength: result.debugInfo.extractedTextLength,
      numbersFound: result.debugInfo.numbersFound.length,
      codesFound: result.debugInfo.codesFound.length,
      confidence: result.confidence
    });
    
    return result;

  } catch (error) {
    console.error('❌ Diagnostic parser error:', error);
    result.confidence = 0;
    return result;
  }
}

async function analyzeFile(file: File): Promise<any> {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  };
}

async function extractTextWithAllMethods(file: File): Promise<Array<{method: string, text: string, score: number}>> {
  const results: Array<{method: string, text: string, score: number}> = [];
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Método 1: Decodificadores múltiples
    const encodings = ['utf-8', 'latin1', 'windows-1252', 'iso-8859-1', 'ascii'];
    
    for (const encoding of encodings) {
      try {
        const decoder = new TextDecoder(encoding);
        const text = decoder.decode(uint8Array);
        const score = scoreText(text);
        
        results.push({
          method: `decoder-${encoding}`,
          text,
          score
        });
        
        console.log(`📊 ${encoding}: ${text.length} chars, score: ${score}`);
      } catch (e) {
        console.log(`❌ ${encoding} failed:`, e.message);
      }
    }
    
    // Método 2: Análisis de chunks
    const chunkText = extractByChunks(uint8Array);
    if (chunkText) {
      results.push({
        method: 'chunks',
        text: chunkText,
        score: scoreText(chunkText)
      });
    }
    
    // Método 3: Búsqueda de strings ASCII
    const asciiText = extractASCIIStrings(uint8Array);
    if (asciiText) {
      results.push({
        method: 'ascii-strings',
        text: asciiText,
        score: scoreText(asciiText)
      });
    }
    
    // Ordenar por score descendente
    results.sort((a, b) => b.score - a.score);
    
  } catch (error) {
    console.error('Error in text extraction:', error);
  }
  
  return results;
}

function scoreText(text: string): number {
  let score = 0;
  
  // Puntos por longitud razonable
  if (text.length > 100) score += 10;
  if (text.length > 1000) score += 20;
  
  // Puntos por números encontrados
  const numbers = (text.match(/\d+/g) || []).length;
  score += Math.min(numbers * 2, 50);
  
  // Puntos por códigos F29
  const codes = ['511', '538', '563', '062', '077', '151'];
  for (const code of codes) {
    if (text.includes(code)) score += 15;
  }
  
  // Puntos por palabras clave
  const keywords = ['FOLIO', 'RUT', 'PERIODO', 'DÉBITO', 'CRÉDITO', 'IVA', 'PPM'];
  for (const keyword of keywords) {
    if (text.toUpperCase().includes(keyword)) score += 5;
  }
  
  // Penalizar texto muy corto o muy largo
  if (text.length < 50) score -= 20;
  if (text.length > 50000) score -= 10;
  
  return score;
}

function extractByChunks(uint8Array: Uint8Array): string {
  let text = '';
  const chunkSize = 1024;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    try {
      const decoder = new TextDecoder('utf-8');
      text += decoder.decode(chunk);
    } catch (e) {
      // Ignorar chunks problemáticos
    }
  }
  
  return text;
}

function extractASCIIStrings(uint8Array: Uint8Array): string {
  const strings: string[] = [];
  let currentString = '';
  
  for (let i = 0; i < uint8Array.length; i++) {
    const byte = uint8Array[i];
    
    // Caracteres ASCII imprimibles (32-126)
    if (byte >= 32 && byte <= 126) {
      currentString += String.fromCharCode(byte);
    } else {
      if (currentString.length > 3) {
        strings.push(currentString);
      }
      currentString = '';
    }
  }
  
  return strings.join(' ');
}

function findAllNumbers(text: string): string[] {
  const patterns = [
    /\b\d{1,3}(?:\.\d{3})+\b/g,  // Formato chileno con puntos
    /\b\d{1,3}(?:,\d{3})+\b/g,   // Formato con comas
    /\b\d{4,}\b/g,               // Números largos
    /\b\d+\b/g                   // Todos los números
  ];
  
  const numbers = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    matches.forEach(match => numbers.add(match));
  }
  
  return Array.from(numbers).sort((a, b) => b.length - a.length);
}

function findF29Codes(text: string): string[] {
  const codes = ['511', '538', '563', '062', '077', '151', '503', '089', '547'];
  const found: string[] = [];
  
  for (const code of codes) {
    if (text.includes(code)) {
      found.push(code);
    }
  }
  
  return found;
}

function extractSpecificData(text: string, result: F29DiagnosticData) {
  // Información básica
  const rutMatch = text.match(/(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/i);
  if (rutMatch) result.rut = rutMatch[1];
  
  const folioMatch = text.match(/(\d{10,})/);
  if (folioMatch) result.folio = folioMatch[1];
  
  const periodoMatch = text.match(/(\d{6})/);
  if (periodoMatch) result.periodo = periodoMatch[1];
  
  // Códigos F29 con múltiples estrategias
  const codePatterns = {
    codigo511: [
      /511\s*[^\d]*(\d{1,3}(?:\.\d{3})*)/i,
      /CRÉD.*?IVA.*?(\d{1,3}(?:\.\d{3})*)/i,
      /511[^\d]*(\d{6,})/i
    ],
    codigo538: [
      /538\s*[^\d]*(\d{1,3}(?:\.\d{3})*)/i,
      /TOTAL.*?DÉBITO.*?(\d{1,3}(?:\.\d{3})*)/i,
      /538[^\d]*(\d{6,})/i
    ],
    codigo563: [
      /563\s*[^\d]*(\d{1,3}(?:\.\d{3})*)/i,
      /BASE.*?IMPONIBLE.*?(\d{1,3}(?:\.\d{3})*)/i,
      /563[^\d]*(\d{7,})/i
    ]
  };
  
  for (const [field, patterns] of Object.entries(codePatterns)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = cleanAndValidateNumber(match[1]);
        if (value > 0 && value < 1000000000) { // Validar rango razonable
          (result as any)[field] = value;
          console.log(`✅ ${field}: ${value.toLocaleString()}`);
          break;
        }
      }
    }
  }
}

function findAdvancedPatterns(text: string): Record<string, string[]> {
  const patterns = {
    dates: text.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [],
    periods: text.match(/\d{6}/g) || [],
    ruts: text.match(/\d{1,2}\.\d{3}\.\d{3}-[\dkK]/g) || [],
    largeNumbers: text.match(/\d{1,3}(?:\.\d{3})+/g) || [],
    codes: text.match(/\b[0-9]{3}\b/g) || []
  };
  
  return patterns;
}

function cleanAndValidateNumber(str: string): number {
  if (!str) return 0;
  
  // Remover puntos y comas (separadores de miles)
  const cleaned = str.replace(/[.,]/g, '');
  const num = parseInt(cleaned);
  
  // Validar que sea un número razonable para F29
  if (isNaN(num) || num < 0 || num > 999999999999) {
    return 0;
  }
  
  return num;
}

function calculateDiagnosticConfidence(result: F29DiagnosticData): number {
  let score = 0;
  
  // Texto extraído
  if (result.debugInfo.extractedTextLength > 100) score += 20;
  if (result.debugInfo.extractedTextLength > 1000) score += 10;
  
  // Números encontrados
  if (result.debugInfo.numbersFound.length > 0) score += 20;
  if (result.debugInfo.numbersFound.length > 10) score += 10;
  
  // Códigos F29 encontrados
  score += result.debugInfo.codesFound.length * 5;
  
  // Información básica
  if (result.rut) score += 10;
  if (result.folio) score += 5;
  if (result.periodo) score += 5;
  
  // Códigos específicos
  if (result.codigo511 > 0) score += 15;
  if (result.codigo538 > 0) score += 15;
  if (result.codigo563 > 0) score += 10;
  
  return Math.min(score, 100);
}