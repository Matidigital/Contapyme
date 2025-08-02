// ==========================================
// F29 INNOVATIVE PARSER - ESTRATEGIA HÍBRIDA
// Parser de nueva generación con múltiples estrategias innovadoras
// ==========================================

import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js';
}

export interface F29InnovativeData {
  // Información básica
  rut: string;
  folio: string;
  periodo: string;
  razonSocial: string;
  
  // Códigos F29 principales
  codigo511: number; // CRÉD. IVA POR DCTOS. ELECTRÓNICOS
  codigo538: number; // TOTAL DÉBITOS
  codigo077: number; // REMANENTE DE CRÉDITO FISC.
  codigo151: number; // RETENCIÓN TASA LEY 21.133
  codigo563: number; // BASE IMPONIBLE
  codigo062: number; // PPM NETO DETERMINADO
  
  // Códigos adicionales detectados
  codigo503: number; // CANTIDAD FACTURAS EMITIDAS
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
  extractionDetails: {
    strategiesUsed: string[];
    valuesFound: Record<string, any>;
    rawTextSample: string;
    mathValidation: boolean;
  };
}

// Definición de códigos F29 con contexto
const F29_CODES = {
  // Información básica
  '03': { field: 'rut', name: 'RUT', pattern: /\d{1,2}\.\d{3}\.\d{3}-[\dkK]/i },
  '07': { field: 'folio', name: 'FOLIO', pattern: /\d{10,}/i },
  '15': { field: 'periodo', name: 'PERÍODO', pattern: /\d{6}/i },
  
  // Códigos principales
  '511': { field: 'codigo511', name: 'CRÉD. IVA POR DCTOS. ELECTRÓNICOS', type: 'credit' },
  '538': { field: 'codigo538', name: 'TOTAL DÉBITOS', type: 'debit' },
  '077': { field: 'codigo077', name: 'REMANENTE DE CRÉDITO FISC.', type: 'credit' },
  '151': { field: 'codigo151', name: 'RETENCIÓN TASA LEY 21.133', type: 'retention' },
  '563': { field: 'codigo563', name: 'BASE IMPONIBLE', type: 'base' },
  '062': { field: 'codigo062', name: 'PPM NETO DETERMINADO', type: 'tax' },
  
  // Códigos auxiliares
  '503': { field: 'codigo503', name: 'CANTIDAD FACTURAS EMITIDAS', type: 'quantity' },
  '089': { field: 'codigo089', name: 'IMP. DETERM. IVA', type: 'tax' },
  '547': { field: 'codigo547', name: 'TOTAL DETERMINADO', type: 'total' }
};

export async function parseF29Innovative(file: File): Promise<F29InnovativeData> {
  console.log('🚀 F29 INNOVATIVE PARSER: Iniciando análisis híbrido...');
  
  const result: F29InnovativeData = {
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
    codigo503: 0,
    codigo089: 0,
    codigo547: 0,
    comprasNetas: 0,
    ivaDeterminado: 0,
    totalAPagar: 0,
    margenBruto: 0,
    confidence: 0,
    method: 'innovative-hybrid',
    extractionDetails: {
      strategiesUsed: [],
      valuesFound: {},
      rawTextSample: '',
      mathValidation: false
    }
  };

  try {
    // ESTRATEGIA 1: Análisis estructural avanzado con pdfjs-dist
    const structuralData = await extractWithStructuralAnalysis(file);
    if (structuralData) {
      mergeResults(result, structuralData, 'structural');
      result.extractionDetails.strategiesUsed.push('structural');
    }

    // ESTRATEGIA 2: Análisis tabular inteligente
    const tabularData = await extractWithTabularAnalysis(file);
    if (tabularData) {
      mergeResults(result, tabularData, 'tabular');
      result.extractionDetails.strategiesUsed.push('tabular');
    }

    // ESTRATEGIA 3: Análisis posicional por coordenadas
    const positionalData = await extractWithPositionalAnalysis(file);
    if (positionalData) {
      mergeResults(result, positionalData, 'positional');
      result.extractionDetails.strategiesUsed.push('positional');
    }

    // ESTRATEGIA 4: Pattern matching contextual
    const contextualData = await extractWithContextualPatterns(file);
    if (contextualData) {
      mergeResults(result, contextualData, 'contextual');
      result.extractionDetails.strategiesUsed.push('contextual');
    }

    // ESTRATEGIA 5: Análisis de flujo de datos
    const flowData = await extractWithDataFlow(file);
    if (flowData) {
      mergeResults(result, flowData, 'dataflow');
      result.extractionDetails.strategiesUsed.push('dataflow');
    }

    // VALIDACIÓN Y CÁLCULOS FINALES
    performCalculations(result);
    result.confidence = calculateHybridConfidence(result);
    result.extractionDetails.mathValidation = validateMathematicalCoherence(result);

    console.log('✅ F29 INNOVATIVE PARSER completado:', {
      confidence: result.confidence,
      strategiesUsed: result.extractionDetails.strategiesUsed,
      mathValid: result.extractionDetails.mathValidation
    });

    return result;

  } catch (error) {
    console.error('❌ Error en F29 Innovative Parser:', error);
    result.confidence = 0;
    return result;
  }
}

