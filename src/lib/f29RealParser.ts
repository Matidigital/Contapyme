// Parser especializado para formularios F29 reales del SII

export interface F29Data {
  // Códigos principales
  codigo538: number; // TOTAL DÉBITOS
  codigo511: number; // CRÉDITO IVA POR DCTOS. ELECTRÓNICOS
  codigo062: number; // PPM NETO DETERMINADO
  codigo077: number; // REMANENTE DE CRÉDITO FISCAL
  codigo563: number; // BASE IMPONIBLE
  
  // Códigos adicionales detectados en el formulario real
  codigo502: number; // DÉBITOS FACTURAS EMITIDAS
  codigo503: number; // CANTIDAD FACTURAS EMITIDAS
  codigo509: number; // CANT. DCTOS. NOTAS DE CRÉDITOS EMITIDAS
  codigo510: number; // DÉBITOS NOTAS DE CRÉDITOS EMITIDAS
  codigo519: number; // CANT. DE DCTOS. FACT. RECIB. DEL GIRO
  codigo520: number; // CRÉDITO REC. Y REINT./FACT. DEL GIRO
  codigo527: number; // CANT. NOTAS DE CRÉDITO RECIBIDAS
  codigo528: number; // CRÉDITO RECUP. Y REINT NOTAS DE CRÉD
  codigo537: number; // TOTAL CRÉDITOS
  codigo544: number; // RECUP. IMP. ESP. DIESEL (Art. 2)
  codigo547: number; // TOTAL DETERMINADO
  codigo595: number; // SUB TOTAL IMP. DETERMINADO ANVERSO
  codigo758: number; // CANT. RECIBO DE PAGO MEDIOS ELECTRÓNICOS  
  codigo759: number; // DÉB. RECIBO DE PAGO MEDIOS ELECTRÓNICOS
  codigo779: number; // Monto de IVA postergado 6 o 12 cuotas
  codigo089: number; // IMP. DETERM. IVA
  codigo115: number; // TASA PPM 1ra. CATEGORÍA
  codigo151: number; // RETENCION TASA LEY 21.133 SOBRE RENTAS
  
  // Información adicional
  rut: string;
  periodo: string;
  folio: string;
  razonSocial: string;
  totalAPagar: number;
}

// Parser principal para F29 real
export function parseRealF29FromText(text: string): Partial<F29Data> {
  console.log('🔍 Iniciando parser F29 SII especializado...');
  console.log('Texto a analizar (primeros 500 chars):', text.substring(0, 500));
  
  const data: Partial<F29Data> = {};
  
  // 1. Extraer información básica
  extractBasicInfo(text, data);
  
  // 2. Extraer códigos usando múltiples estrategias
  extractCodesWithMultipleStrategies(text, data);
  
  // 3. Validar y calcular campos derivados
  validateAndCalculate(data);
  
  console.log('✅ Parser F29 completado:', data);
  return data;
}

// Extraer información básica del formulario
function extractBasicInfo(text: string, data: Partial<F29Data>): void {
  console.log('📋 Extrayendo información básica...');
  
  // RUT
  const rutPattern = /RUT\s*\[?\d*\]?\s*([0-9]{1,2}\.[0-9]{3}\.[0-9]{3}\-[0-9kK])/i;
  const rutMatch = text.match(rutPattern);
  if (rutMatch) {
    data.rut = rutMatch[1];
    console.log('✓ RUT encontrado:', data.rut);
  }
  
  // Período
  const periodoPattern = /PERIODO\s*\[?\d*\]?\s*(\d{6})/i;
  const periodoMatch = text.match(periodoPattern);
  if (periodoMatch) {
    data.periodo = periodoMatch[1];
    console.log('✓ Período encontrado:', data.periodo);
  }
  
  // Folio
  const folioPattern = /FOLIO\s*\[?\d*\]?\s*(\d+)/i;
  const folioMatch = text.match(folioPattern);
  if (folioMatch) {
    data.folio = folioMatch[1];
    console.log('✓ Folio encontrado:', data.folio);
  }
  
  // Razón Social
  const razonPattern = /(?:Razón Social|COMERCIALIZADORA|SPA)\s+([A-Z\s]+(?:SPA|LTDA|SA)?)/i;
  const razonMatch = text.match(razonPattern);
  if (razonMatch) {
    data.razonSocial = razonMatch[1].trim();
    console.log('✓ Razón Social encontrada:', data.razonSocial);
  }
  
  // Total a pagar
  const totalPattern = /TOTAL A PAGAR[^0-9]*(\d{1,3}(?:[.,]\d{3})*)/i;
  const totalMatch = text.match(totalPattern);
  if (totalMatch) {
    data.totalAPagar = parseChileanNumber(totalMatch[1]);
    console.log('✓ Total a pagar encontrado:', data.totalAPagar);
  }
}

