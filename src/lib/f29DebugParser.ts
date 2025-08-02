// ==========================================
// F29 DEBUG PARSER - DEPURACIÓN EXHAUSTIVA
// Para ver exactamente qué está pasando con el PDF
// ==========================================

export async function parseF29Debug(file: File): Promise<any> {
  console.log('🔍 F29 DEBUG PARSER: Iniciando depuración exhaustiva...');
  
  const debugResult = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    extractionMethods: [] as any[],
    finalExtraction: '',
    patterns: {
      rut: [],
      folio: [],
      periodo: [],
      codigo511: [],
      codigo538: [],
      codigo563: [],
      codigo062: [],
      codigo077: []
    },
    allNumbers: [],
    confidence: 0
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`📄 Archivo: ${file.name}, Tamaño: ${file.size} bytes`);
    
    // MÉTODO 1: TextDecoder UTF-8
    try {
      const utf8Text = new TextDecoder('utf-8').decode(uint8Array);
      debugResult.extractionMethods.push({
        method: 'utf-8',
        textLength: utf8Text.length,
        sample: utf8Text.substring(0, 200),
        numbersFound: (utf8Text.match(/\d+/g) || []).length,
        hasF29Keywords: utf8Text.includes('FOLIO') || utf8Text.includes('RUT') || utf8Text.includes('511')
      });
      console.log('✅ UTF-8:', utf8Text.length, 'chars');
    } catch (e) {
      console.log('❌ UTF-8 failed:', e.message);
    }
    
    // MÉTODO 2: TextDecoder Latin-1
    try {
      const latin1Text = new TextDecoder('latin-1').decode(uint8Array);
      debugResult.extractionMethods.push({
        method: 'latin-1',
        textLength: latin1Text.length,
        sample: latin1Text.substring(0, 200),
        numbersFound: (latin1Text.match(/\d+/g) || []).length,
        hasF29Keywords: latin1Text.includes('FOLIO') || latin1Text.includes('RUT') || latin1Text.includes('511')
      });
      console.log('✅ Latin-1:', latin1Text.length, 'chars');
    } catch (e) {
      console.log('❌ Latin-1 failed:', e.message);
    }
    
    // MÉTODO 3: Extracción ASCII pura
    let asciiText = '';
    for (let i = 0; i < uint8Array.length; i++) {
      const byte = uint8Array[i];
      if (byte >= 32 && byte <= 126) {
        asciiText += String.fromCharCode(byte);
      } else if (byte === 10 || byte === 13) {
        asciiText += '\n';
      } else {
        asciiText += ' ';
      }
    }
    
    debugResult.extractionMethods.push({
      method: 'ascii-pure',
      textLength: asciiText.length,
      sample: asciiText.substring(0, 200),
      numbersFound: (asciiText.match(/\d+/g) || []).length,
      hasF29Keywords: asciiText.includes('FOLIO') || asciiText.includes('RUT') || asciiText.includes('511')
    });
    console.log('✅ ASCII:', asciiText.length, 'chars');
    
    // SELECCIONAR EL MEJOR MÉTODO
    const bestMethod = debugResult.extractionMethods
      .sort((a, b) => {
        // Priorizar por keywords > números > longitud
        const scoreA = (a.hasF29Keywords ? 100 : 0) + a.numbersFound + (a.textLength / 1000);
        const scoreB = (b.hasF29Keywords ? 100 : 0) + b.numbersFound + (b.textLength / 1000);
        return scoreB - scoreA;
      })[0];
    
    console.log(`🏆 Mejor método: ${bestMethod.method}`);
    
    // Usar el texto del mejor método
    let finalText = '';
    if (bestMethod.method === 'utf-8') {
      finalText = new TextDecoder('utf-8').decode(uint8Array);
    } else if (bestMethod.method === 'latin-1') {
      finalText = new TextDecoder('latin-1').decode(uint8Array);
    } else {
      finalText = asciiText;
    }
    
    debugResult.finalExtraction = finalText.substring(0, 1000); // Primeros 1000 chars
    
    // BUSCAR PATRONES ESPECÍFICOS
    console.log('🔍 Buscando patrones específicos...');
    
    // RUT patterns
    const rutPatterns = [
      /RUT\s*\[0?3\]\s*(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/gi,
      /\[0?3\]\s*(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/gi,
      /(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/gi
    ];
    
    for (const pattern of rutPatterns) {
      const matches = [...finalText.matchAll(pattern)];
      if (matches.length > 0) {
        debugResult.patterns.rut.push(...matches.map(m => m[1] || m[0]));
      }
    }
    
    // FOLIO patterns
    const folioPatterns = [
      /FOLIO\s*\[0?7\]\s*(\d+)/gi,
      /\[0?7\]\s*(\d{10,})/gi,
      /(\d{10,})/gi
    ];
    
    for (const pattern of folioPatterns) {
      const matches = [...finalText.matchAll(pattern)];
      if (matches.length > 0) {
        debugResult.patterns.folio.push(...matches.map(m => m[1] || m[0]));
      }
    }
    
    // PERÍODO patterns
    const periodoPatterns = [
      /PERIODO\s*\[1?5\]\s*(\d{6})/gi,
      /\[1?5\]\s*(\d{6})/gi,
      /(\d{6})/gi
    ];
    
    for (const pattern of periodoPatterns) {
      const matches = [...finalText.matchAll(pattern)];
      if (matches.length > 0) {
        debugResult.patterns.periodo.push(...matches.map(m => m[1] || m[0]));
      }
    }
    
    // CÓDIGOS F29 - múltiples estrategias
    const codePatterns = {
      codigo511: [
        /511\s+[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi,
        /511[^0-9]*(\d{6,})/gi,
        /CRÉD.*?IVA[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi
      ],
      codigo538: [
        /538\s+[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi,
        /538[^0-9]*(\d{6,})/gi,
        /TOTAL.*?DÉBITOS[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi
      ],
      codigo563: [
        /563\s+[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi,
        /563[^0-9]*(\d{7,})/gi,
        /BASE.*?IMPONIBLE[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi
      ],
      codigo062: [
        /062\s+[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi,
        /062[^0-9]*(\d{5,})/gi,
        /PPM[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi
      ],
      codigo077: [
        /077\s+[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi,
        /077[^0-9]*(\d{5,})/gi,
        /REMANENTE[^0-9]*(\d{1,3}(?:\.\d{3})*)/gi
      ]
    };
    
    for (const [fieldName, patterns] of Object.entries(codePatterns)) {
      for (const pattern of patterns) {
        const matches = [...finalText.matchAll(pattern)];
        if (matches.length > 0) {
          (debugResult.patterns as any)[fieldName].push(...matches.map(m => m[1] || m[0]));
        }
      }
    }
    
    // EXTRAER TODOS LOS NÚMEROS
    const allNumberMatches = [...finalText.matchAll(/(\d{1,3}(?:\.\d{3})*|\d+)/g)];
    debugResult.allNumbers = allNumberMatches
      .map(m => m[1] || m[0])
      .filter(n => parseInt(n.replace(/\./g, '')) > 1000)
      .slice(0, 20); // Primeros 20 números significativos
    
    // MOSTRAR RESULTADOS
    console.log('📊 RESULTADOS DEBUG:');
    console.log('RUTs encontrados:', debugResult.patterns.rut);
    console.log('FOLIOs encontrados:', debugResult.patterns.folio);
    console.log('PERÍODOs encontrados:', debugResult.patterns.periodo);
    console.log('Código 511:', debugResult.patterns.codigo511);
    console.log('Código 538:', debugResult.patterns.codigo538);
    console.log('Código 563:', debugResult.patterns.codigo563);
    console.log('Números encontrados:', debugResult.allNumbers);
    
    // BUSCAR LÍNEAS ESPECÍFICAS
    const lines = finalText.split(/[\r\n]+/);
    const relevantLines = lines.filter(line => 
      line.includes('511') || 
      line.includes('538') || 
      line.includes('563') || 
      line.includes('FOLIO') ||
      line.includes('RUT') ||
      line.includes('CRÉD') ||
      line.includes('TOTAL') ||
      line.includes('BASE')
    ).slice(0, 10);
    
    console.log('📝 Líneas relevantes:', relevantLines);
    
    debugResult.confidence = 50; // Debug siempre retorna 50
    
    return debugResult;
    
  } catch (error) {
    console.error('❌ Error en debug parser:', error);
    debugResult.confidence = 0;
    return debugResult;
  }
}