// ESTRATEGIA 1: Análisis estructural con pdfjs-dist
async function extractWithStructuralAnalysis(file: File): Promise<Partial<F29InnovativeData> | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    // Extraer contenido con información de posición
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    const result: Partial<F29InnovativeData> = {};
    
    // Analizar items de texto con sus posiciones
    for (const item of content.items) {
      if ('str' in item && item.str.trim()) {
        const text = item.str.trim();
        const x = item.transform[4];
        const y = viewport.height - item.transform[5]; // Invertir Y
        
        // Buscar códigos en posiciones específicas del formulario
        await analyzeTextWithPosition(text, x, y, result);
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Structural analysis failed:', error);
    return null;
  }
}

// ESTRATEGIA 2: Análisis tabular inteligente
async function extractWithTabularAnalysis(file: File): Promise<Partial<F29InnovativeData> | null> {
  try {
    const text = await extractTextFromPDF(file);
    const result: Partial<F29InnovativeData> = {};
    
    // Buscar patrones tabulares: Código Glosa Valor
    const tablePattern = /(\d{3})\s+([A-Z\s\.\/\(\)]+?)\s+([\d\.\,]+)/gi;
    const matches = [...text.matchAll(tablePattern)];
    
    for (const match of matches) {
      const code = match[1];
      const description = match[2].trim();
      const value = cleanNumber(match[3]);
      
      if (F29_CODES[code] && value > 0) {
        const fieldName = F29_CODES[code].field as keyof F29InnovativeData;
        if (typeof fieldName === 'string' && fieldName in result === false) {
          (result as any)[fieldName] = value;
          console.log(`📊 Tabular: ${code} = ${value.toLocaleString()}`);
        }
      }
    }
    
    // Buscar información básica en headers
    extractBasicInfoFromHeader(text, result);
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Tabular analysis failed:', error);
    return null;
  }
}

// ESTRATEGIA 3: Análisis posicional por coordenadas
async function extractWithPositionalAnalysis(file: File): Promise<Partial<F29InnovativeData> | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    
    const result: Partial<F29InnovativeData> = {};
    const textMap = new Map<string, {x: number, y: number, text: string}>();
    
    // Construir mapa de posiciones
    for (const item of content.items) {
      if ('str' in item && item.str.trim()) {
        const text = item.str.trim();
        const x = Math.round(item.transform[4]);
        const y = Math.round(item.transform[5]);
        textMap.set(`${x},${y}`, { x, y, text });
      }
    }
    
    // Buscar códigos y sus valores a la derecha
    for (const [key, {x, y, text}] of textMap.entries()) {
      if (/^\d{3}$/.test(text) && F29_CODES[text]) {
        // Buscar valor a la derecha (mayor X, similar Y)
        const valueItems = Array.from(textMap.values())
          .filter(item => item.x > x && Math.abs(item.y - y) < 10)
          .sort((a, b) => a.x - b.x);
        
        for (const valueItem of valueItems) {
          const value = cleanNumber(valueItem.text);
          if (value > 0) {
            const fieldName = F29_CODES[text].field as keyof F29InnovativeData;
            if (typeof fieldName === 'string') {
              (result as any)[fieldName] = value;
              console.log(`📍 Positional: ${text} = ${value.toLocaleString()}`);
              break;
            }
          }
        }
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Positional analysis failed:', error);
    return null;
  }
}

