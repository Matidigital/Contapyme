// ==========================================
// RCV PARSER - ANÁLISIS DE REGISTRO DE COMPRAS Y VENTAS
// Procesa archivos CSV del SII para análisis de proveedores
// ==========================================

export interface RCVRow {
  nro: string;
  tipoDoc: string;
  tipoCompra: string;
  rutProveedor: string;
  razonSocial: string;
  folio: string;
  fechaDocto: string;
  fechaRecepcion: string;
  fechaAcuse: string;
  montoExento: number;
  montoNeto: number;
  montoIVA: number;
  montoIVANoRecuperable: number;
  codigoIVANoRec: string;
  montoTotal: number;
  montoNetoActivoFijo: number;
  ivaActivoFijo: number;
  ivaUsoComun: number;
  imptoSinDerechoCredito: number;
  ivaNoRetenido: number;
  tabacosPuros: number;
  tabacosCigarrillos: number;
  tabacosElaborados: number;
  nceNdeFactura: number;
  codigoOtroImpuesto: string;
  valorOtroImpuesto: number;
  tasaOtroImpuesto: number;
}

export interface ProveedorSummary {
  rutProveedor: string;
  razonSocial: string;
  totalTransacciones: number;
  montoExentoTotal: number;
  montoNetoTotal: number;
  montoTotalSum: number;
  porcentajeDelTotal: number;
}

export interface RCVAnalysis {
  totalTransacciones: number;
  montoExentoGlobal: number;
  montoNetoGlobal: number;
  montoTotalGlobal: number;
  proveedoresPrincipales: ProveedorSummary[];
  transacciones: RCVRow[];
  periodoInicio: string;
  periodoFin: string;
  confidence: number;
  method: string;
}

// Función principal para procesar archivo RCV
export async function parseRCV(file: File): Promise<RCVAnalysis> {
  console.log('🎯 RCV Parser: Iniciando análisis de archivo RCV...');
  console.log(`📄 Archivo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
  
  try {
    // Leer contenido del archivo CSV
    const csvContent = await file.text();
    console.log('✅ Archivo CSV leído exitosamente');
    
    // Procesar CSV línea por línea
    const analysis = processCSVContent(csvContent);
    
    console.log('✅ Análisis RCV completado exitosamente');
    console.log(`📊 Total transacciones: ${analysis.totalTransacciones}`);
    console.log(`💰 Monto total global: ${analysis.montoTotalGlobal.toLocaleString()}`);
    console.log(`🏢 Proveedores únicos: ${analysis.proveedoresPrincipales.length}`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error en análisis RCV:', error);
    throw error;
  }
}

// Procesar contenido CSV y generar análisis
function processCSVContent(csvContent: string): RCVAnalysis {
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    throw new Error('Archivo CSV inválido o vacío');
  }
  
  // Saltar header (primera línea)
  const dataLines = lines.slice(1).filter(line => line.trim().length > 0);
  
  const transacciones: RCVRow[] = [];
  const proveedoresMap = new Map<string, ProveedorSummary>();
  
  let montoExentoGlobal = 0;
  let montoNetoGlobal = 0;
  let montoTotalGlobal = 0;
  
  let fechaMinima = '';
  let fechaMaxima = '';
  
  console.log(`📋 Procesando ${dataLines.length} transacciones...`);
  
  for (const line of dataLines) {
    try {
      const row = parseCSVRow(line);
      
      // Solo procesar filas con datos válidos
      if (!row.razonSocial || row.razonSocial.trim() === '') {
        continue;
      }
      
      transacciones.push(row);
      
      // Sumar totales globales
      montoExentoGlobal += row.montoExento;
      montoNetoGlobal += row.montoNeto;
      montoTotalGlobal += row.montoTotal;
      
      // Trackear fechas para período
      if (!fechaMinima || row.fechaDocto < fechaMinima) {
        fechaMinima = row.fechaDocto;
      }
      if (!fechaMaxima || row.fechaDocto > fechaMaxima) {
        fechaMaxima = row.fechaDocto;
      }
      
      // Agregar/actualizar proveedor
      const rutKey = row.rutProveedor;
      if (proveedoresMap.has(rutKey)) {
        const proveedor = proveedoresMap.get(rutKey)!;
        proveedor.totalTransacciones++;
        proveedor.montoExentoTotal += row.montoExento;
        proveedor.montoNetoTotal += row.montoNeto;
        proveedor.montoTotalSum += row.montoTotal;
      } else {
        proveedoresMap.set(rutKey, {
          rutProveedor: row.rutProveedor,
          razonSocial: row.razonSocial,
          totalTransacciones: 1,
          montoExentoTotal: row.montoExento,
          montoNetoTotal: row.montoNeto,
          montoTotalSum: row.montoTotal,
          porcentajeDelTotal: 0 // Se calculará después
        });
      }
      
    } catch (error) {
      console.warn('⚠️ Error procesando línea CSV:', line.substring(0, 50) + '...');
      continue;
    }
  }
  
  // Convertir mapa a array y calcular porcentajes
  const proveedoresPrincipales = Array.from(proveedoresMap.values())
    .map(proveedor => ({
      ...proveedor,
      porcentajeDelTotal: montoTotalGlobal > 0 
        ? (proveedor.montoTotalSum / montoTotalGlobal) * 100 
        : 0
    }))
    .sort((a, b) => b.montoTotalSum - a.montoTotalSum); // Ordenar por monto total descendente
  
  console.log(`🏆 Top 5 proveedores:`);
  proveedoresPrincipales.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.razonSocial}: $${p.montoTotalSum.toLocaleString()} (${p.porcentajeDelTotal.toFixed(1)}%)`);
  });
  
  return {
    totalTransacciones: transacciones.length,
    montoExentoGlobal,
    montoNetoGlobal,
    montoTotalGlobal,
    proveedoresPrincipales,
    transacciones,
    periodoInicio: fechaMinima,
    periodoFin: fechaMaxima,
    confidence: 95, // Alta confianza en parsing CSV
    method: 'csv-direct-parsing'
  };
}

