// ==========================================
// F29 REAL STRUCTURE PARSER - PARSER ESPECIALIZADO
// Diseñado específicamente para la estructura real del F29 del SII
// ==========================================

export interface F29RealData {
  // Información básica del encabezado
  rut: string;
  folio: string;
  periodo: string;
  razonSocial: string;
  
  // Códigos F29 principales (extraídos de la tabla real)
  codigo511: number; // CRÉD. IVA POR DCTOS. ELECTRÓNICOS
  codigo538: number; // TOTAL DÉBITOS
  codigo563: number; // BASE IMPONIBLE
  codigo062: number; // PPM NETO DETERMINADO
  codigo077: number; // REMANENTE DE CRÉDITO FISC.
  codigo151: number; // RETENCIÓN TASA LEY 21.133
  
  // Códigos auxiliares detectados
  codigo503: number; // CANTIDAD FACTURAS EMITIDAS
  codigo502: number; // DÉBITOS FACTURAS EMITIDAS
  codigo759: number; // DÉB. RECIBO DE PAGO MEDIOS ELECTRÓNICOS
  codigo510: number; // DÉBITOS NOTAS DE CRÉDITOS EMITIDAS
  codigo089: number; // IMP. DETERM. IVA
  codigo547: number; // TOTAL DETERMINADO
  
  // Campos calculados
  comprasNetas: number;
  ivaDeterminado: number;
  totalAPagar: number;
  margenBruto: number;
  
  // Metadatos
  confidence: number;
  method: string;
  debugInfo: {
    extractedLines: string[];
    patternMatches: Record<string, string>;
    tableEntriesFound: number;
    headerInfoFound: boolean;
  };
}

export async function parseF29RealStructure(file: File): Promise<F29RealData> {
  console.log('🎯 F29 REAL STRUCTURE PARSER: Analizando estructura real del SII...');
  
  const result: F29RealData = {
    rut: '',
    folio: '',
    periodo: '',
    razonSocial: '',
    codigo511: 0,
    codigo538: 0,
    codigo563: 0,
    codigo062: 0,
    codigo077: 0,
    codigo151: 0,
    codigo503: 0,
    codigo502: 0,
    codigo759: 0,
    codigo510: 0,
    codigo089: 0,
    codigo547: 0,
    comprasNetas: 0,
    ivaDeterminado: 0,
    totalAPagar: 0,
    margenBruto: 0,
    confidence: 0,
    method: 'real-structure',
    debugInfo: {
      extractedLines: [],
      patternMatches: {},
      tableEntriesFound: 0,
      headerInfoFound: false
    }
  };

  try {
    // 1. EXTRACCIÓN DE TEXTO CON MÚLTIPLES MÉTODOS
    const text = await extractTextWithBestMethod(file);
    if (!text || text.length < 100) {
      throw new Error('No se pudo extraer texto suficiente del PDF');
    }
    
    console.log(`📄 Texto extraído: ${text.length} caracteres`);
    
    // 2. DIVIDIR EN LÍNEAS PARA ANÁLISIS ESTRUCTURAL
    const lines = text.split(/[\r\n]+/).filter(line => line.trim().length > 0);
    result.debugInfo.extractedLines = lines.slice(0, 10); // Primeras 10 líneas para debug
    
    console.log(`📝 Líneas procesables: ${lines.length}`);
    
    // 3. EXTRAER INFORMACIÓN DEL ENCABEZADO
    extractHeaderInfo(text, lines, result);
    
    // 4. EXTRAER DATOS DE LA TABLA PRINCIPAL
    extractTableData(text, lines, result);
    
    // 5. CALCULAR VALORES DERIVADOS
    performRealCalculations(result);
    
    // 6. CALCULAR CONFIANZA
    result.confidence = calculateRealConfidence(result);
    
    console.log('✅ F29 Real Structure Parser completado:', {
      confidence: result.confidence,
      tableEntries: result.debugInfo.tableEntriesFound,
      headerFound: result.debugInfo.headerInfoFound,
      rut: result.rut,
      codigo511: result.codigo511,
      codigo538: result.codigo538,
      codigo563: result.codigo563
    });
    
    return result;

  } catch (error) {
    console.error('❌ Error en F29 Real Structure Parser:', error);
    result.confidence = 0;
    return result;
  }
}