// ESTRATEGIA 4: Pattern matching contextual
async function extractWithContextualPatterns(file: File): Promise<Partial<F29InnovativeData> | null> {
  try {
    const text = await extractTextFromPDF(file);
    const result: Partial<F29InnovativeData> = {};
    
    // Patrones específicos del F29
    const patterns = {
      // Información básica con contexto
      rut: /RUT\s*\[?\d*\]?\s*([\d\.-]+)/i,
      folio: /FOLIO\s*\[?\d*\]?\s*(\d+)/i,
      periodo: /PERIODO\s*\[?\d*\]?\s*(\d{6})/i,
      razonSocial: /(?:Razón Social|COMERCIALIZADORA)\s+([A-Z\s]+?)(?:\s+\d|\n|$)/i,
      
      // Códigos con descripción completa
      codigo511: /511\s+CRÉD\.?\s*IVA.*?(\d{1,3}(?:\.\d{3})*)/i,
      codigo538: /538\s+TOTAL\s+DÉBITOS.*?(\d{1,3}(?:\.\d{3})*)/i,
      codigo077: /077\s+REMANENTE.*?(\d{1,3}(?:\.\d{3})*)/i,
      codigo151: /151\s+RETENCIÓN.*?(\d{1,3}(?:\.\d{3})*)/i,
      codigo563: /563\s+BASE\s+IMPONIBLE.*?(\d{1,3}(?:\.\d{3})*)/i,
      codigo062: /062\s+PPM.*?(\d{1,3}(?:\.\d{3})*)/i
    };
    
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        if (field === 'rut' || field === 'folio' || field === 'periodo' || field === 'razonSocial') {
          (result as any)[field] = match[1].trim();
        } else {
          (result as any)[field] = cleanNumber(match[1]);
        }
        console.log(`🎯 Contextual: ${field} = ${match[1]}`);
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Contextual analysis failed:', error);
    return null;
  }
}

// ESTRATEGIA 5: Análisis de flujo de datos
async function extractWithDataFlow(file: File): Promise<Partial<F29InnovativeData> | null> {
  try {
    const text = await extractTextFromPDF(file);
    const result: Partial<F29InnovativeData> = {};
    
    // Extraer todos los números significativos con su contexto
    const numberPattern = /(\d{1,3}(?:\.\d{3})*|\d+)/g;
    const numbers = [...text.matchAll(numberPattern)]
      .map(match => ({
        value: cleanNumber(match[1]),
        index: match.index || 0,
        original: match[1]
      }))
      .filter(n => n.value > 1000) // Solo números significativos
      .sort((a, b) => b.value - a.value); // Ordenar por valor descendente
    
    // Análisis heurístico basado en patrones del F29 real
    const analysis = {
      // El valor más alto suele ser Base Imponible (563)
      baseImponible: numbers.find(n => n.value > 10000000),
      
      // Valores entre 1M-10M suelen ser créditos/débitos
      creditsDebits: numbers.filter(n => n.value >= 1000000 && n.value < 10000000),
      
      // Valores entre 100K-1M suelen ser PPM/remanentes
      mediumValues: numbers.filter(n => n.value >= 100000 && n.value < 1000000),
      
      // Valores pequeños suelen ser retenciones
      smallValues: numbers.filter(n => n.value >= 1000 && n.value < 100000)
    };
    
    // Mapear valores según análisis heurístico
    if (analysis.baseImponible) {
      result.codigo563 = analysis.baseImponible.value;
    }
    
    // Para créditos/débitos, verificar contexto
    for (const num of analysis.creditsDebits.slice(0, 3)) {
      const context = text.substring(Math.max(0, num.index - 50), num.index + 50);
      if (/créd|credit/i.test(context)) {
        if (!result.codigo511) result.codigo511 = num.value;
      } else if (/débit|total.*débit/i.test(context)) {
        if (!result.codigo538) result.codigo538 = num.value;
      }
    }
    
    console.log(`🌊 DataFlow: Analizados ${numbers.length} valores`);
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('DataFlow analysis failed:', error);
    return null;
  }
}

// Funciones auxiliares
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is any => 'str' in item)
      .map(item => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

function cleanNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
}

function mergeResults(target: F29InnovativeData, source: Partial<F29InnovativeData>, strategy: string) {
  for (const [key, value] of Object.entries(source)) {
    if (value && !target[key as keyof F29InnovativeData]) {
      (target as any)[key] = value;
      target.extractionDetails.valuesFound[key] = { value, strategy };
    }
  }
}

