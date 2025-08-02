// ==========================================
// F29 SIMPLE PARSER - Estrategia Directa
// Parser optimizado para la estructura específica del F29
// ==========================================

export interface F29SimpleData {
  rut: string;
  folio: string;
  periodo: string;
  razonSocial: string;
  codigo511: number; // CRÉD. IVA POR DCTOS. ELECTRÓNICOS
  codigo538: number; // TOTAL DÉBITOS
  codigo077: number; // REMANENTE DE CRÉDITO FISC.
  codigo151: number; // RETENCIÓN TASA LEY 21.133
  codigo563: number; // BASE IMPONIBLE
  codigo062: number; // PPM NETO DETERMINADO
  comprasNetas: number;
  ivaDeterminado: number;
  totalAPagar: number;
  margenBruto: number;
  confidence: number;
  method: string;
}

export async function parseF29Simple(file: File): Promise<F29SimpleData> {
  console.log('🎯 F29 SIMPLE PARSER: Iniciando extracción directa...');
  
  const result: F29SimpleData = {
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
    method: 'simple-direct'
  };

  try {
    // Extraer texto del PDF usando múltiples métodos
    const text = await extractTextFromPDF(file);
    console.log(`📄 Texto extraído: ${text.length} caracteres`);
    
    // 1. Información básica del header
    extractBasicInfo(text, result);
    
    // 2. Códigos F29 con patrones específicos
    extractF29Codes(text, result);
    
    // 3. Cálculos derivados
    calculateValues(result);
    
    // 4. Calcular confianza
    result.confidence = calculateConfidence(result);
    
    console.log('✅ F29 Simple Parser completado:', {
      rut: result.rut,
      codigo538: result.codigo538,
      codigo511: result.codigo511,
      confidence: result.confidence
    });
    
    return result;

  } catch (error) {
    console.error('❌ Error en F29 Simple Parser:', error);
    result.confidence = 0;
    return result;
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Método 1: Leer como texto binario
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Probar diferentes encodings
    const decoders = [
      new TextDecoder('utf-8'),
      new TextDecoder('latin1'),
      new TextDecoder('windows-1252'),
      new TextDecoder('iso-8859-1')
    ];
    
    let bestText = '';
    let maxNumbers = 0;
    
    for (const decoder of decoders) {
      try {
        const text = decoder.decode(uint8Array);
        const numberCount = (text.match(/\d{3,}/g) || []).length;
        
        if (numberCount > maxNumbers) {
          maxNumbers = numberCount;
          bestText = text;
        }
      } catch (e) {
        // Continuar con el siguiente decoder
      }
    }
    
    return bestText;
  } catch (error) {
    console.error('Error extrayendo texto:', error);
    return '';
  }
}

function extractBasicInfo(text: string, result: F29SimpleData) {
  // RUT - múltiples patrones
  const rutPatterns = [
    /RUT\s*\[?\d*\]?\s*([\d\.-]+)/i,
    /\[03\]\s*([\d\.-]+)/i,
    /(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/
  ];
  
  for (const pattern of rutPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.rut = match[1].trim();
      break;
    }
  }
  
  // FOLIO - múltiples patrones
  const folioPatterns = [
    /FOLIO\s*\[?\d*\]?\s*(\d+)/i,
    /\[07\]\s*(\d+)/i,
    /(\d{10,})/
  ];
  
  for (const pattern of folioPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 10) {
      result.folio = match[1];
      break;
    }
  }
  
  // PERÍODO - múltiples patrones
  const periodoPatterns = [
    /PERIODO\s*\[?\d*\]?\s*(\d{6})/i,
    /\[15\]\s*(\d{6})/i,
    /202\d{3}/
  ];
  
  for (const pattern of periodoPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.periodo = match[1];
      break;
    }
  }
  
  // Razón Social
  const razonPatterns = [
    /COMERCIALIZADORA\s+([A-Z\s]+?)(?:\s+\d|\n|Calle)/i,
    /Razón Social[^\n]*\n([A-Z\s]+)/i,
    /01[^\n]*\n([A-Z\s]+)/i
  ];
  
  for (const pattern of razonPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.razonSocial = match[1].trim();
      break;
    }
  }
}