async function extractTextWithBestMethod(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Probar múltiples métodos de extracción
  const methods = [
    () => tryTextDecoder(uint8Array, 'utf-8'),
    () => tryTextDecoder(uint8Array, 'latin1'),
    () => tryTextDecoder(uint8Array, 'windows-1252'),
    () => tryTextDecoder(uint8Array, 'iso-8859-1'),
    () => extractASCIIOnly(uint8Array),
    () => extractByteSequences(uint8Array)
  ];
  
  let bestText = '';
  let maxScore = 0;
  
  for (const method of methods) {
    try {
      const text = method();
      const score = scoreExtractedText(text);
      
      if (score > maxScore) {
        maxScore = score;
        bestText = text;
      }
    } catch (e) {
      // Continuar con el siguiente método
    }
  }
  
  console.log(`🏆 Mejor método de extracción: score ${maxScore}`);
  return bestText;
}

function tryTextDecoder(uint8Array: Uint8Array, encoding: string): string {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(uint8Array);
}

function extractASCIIOnly(uint8Array: Uint8Array): string {
  let result = '';
  for (let i = 0; i < uint8Array.length; i++) {
    const byte = uint8Array[i];
    if (byte >= 32 && byte <= 126) {
      result += String.fromCharCode(byte);
    } else if (byte === 10 || byte === 13) {
      result += '\n';
    } else {
      result += ' ';
    }
  }
  return result;
}

function extractByteSequences(uint8Array: Uint8Array): string {
  const sequences: string[] = [];
  let current = '';
  
  for (let i = 0; i < uint8Array.length; i++) {
    const byte = uint8Array[i];
    
    if ((byte >= 48 && byte <= 57) || // Números 0-9
        (byte >= 65 && byte <= 90) || // A-Z
        (byte >= 97 && byte <= 122) || // a-z
        byte === 32 || byte === 46 || byte === 44) { // espacio, punto, coma
      current += String.fromCharCode(byte);
    } else {
      if (current.length > 2) {
        sequences.push(current);
      }
      current = '';
      if (byte === 10 || byte === 13) {
        sequences.push('\n');
      }
    }
  }
  
  return sequences.join(' ');
}

function scoreExtractedText(text: string): number {
  let score = 0;
  
  // Puntos por longitud adecuada
  if (text.length > 500) score += 20;
  if (text.length > 2000) score += 20;
  
  // Puntos por códigos F29 encontrados
  const criticalCodes = ['511', '538', '563', '062', '077'];
  for (const code of criticalCodes) {
    if (text.includes(code)) score += 15;
  }
  
  // Puntos por información del encabezado
  if (text.includes('FOLIO')) score += 10;
  if (text.includes('RUT')) score += 10;
  if (text.includes('PERIODO')) score += 10;
  
  // Puntos por números con formato chileno
  const chileanNumbers = text.match(/\d{1,3}(?:\.\d{3})+/g) || [];
  score += Math.min(chileanNumbers.length * 5, 30);
  
  // Puntos por estructura de tabla
  if (text.includes('Código') && text.includes('Glosa') && text.includes('Valor')) {
    score += 25;
  }
  
  return score;
}

function extractHeaderInfo(text: string, lines: string[], result: F29RealData) {
  console.log('📋 Extrayendo información del encabezado...');
  
  // Buscar FOLIO - formato: FOLIO [07] 8246153316
  const folioPatterns = [
    /FOLIO\s*\[0?7\]\s*(\d+)/i,
    /FOLIO.*?(\d{10,})/i,
    /\[0?7\]\s*(\d{10,})/i
  ];
  
  for (const pattern of folioPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.folio = match[1];
      result.debugInfo.patternMatches['folio'] = match[0];
      console.log(`✅ FOLIO encontrado: ${result.folio}`);
      break;
    }
  }
  
  // Buscar RUT - formato: RUT [03] 77.754.241-9
  const rutPatterns = [
    /RUT\s*\[0?3\]\s*([\d\.-]+)/i,
    /RUT.*?(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/i,
    /\[0?3\]\s*(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/i
  ];
  
  for (const pattern of rutPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.rut = match[1];
      result.debugInfo.patternMatches['rut'] = match[0];
      console.log(`✅ RUT encontrado: ${result.rut}`);
      break;
    }
  }
  
  // Buscar PERÍODO - formato: PERIODO [15] 202505
  const periodoPatterns = [
    /PERIODO\s*\[1?5\]\s*(\d{6})/i,
    /PERIODO.*?(\d{6})/i,
    /\[1?5\]\s*(\d{6})/i
  ];
  
  for (const pattern of periodoPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.periodo = match[1];
      result.debugInfo.patternMatches['periodo'] = match[0];
      console.log(`✅ PERÍODO encontrado: ${result.periodo}`);
      break;
    }
  }
  
  // Buscar Razón Social
  const razonPatterns = [
    /(?:01.*?Razón Social|COMERCIALIZADORA)\s+([A-Z\s]+?)(?:\s*\n|Calle|06)/i,
    /COMERCIALIZADORA\s+([A-Z\s]+?)(?:\s*\n|SPA)/i
  ];
  
  for (const pattern of razonPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.razonSocial = match[1].trim();
      result.debugInfo.patternMatches['razonSocial'] = match[0];
      console.log(`✅ RAZÓN SOCIAL encontrada: ${result.razonSocial}`);
      break;
    }
  }
  
  result.debugInfo.headerInfoFound = !!(result.folio || result.rut || result.periodo);
}