async function analyzeTextWithPosition(text: string, x: number, y: number, result: Partial<F29InnovativeData>) {
  // Analizar códigos F29 en posiciones específicas
  if (/^\d{3}$/.test(text) && F29_CODES[text]) {
    // Este es un código F29, buscar su valor
    console.log(`📍 Código ${text} encontrado en posición (${x}, ${y})`);
  }
  
  // Buscar información básica
  const rutMatch = text.match(/(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/);
  if (rutMatch) {
    result.rut = rutMatch[1];
  }
  
  const folioMatch = text.match(/(\d{10,})/);
  if (folioMatch && text.length >= 10) {
    result.folio = folioMatch[1];
  }
}

function extractBasicInfoFromHeader(text: string, result: Partial<F29InnovativeData>) {
  // RUT del encabezado
  const rutMatch = text.match(/RUT\s*\[?\d*\]?\s*([\d\.-]+)/i);
  if (rutMatch) {
    result.rut = rutMatch[1];
  }
  
  // FOLIO del encabezado
  const folioMatch = text.match(/FOLIO\s*\[?\d*\]?\s*(\d+)/i);
  if (folioMatch) {
    result.folio = folioMatch[1];
  }
  
  // PERÍODO del encabezado
  const periodoMatch = text.match(/PERIODO\s*\[?\d*\]?\s*(\d{6})/i);
  if (periodoMatch) {
    result.periodo = periodoMatch[1];
  }
  
  // Razón Social
  const razonMatch = text.match(/(?:01.*?Razón Social|COMERCIALIZADORA)\s+([A-Z\s]+?)(?:\s+\d|\n|Calle)/i);
  if (razonMatch) {
    result.razonSocial = razonMatch[1].trim();
  }
}

function performCalculations(result: F29InnovativeData) {
  // Compras Netas = Código 538 ÷ 0.19
  if (result.codigo538 > 0) {
    result.comprasNetas = Math.round(result.codigo538 / 0.19);
  }
  
  // IVA Determinado = Código 538 - Código 511
  if (result.codigo538 > 0 && result.codigo511 > 0) {
    result.ivaDeterminado = result.codigo538 - result.codigo511;
  }
  
  // Total a Pagar = PPM + Remanente + Retenciones
  result.totalAPagar = result.codigo062 + result.codigo077 + result.codigo151;
  
  // Margen Bruto = Ventas - Compras
  if (result.codigo563 > 0 && result.comprasNetas > 0) {
    result.margenBruto = result.codigo563 - result.comprasNetas;
  }
}

function calculateHybridConfidence(result: F29InnovativeData): number {
  let score = 0;
  
  // Información básica (30 puntos)
  if (result.rut) score += 10;
  if (result.folio) score += 8;
  if (result.periodo) score += 7;
  if (result.razonSocial) score += 5;
  
  // Códigos principales (50 puntos)
  if (result.codigo538 > 0) score += 15;
  if (result.codigo511 > 0) score += 15;
  if (result.codigo563 > 0) score += 10;
  if (result.codigo062 > 0) score += 5;
  if (result.codigo077 > 0) score += 3;
  if (result.codigo151 > 0) score += 2;
  
  // Validación matemática (20 puntos)
  if (result.extractionDetails.mathValidation) score += 20;
  
  // Bonus por múltiples estrategias
  const strategiesBonus = result.extractionDetails.strategiesUsed.length * 2;
  score += Math.min(strategiesBonus, 10);
  
  return Math.min(score, 100);
}

function validateMathematicalCoherence(result: F29InnovativeData): boolean {
  let validations = 0;
  let total = 0;
  
  // Validación 1: Compras vs Base Imponible (deben ser similares)
  if (result.codigo563 > 0 && result.comprasNetas > 0) {
    const ratio = result.comprasNetas / result.codigo563;
    if (ratio > 0.8 && ratio < 1.2) validations++;
    total++;
  }
  
  // Validación 2: IVA coherente con débitos y créditos
  if (result.codigo538 > 0 && result.codigo511 > 0) {
    const calculatedIVA = result.codigo538 - result.codigo511;
    if (Math.abs(calculatedIVA - result.ivaDeterminado) < 1000) validations++;
    total++;
  }
  
  // Validación 3: Valores en rangos esperados
  if (result.codigo563 > result.codigo538 && result.codigo563 > result.codigo511) {
    validations++;
  }
  total++;
  
  return total > 0 ? (validations / total) >= 0.6 : false;
}