// Parsear una línea CSV individual
function parseCSVRow(line: string): RCVRow {
  // Split por punto y coma, manejando campos vacíos
  const fields = line.split(';').map(field => field.trim());
  
  // Función helper para convertir a número
  const toNumber = (value: string): number => {
    if (!value || value === '') return 0;
    // Remover comas y convertir
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };
  
  // Mapear campos según estructura RCV del SII
  return {
    nro: fields[0] || '',
    tipoDoc: fields[1] || '',
    tipoCompra: fields[2] || '',
    rutProveedor: fields[3] || '',
    razonSocial: fields[4] || '',
    folio: fields[5] || '',
    fechaDocto: fields[6] || '',
    fechaRecepcion: fields[7] || '',
    fechaAcuse: fields[8] || '',
    montoExento: toNumber(fields[9]),        // Columna J
    montoNeto: toNumber(fields[10]),         // Columna K
    montoIVA: toNumber(fields[11]),
    montoIVANoRecuperable: toNumber(fields[12]),
    codigoIVANoRec: fields[13] || '',
    montoTotal: toNumber(fields[14]),
    montoNetoActivoFijo: toNumber(fields[15]),
    ivaActivoFijo: toNumber(fields[16]),
    ivaUsoComun: toNumber(fields[17]),
    imptoSinDerechoCredito: toNumber(fields[18]),
    ivaNoRetenido: toNumber(fields[19]),
    tabacosPuros: toNumber(fields[20]),
    tabacosCigarrillos: toNumber(fields[21]),
    tabacosElaborados: toNumber(fields[22]),
    nceNdeFactura: toNumber(fields[23]),
    codigoOtroImpuesto: fields[24] || '',
    valorOtroImpuesto: toNumber(fields[25]),
    tasaOtroImpuesto: toNumber(fields[26])
  };
}

// Función para obtener top N proveedores
export function getTopProveedores(analysis: RCVAnalysis, limit: number = 10): ProveedorSummary[] {
  return analysis.proveedoresPrincipales.slice(0, limit);
}

// Función para filtrar transacciones por proveedor
export function getTransaccionesByProveedor(analysis: RCVAnalysis, rutProveedor: string): RCVRow[] {
  return analysis.transacciones.filter(t => t.rutProveedor === rutProveedor);
}

// Función para estadísticas generales
export function getEstadisticasRCV(analysis: RCVAnalysis) {
  const avgTransaccionMonto = analysis.totalTransacciones > 0 
    ? analysis.montoTotalGlobal / analysis.totalTransacciones 
    : 0;
  
  const proveedorTop = analysis.proveedoresPrincipales[0];
  
  return {
    avgTransaccionMonto,
    totalProveedores: analysis.proveedoresPrincipales.length,
    concentracionTop5: analysis.proveedoresPrincipales
      .slice(0, 5)
      .reduce((sum, p) => sum + p.porcentajeDelTotal, 0),
    proveedorPrincipal: proveedorTop
  };
}