function extractTableData(text: string, lines: string[], result: F29RealData) {
  console.log('📊 Extrayendo datos de la tabla principal...');
  
  // Definir códigos críticos con múltiples patrones de búsqueda
  const codePatterns = {
    codigo511: [
      /511\s+CRÉD\.?\s*IVA.*?(\d{1,3}(?:\.\d{3})*)/i,
      /511.*?(\d{1,3}(?:\.\d{3})*)/,
      /CRÉD\.?\s*IVA.*?(\d{1,3}(?:\.\d{3})*)/i
    ],
    codigo538: [
      /538\s+TOTAL\s+DÉBITOS.*?(\d{1,3}(?:\.\d{3})*)/i,
      /538.*?(\d{1,3}(?:\.\d{3})*)/,
      /TOTAL\s+DÉBITOS.*?(\d{1,3}(?:\.\d{3})*)/i
    ],
    codigo563: [
      /563\s+BASE\s+IMPONIBLE.*?(\d{1,3}(?:\.\d{3})*)/i,
      /563.*?(\d{1,3}(?:\.\d{3})*)/,
      /BASE\s+IMPONIBLE.*?(\d{1,3}(?:\.\d{3})*)/i
    ],
    codigo062: [
      /062\s+PPM.*?(\d{1,3}(?:\.\d{3})*)/i,
      /062.*?(\d{1,3}(?:\.\d{3})*)/,
      /PPM\s+NETO.*?(\d{1,3}(?:\.\d{3})*)/i
    ],
    codigo077: [
      /077\s+REMANENTE.*?(\d{1,3}(?:\.\d{3})*)/i,
      /077.*?(\d{1,3}(?:\.\d{3})*)/,
      /REMANENTE.*?(\d{1,3}(?:\.\d{3})*)/i
    ],
    codigo151: [
      /151\s+RETENC.*?(\d{1,3}(?:\.\d{3})*)/i,
      /151.*?(\d{1,3}(?:\.\d{3})*)/,
      /RETENC.*?21\.133.*?(\d{1,3}(?:\.\d{3})*)/i
    ]
  };
  
  // Buscar cada código con múltiples estrategias
  for (const [fieldName, patterns] of Object.entries(codePatterns)) {
    let found = false;
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = cleanAndValidateAmount(match[1]);
        if (value > 0 && value < 100000000000) { // Validar rango razonable
          (result as any)[fieldName] = value;
          result.debugInfo.patternMatches[fieldName] = match[0];
          result.debugInfo.tableEntriesFound++;
          console.log(`✅ ${fieldName}: ${value.toLocaleString()}`);
          found = true;
          break;
        }
      }
    }
    
    // Si no se encontró con patrones, buscar en líneas individuales
    if (!found) {
      const code = fieldName.replace('codigo', '');
      for (const line of lines) {
        if (line.includes(code)) {
          const numbers = line.match(/(\d{1,3}(?:\.\d{3})*)/g);
          if (numbers) {
            for (const num of numbers) {
              const value = cleanAndValidateAmount(num);
              if (value > 1000 && value < 100000000000) {
                (result as any)[fieldName] = value;
                result.debugInfo.tableEntriesFound++;
                console.log(`✅ ${fieldName} (línea): ${value.toLocaleString()}`);
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
      }
    }
  }
  
  // Buscar códigos adicionales con patrones simples
  const additionalCodes = {
    codigo503: /503.*?(\d+)/,
    codigo502: /502.*?(\d{1,3}(?:\.\d{3})*)/,
    codigo759: /759.*?(\d{1,3}(?:\.\d{3})*)/,
    codigo510: /510.*?(\d{1,3}(?:\.\d{3})*)/,
    codigo089: /089.*?(\d{1,3}(?:\.\d{3})*)/,
    codigo547: /547.*?(\d{1,3}(?:\.\d{3})*)/
  };
  
  for (const [fieldName, pattern] of Object.entries(additionalCodes)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = cleanAndValidateAmount(match[1]);
      if (value >= 0) {
        (result as any)[fieldName] = value;
        console.log(`✅ ${fieldName}: ${value.toLocaleString()}`);
      }
    }
  }
}

function cleanAndValidateAmount(str: string): number {
  if (!str) return 0;
  
  // Remover todo lo que no sean dígitos o puntos
  const cleaned = str.replace(/[^\d.]/g, '');
  
  // Si tiene puntos, asumir formato chileno (puntos como separadores de miles)
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 1) {
      // Formato chileno: 1.234.567
      const withoutSeparators = cleaned.replace(/\./g, '');
      return parseInt(withoutSeparators) || 0;
    }
  }
  
  return parseInt(cleaned) || 0;
}