// Extraer códigos con múltiples estrategias
function extractCodesWithMultipleStrategies(text: string, data: Partial<F29Data>): void {
  console.log('🔢 Extrayendo códigos F29...');
  
  // Definir códigos a buscar con sus descripciones alternativas
  const codeDefinitions = {
    codigo502: ['DÉBITOS FACTURAS EMITIDAS', '502'],
    codigo503: ['CANTIDAD FACTURAS EMITIDAS', '503'],
    codigo509: ['CANT. DCTOS. NOTAS DE CRÉDITOS EMITIDAS', '509'],
    codigo510: ['DÉBITOS NOTAS DE CRÉDITOS EMITIDAS', '510'],
    codigo511: ['CRÉD. IVA POR DCTOS. ELECTRÓNICOS', 'CRÉDITO IVA', '511'],
    codigo519: ['CANT. DE DCTOS. FACT. RECIB. DEL GIRO', '519'],
    codigo520: ['CRÉDITO REC. Y REINT./FACT. DEL GIRO', '520'],
    codigo527: ['CANT. NOTAS DE CRÉDITO RECIBIDAS', '527'],
    codigo528: ['CRÉDITO RECUP. Y REINT NOTAS DE CRÉD', '528'],
    codigo537: ['TOTAL CRÉDITOS', '537'],
    codigo538: ['TOTAL DÉBITOS', '538'],
    codigo544: ['RECUP. IMP. ESP. DIESEL', '544'],
    codigo547: ['TOTAL DETERMINADO', '547'],
    codigo563: ['BASE IMPONIBLE', '563'],
    codigo595: ['SUB TOTAL IMP. DETERMINADO ANVERSO', '595'],
    codigo062: ['PPM NETO DETERMINADO', 'PPM', '062'],
    codigo077: ['REMANENTE DE CRÉDITO FISC', 'REMANENTE', '077'],
    codigo089: ['IMP. DETERM. IVA', '089'],
    codigo115: ['TASA PPM 1ra. CATEGORÍA', '115'],
    codigo151: ['RETENCION TASA LEY 21.133', '151'],
    codigo758: ['CANT. RECIBO DE PAGO MEDIOS ELECTRÓNICOS', '758'],
    codigo759: ['DÉB. RECIBO DE PAGO MEDIOS ELECTRÓNICOS', '759'],
    codigo779: ['Monto de IVA postergado', '779']
  };
  
  // Estrategia 1: Buscar por líneas del formato "Código Glosa Valor"
  extractFromTableFormat(text, data, codeDefinitions);
  
  // Estrategia 2: Buscar por patrones específicos
  extractWithSpecificPatterns(text, data, codeDefinitions);
  
  // Estrategia 3: Buscar en formato de tabla visual
  extractFromVisualTable(text, data, codeDefinitions);
}

// Estrategia 1: Formato tabla "Código Glosa Valor"
function extractFromTableFormat(text: string, data: Partial<F29Data>, codeDefinitions: any): void {
  console.log('📊 Estrategia 1: Formato tabla...');
  
  const lines = text.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length < 5) continue;
    
    // Buscar patrón: número código + descripción + valor
    for (const [key, descriptions] of Object.entries(codeDefinitions)) {
      const code = key.replace('codigo', '');
      
      // Buscar si la línea contiene el código y alguna descripción
      const hasCode = line.includes(code);
      const hasDescription = descriptions.some((desc: string) => 
        line.toUpperCase().includes(desc.toUpperCase())
      );
      
      if (hasCode || hasDescription) {
        // Extraer números de la línea
        const numbers = extractNumbersFromLine(line);
        if (numbers.length > 0) {
          // Tomar el número más grande (generalmente es el valor)
          const value = Math.max(...numbers);
          if (value > 0) {
            (data as any)[key] = value;
            console.log(`✓ ${key}: ${value.toLocaleString('es-CL')} (tabla)`);
          }
        }
      }
    }
  }
}

// Estrategia 2: Patrones específicos
function extractWithSpecificPatterns(text: string, data: Partial<F29Data>, codeDefinitions: any): void {
  console.log('🎯 Estrategia 2: Patrones específicos...');
  
  for (const [key, descriptions] of Object.entries(codeDefinitions)) {
    if ((data as any)[key]) continue; // Ya encontrado
    
    const code = key.replace('codigo', '');
    
    // Crear patrones específicos para cada código
    const patterns = [
      // Patrón 1: Código seguido de descripción y valor
      new RegExp(`${code}\\s+[^0-9]*?([0-9]{1,3}(?:[.,]\\d{3})*)`, 'gi'),
      // Patrón 2: Descripción seguida de valor
      ...descriptions.map((desc: string) => 
        new RegExp(`${desc}[^0-9]*?([0-9]{1,3}(?:[.,]\\d{3})*)`, 'gi')
      ),
      // Patrón 3: Código en formato tabla
      new RegExp(`^\\s*${code}\\s+.*?([0-9]{1,3}(?:[.,]\\d{3})*)\\s*$`, 'gim')
    ];
    
    let bestValue = 0;
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          const value = parseChileanNumber(match[1]);
          if (value > bestValue) {
            bestValue = value;
          }
        }
      }
    }
    
    if (bestValue > 0) {
      (data as any)[key] = bestValue;
      console.log(`✓ ${key}: ${bestValue.toLocaleString('es-CL')} (patrón)`);
    }
  }
}