function extractF29Codes(text: string, result: F29SimpleData) {
  // Definir códigos con múltiples patrones de búsqueda
  const codes = [
    {
      field: 'codigo511',
      patterns: [
        /511\s+[^0-9]*?(\d{1,3}(?:\.\d{3})*)/i,
        /CRÉD\.?\s*IVA.*?(\d{1,3}(?:\.\d{3})*)/i,
        /511[^\d]*(\d{7,})/i
      ]
    },
    {
      field: 'codigo538',
      patterns: [
        /538\s+[^0-9]*?(\d{1,3}(?:\.\d{3})*)/i,
        /TOTAL\s+DÉBITOS.*?(\d{1,3}(?:\.\d{3})*)/i,
        /538[^\d]*(\d{7,})/i
      ]
    },
    {
      field: 'codigo077',
      patterns: [
        /077\s+[^0-9]*?(\d{1,3}(?:\.\d{3})*)/i,
        /REMANENTE.*?(\d{1,3}(?:\.\d{3})*)/i,
        /077[^\d]*(\d{6,})/i
      ]
    },
    {
      field: 'codigo151',
      patterns: [
        /151\s+[^0-9]*?(\d{1,3}(?:\.\d{3})*)/i,
        /RETENCIÓN.*?(\d{1,3}(?:\.\d{3})*)/i,
        /151[^\d]*(\d{4,})/i
      ]
    },
    {
      field: 'codigo563',
      patterns: [
        /563\s+[^0-9]*?(\d{1,3}(?:\.\d{3})*)/i,
        /BASE\s+IMPONIBLE.*?(\d{1,3}(?:\.\d{3})*)/i,
        /563[^\d]*(\d{8,})/i
      ]
    },
    {
      field: 'codigo062',
      patterns: [
        /062\s+[^0-9]*?(\d{1,3}(?:\.\d{3})*)/i,
        /PPM.*?DETERMINADO.*?(\d{1,3}(?:\.\d{3})*)/i,
        /062[^\d]*(\d{6,})/i
      ]
    }
  ];
  
  for (const code of codes) {
    for (const pattern of code.patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = cleanNumber(match[1]);
        if (value > 0) {
          (result as any)[code.field] = value;
          console.log(`✅ ${code.field}: ${value.toLocaleString()}`);
          break;
        }
      }
    }
  }
  
  // Estrategia adicional: buscar números grandes que podrían ser los códigos
  const largeNumbers = extractLargeNumbers(text);
  
  // Heurística: el número más grande suele ser Base Imponible (563)
  if (!result.codigo563 && largeNumbers.length > 0) {
    const largest = Math.max(...largeNumbers);
    if (largest > 10000000) {
      result.codigo563 = largest;
      console.log(`🎯 codigo563 (heuristic): ${largest.toLocaleString()}`);
    }
  }
  
  // Buscar otros valores por proximidad a los números conocidos
  if (!result.codigo511 && largeNumbers.length > 1) {
    const candidates = largeNumbers.filter(n => n > 1000000 && n < 10000000);
    if (candidates.length > 0) {
      result.codigo511 = candidates[0];
      console.log(`🎯 codigo511 (heuristic): ${candidates[0].toLocaleString()}`);
    }
  }
  
  if (!result.codigo538 && largeNumbers.length > 1) {
    const candidates = largeNumbers.filter(n => n > 1000000 && n < 10000000 && n !== result.codigo511);
    if (candidates.length > 0) {
      result.codigo538 = candidates[0];
      console.log(`🎯 codigo538 (heuristic): ${candidates[0].toLocaleString()}`);
    }
  }
}

function extractLargeNumbers(text: string): number[] {
  const numbers: number[] = [];
  
  // Buscar números con puntos (formato chileno)
  const dottedPattern = /\b\d{1,3}(?:\.\d{3})+\b/g;
  const dottedMatches = text.match(dottedPattern) || [];
  
  for (const match of dottedMatches) {
    const num = cleanNumber(match);
    if (num > 10000) {
      numbers.push(num);
    }
  }
  
  // Buscar números largos sin formato
  const plainPattern = /\b\d{5,}\b/g;
  const plainMatches = text.match(plainPattern) || [];
  
  for (const match of plainMatches) {
    const num = parseInt(match);
    if (num > 10000 && !numbers.includes(num)) {
      numbers.push(num);
    }
  }
  
  return numbers.sort((a, b) => b - a); // Ordenar descendente
}

function cleanNumber(str: string): number {
  if (!str) return 0;
  // Remover todo excepto dígitos
  const cleaned = str.replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
}

function calculateValues(result: F29SimpleData) {
  // Compras Netas = Débito Fiscal ÷ 0.19
  if (result.codigo538 > 0) {
    result.comprasNetas = Math.round(result.codigo538 / 0.19);
  }
  
  // IVA Determinado = Débito Fiscal - Crédito Fiscal
  if (result.codigo538 > 0 && result.codigo511 > 0) {
    result.ivaDeterminado = result.codigo538 - result.codigo511;
  }
  
  // Total a Pagar = PPM + Remanente + Retenciones
  result.totalAPagar = result.codigo062 + result.codigo077 + result.codigo151;
  
  // Margen Bruto = Base Imponible - Compras Netas
  if (result.codigo563 > 0 && result.comprasNetas > 0) {
    result.margenBruto = result.codigo563 - result.comprasNetas;
  }
}

function calculateConfidence(result: F29SimpleData): number {
  let score = 0;
  
  // Información básica (30 puntos)
  if (result.rut) score += 10;
  if (result.folio) score += 8;
  if (result.periodo) score += 7;
  if (result.razonSocial) score += 5;
  
  // Códigos principales (60 puntos)
  if (result.codigo538 > 0) score += 20;
  if (result.codigo511 > 0) score += 20;
  if (result.codigo563 > 0) score += 10;
  if (result.codigo062 > 0) score += 5;
  if (result.codigo077 > 0) score += 3;
  if (result.codigo151 > 0) score += 2;
  
  // Coherencia matemática (10 puntos)
  if (result.codigo563 > 0 && result.comprasNetas > 0) {
    const ratio = result.comprasNetas / result.codigo563;
    if (ratio > 0.8 && ratio < 1.2) score += 10;
  }
  
  return Math.min(score, 100);
}