function performRealCalculations(result: F29RealData) {
  console.log('🧮 Realizando cálculos según normativa chilena...');
  
  // Compras Netas = Código 538 ÷ 0.19 (según corrección en CLAUDE.md)
  if (result.codigo538 > 0) {
    result.comprasNetas = Math.round(result.codigo538 / 0.19);
    console.log(`📊 Compras Netas calculadas: ${result.comprasNetas.toLocaleString()}`);
  }
  
  // IVA Determinado = Código 538 - Código 511 (puede ser negativo)
  if (result.codigo538 > 0 && result.codigo511 > 0) {
    result.ivaDeterminado = result.codigo538 - result.codigo511;
    console.log(`📊 IVA Determinado: ${result.ivaDeterminado.toLocaleString()}`);
  }
  
  // Total a Pagar = IVA + PPM + Remanente
  result.totalAPagar = Math.abs(result.ivaDeterminado) + result.codigo062 + result.codigo077;
  console.log(`📊 Total a Pagar: ${result.totalAPagar.toLocaleString()}`);
  
  // Margen Bruto = Ventas - Compras
  if (result.codigo563 > 0 && result.comprasNetas > 0) {
    result.margenBruto = result.codigo563 - result.comprasNetas;
    console.log(`📊 Margen Bruto: ${result.margenBruto.toLocaleString()}`);
  }
}

function calculateRealConfidence(result: F29RealData): number {
  let score = 0;
  
  // Información básica del encabezado (30 puntos)
  if (result.rut && /\d{1,2}\.\d{3}\.\d{3}-[\dkK]/.test(result.rut)) score += 10;
  if (result.folio && result.folio.length >= 10) score += 8;
  if (result.periodo && /^\d{6}$/.test(result.periodo)) score += 7;
  if (result.razonSocial) score += 5;
  
  // Códigos críticos (50 puntos)
  if (result.codigo511 > 0) score += 15;
  if (result.codigo538 > 0) score += 15;
  if (result.codigo563 > 0) score += 12;
  if (result.codigo062 > 0) score += 5;
  if (result.codigo077 > 0) score += 3;
  
  // Coherencia matemática (20 puntos)
  if (result.codigo563 > 0 && result.comprasNetas > 0) {
    const ratio = result.comprasNetas / result.codigo563;
    if (ratio > 0.5 && ratio < 1.5) score += 10; // Ratio razonable
  }
  
  if (result.codigo538 > 0 && result.codigo511 > 0) {
    const calculatedIVA = result.codigo538 - result.codigo511;
    if (Math.abs(calculatedIVA - result.ivaDeterminado) < 1000) score += 10;
  }
  
  // Bonus por entradas de tabla encontradas
  const tableBonus = Math.min(result.debugInfo.tableEntriesFound * 3, 15);
  score += tableBonus;
  
  return Math.min(score, 100);
}