// Estrategia 3: Tabla visual
function extractFromVisualTable(text: string, data: Partial<F29Data>, codeDefinitions: any): void {
  console.log('👁️ Estrategia 3: Tabla visual...');
  
  // Buscar bloques que parecen tablas
  const tableBlocks = text.split(/\n\s*\n/).filter(block => 
    block.includes('Código') && block.includes('Glosa') && block.includes('Valor')
  );
  
  for (const block of tableBlocks) {
    const lines = block.split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s{2,}|\t/); // Separar por espacios múltiples o tabs
      
      if (parts.length >= 3) {
        const code = parts[0].trim();
        const description = parts[1].trim();
        const valueStr = parts[2].trim();
        
        // Buscar qué código corresponde
        for (const [key, descriptions] of Object.entries(codeDefinitions)) {
          const targetCode = key.replace('codigo', '');
          
          if (code === targetCode || descriptions.some((desc: string) => 
            description.toUpperCase().includes(desc.toUpperCase())
          )) {
            const value = parseChileanNumber(valueStr);
            if (value > 0) {
              (data as any)[key] = value;
              console.log(`✓ ${key}: ${value.toLocaleString('es-CL')} (visual)`);
            }
          }
        }
      }
    }
  }
}

// Extraer números de una línea
function extractNumbersFromLine(line: string): number[] {
  const numberPatterns = [
    /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/g,
    /([0-9]+)/g
  ];
  
  const numbers: number[] = [];
  
  for (const pattern of numberPatterns) {
    const matches = [...line.matchAll(pattern)];
    for (const match of matches) {
      const num = parseChileanNumber(match[1]);
      if (num > 0) {
        numbers.push(num);
      }
    }
  }
  
  return [...new Set(numbers)]; // Eliminar duplicados
}

// Parsear números en formato chileno
function parseChileanNumber(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  
  // Limpiar string
  let cleanStr = str.trim().replace(/[^\d.,]/g, '');
  
  if (!cleanStr) return 0;
  
  // Detectar formato chileno: 1.234.567 vs 1,234,567
  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    const lastDot = cleanStr.lastIndexOf('.');
    const lastComma = cleanStr.lastIndexOf(',');
    
    if (lastComma > lastDot) {
      // Formato chileno: 1.234.567,89
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato internacional: 1,234,567.89
      cleanStr = cleanStr.replace(/,/g, '');
    }
  } else if (cleanStr.includes('.')) {
    // Solo puntos - probablemente separador de miles chileno
    const parts = cleanStr.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      cleanStr = cleanStr.replace(/\./g, '');
    }
  }
  
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : Math.floor(num);
}

// Validar y calcular campos derivados
function validateAndCalculate(data: Partial<F29Data>): void {
  console.log('✅ Validando y calculando campos derivados...');
  
  // Calcular IVA determinado si no está presente
  if (!data.codigo089 && data.codigo538 && data.codigo537) {
    data.codigo089 = Math.max(0, data.codigo538 - data.codigo537);
    console.log(`📊 IVA determinado calculado: ${data.codigo089}`);
  }
  
  // Validar coherencia entre códigos
  if (data.codigo538 && data.codigo511) {
    const ivaDeterminado = data.codigo538 - data.codigo511;
    if (data.codigo089 && Math.abs(data.codigo089 - ivaDeterminado) > 1000) {
      console.warn(`⚠️ Posible inconsistencia: IVA determinado ${data.codigo089} vs calculado ${ivaDeterminado}`);
    }
  }
  
  // Validar total determinado
  if (data.codigo547 && data.codigo089 && data.codigo062) {
    const totalCalculado = (data.codigo089 || 0) + (data.codigo062 || 0);
    if (Math.abs(data.codigo547 - totalCalculado) > 1000) {
      console.warn(`⚠️ Total determinado ${data.codigo547} vs calculado ${totalCalculado}`);
    }
  }
  
  console.log('✅ Validación completada');
}

// Función principal de parser que combina PDF parsing con el parser especializado
export async function parseF29FromPDF(file: File): Promise<Partial<F29Data>> {
  console.log('🚀 Iniciando parser F29 especializado...');
  
  try {
    // Intentar extraer texto del PDF
    let text = '';
    
    try {
      // Método 1: Leer como texto
      text = await file.text();
      console.log('✓ Texto extraído del PDF');
    } catch (error) {
      console.log('❌ No se pudo leer como texto, intentando método alternativo');
      
      // Método 2: Usar FileReader
      const reader = new FileReader();
      text = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
    
    // Aplicar parser especializado
    const result = parseRealF29FromText(text);
    
    console.log('🎉 Parser F29 completado exitosamente:', Object.keys(result));
    return result;
    
  } catch (error) {
    console.error('❌ Error en parser F29:', error);
    throw new Error(`Error procesando F29: ${error.message}`);
  }
}