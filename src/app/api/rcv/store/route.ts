import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RCVStoreRequest {
  company_id: string;
  rcv_data: {
    totalTransacciones: number;
    transaccionesSuma: number;
    transaccionesResta: number;
    montoExentoGlobal: number;
    montoNetoGlobal: number;
    montoCalculadoGlobal: number;
    proveedoresPrincipales: any[];
    transacciones: any[];
    periodoInicio: string;
    periodoFin: string;
    confidence: number;
    method: string;
  };
  file_metadata: {
    file_name: string;
    file_size: number;
  };
  rcv_type: 'purchase' | 'sales';
}

/**
 * POST /api/rcv/store
 * Almacena datos del RCV procesado en la base de datos
 */
export async function POST(request: NextRequest) {
  try {
    const body: RCVStoreRequest = await request.json();
    
    console.log('🔍 RCV STORE - Datos recibidos:', {
      company_id: body.company_id,
      rcv_type: body.rcv_type,
      transacciones: body.rcv_data.totalTransacciones,
      file_name: body.file_metadata.file_name
    });

    const { company_id, rcv_data, file_metadata, rcv_type } = body;

    if (!company_id || !rcv_data || !file_metadata || !rcv_type) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Determinar período basado en las fechas
    const periodIdentifier = extractPeriodFromDates(rcv_data.periodoInicio, rcv_data.periodoFin);
    const [periodStart, periodEnd] = getPeriodDates(rcv_data.periodoInicio, rcv_data.periodoFin);

    let ledgerId: string;
    
    if (rcv_type === 'purchase') {
      ledgerId = await storePurchaseData(
        company_id,
        rcv_data,
        file_metadata,
        periodIdentifier,
        periodStart,
        periodEnd
      );
    } else {
      ledgerId = await storeSalesData(
        company_id,
        rcv_data,
        file_metadata,
        periodIdentifier,
        periodStart,
        periodEnd
      );
    }

    console.log(`✅ RCV ${rcv_type} almacenado exitosamente - Ledger ID:`, ledgerId);

    return NextResponse.json({
      success: true,
      data: {
        ledger_id: ledgerId,
        period_identifier: periodIdentifier,
        rcv_type: rcv_type,
        total_transactions: rcv_data.totalTransacciones
      },
      message: `RCV de ${rcv_type === 'purchase' ? 'compras' : 'ventas'} almacenado exitosamente`
    });

  } catch (error) {
    console.error('❌ Error almacenando RCV:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Almacena datos de compras en purchase_ledger y purchase_document
 */
async function storePurchaseData(
  companyId: string,
  rcvData: any,
  fileMetadata: any,
  periodIdentifier: string,
  periodStart: string,
  periodEnd: string
): Promise<string> {
  
  // ✅ CREAR O ACTUALIZAR PURCHASE_LEDGER
  const { data: existingLedger } = await supabase
    .from('purchase_ledger')
    .select('id')
    .eq('company_id', companyId)
    .eq('period_identifier', periodIdentifier)
    .single();

  let ledgerId: string;

  if (existingLedger) {
    // Actualizar ledger existente
    const { data: updatedLedger, error: updateError } = await supabase
      .from('purchase_ledger')
      .update({
        total_transactions: rcvData.totalTransacciones,
        sum_transactions: rcvData.transaccionesSuma,
        subtract_transactions: rcvData.transaccionesResta,
        total_exempt_amount: rcvData.montoExentoGlobal,
        total_net_amount: rcvData.montoNetoGlobal,
        total_calculated_amount: rcvData.montoCalculadoGlobal,
        unique_suppliers: rcvData.proveedoresPrincipales.length,
        confidence_score: rcvData.confidence,
        processing_method: rcvData.method,
        file_name: fileMetadata.file_name,
        file_size: fileMetadata.file_size,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLedger.id)
      .select('id')
      .single();

    if (updateError) throw updateError;
    ledgerId = updatedLedger.id;

    // Eliminar documentos existentes para reemplazar
    await supabase
      .from('purchase_document')
      .delete()
      .eq('purchase_ledger_id', ledgerId);

  } else {
    // Crear nuevo ledger
    const { data: newLedger, error: createError } = await supabase
      .from('purchase_ledger')
      .insert({
        company_id: companyId,
        period_start: periodStart,
        period_end: periodEnd,
        period_identifier: periodIdentifier,
        total_transactions: rcvData.totalTransacciones,
        sum_transactions: rcvData.transaccionesSuma,
        subtract_transactions: rcvData.transaccionesResta,
        total_exempt_amount: rcvData.montoExentoGlobal,
        total_net_amount: rcvData.montoNetoGlobal,
        total_calculated_amount: rcvData.montoCalculadoGlobal,
        unique_suppliers: rcvData.proveedoresPrincipales.length,
        confidence_score: rcvData.confidence,
        processing_method: rcvData.method,
        file_name: fileMetadata.file_name,
        file_size: fileMetadata.file_size
      })
      .select('id')
      .single();

    if (createError) throw createError;
    ledgerId = newLedger.id;
  }

  // ✅ INSERTAR PURCHASE_DOCUMENTS
  const purchaseDocuments = rcvData.transacciones.map((transaction: any) => ({
    purchase_ledger_id: ledgerId,
    company_id: companyId,
    document_number: transaction.nro || '',
    document_type: transaction.tipoDoc || '',
    purchase_type: transaction.tipoCompra || '',
    folio: transaction.folio || '',
    document_date: parseDate(transaction.fechaDocto),
    reception_date: parseDate(transaction.fechaRecepcion),
    acknowledgment_date: parseDate(transaction.fechaAcuse),
    supplier_rut: transaction.rutProveedor || '',
    supplier_name: transaction.razonSocial || '',
    exempt_amount: transaction.montoExento || 0,
    net_amount: transaction.montoNeto || 0,
    iva_amount: transaction.montoIVA || 0,
    iva_non_recoverable: transaction.montoIVANoRecuperable || 0,
    iva_non_recoverable_code: transaction.codigoIVANoRec || '',
    total_amount: transaction.montoTotal || 0,
    net_amount_fixed_assets: transaction.montoNetoActivoFijo || 0,
    iva_fixed_assets: transaction.ivaActivoFijo || 0,
    iva_common_use: transaction.ivaUsoComun || 0,
    tax_no_credit_right: transaction.imptoSinDerechoCredito || 0,
    iva_not_withheld: transaction.ivaNoRetenido || 0,
    tobacco_cigars: transaction.tabacosPuros || 0,
    tobacco_cigarettes: transaction.tabacosCigarrillos || 0,
    tobacco_processed: transaction.tabacosElaborados || 0,
    nce_nde_invoice: transaction.nceNdeFactura || 0,
    other_tax_code: transaction.codigoOtroImpuesto || '',
    other_tax_value: transaction.valorOtroImpuesto || 0,
    other_tax_rate: transaction.tasaOtroImpuesto || 0
  }));

  const { error: documentsError } = await supabase
    .from('purchase_document')
    .insert(purchaseDocuments);

  if (documentsError) throw documentsError;

  console.log(`✅ Almacenados ${purchaseDocuments.length} documentos de compra`);
  
  return ledgerId;
}

/**
 * Almacena datos de ventas en sales_ledger y sale_document
 */
async function storeSalesData(
  companyId: string,
  rcvData: any,
  fileMetadata: any,
  periodIdentifier: string,
  periodStart: string,
  periodEnd: string
): Promise<string> {
  
  // ✅ CREAR O ACTUALIZAR SALES_LEDGER
  const { data: existingLedger } = await supabase
    .from('sales_ledger')
    .select('id')
    .eq('company_id', companyId)
    .eq('period_identifier', periodIdentifier)
    .single();

  let ledgerId: string;

  if (existingLedger) {
    // Actualizar ledger existente
    const { data: updatedLedger, error: updateError } = await supabase
      .from('sales_ledger')
      .update({
        total_transactions: rcvData.totalTransacciones,
        sum_transactions: rcvData.transaccionesSuma,
        subtract_transactions: rcvData.transaccionesResta,
        total_exempt_amount: rcvData.montoExentoGlobal,
        total_net_amount: rcvData.montoNetoGlobal,
        total_calculated_amount: rcvData.montoCalculadoGlobal,
        unique_customers: rcvData.proveedoresPrincipales.length, // En ventas serían clientes
        confidence_score: rcvData.confidence,
        processing_method: rcvData.method,
        file_name: fileMetadata.file_name,
        file_size: fileMetadata.file_size,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLedger.id)
      .select('id')
      .single();

    if (updateError) throw updateError;
    ledgerId = updatedLedger.id;

    // Eliminar documentos existentes para reemplazar
    await supabase
      .from('sale_document')
      .delete()
      .eq('sales_ledger_id', ledgerId);

  } else {
    // Crear nuevo ledger
    const { data: newLedger, error: createError } = await supabase
      .from('sales_ledger')
      .insert({
        company_id: companyId,
        period_start: periodStart,
        period_end: periodEnd,
        period_identifier: periodIdentifier,
        total_transactions: rcvData.totalTransacciones,
        sum_transactions: rcvData.transaccionesSuma,
        subtract_transactions: rcvData.transaccionesResta,
        total_exempt_amount: rcvData.montoExentoGlobal,
        total_net_amount: rcvData.montoNetoGlobal,
        total_calculated_amount: rcvData.montoCalculadoGlobal,
        unique_customers: rcvData.proveedoresPrincipales.length,
        confidence_score: rcvData.confidence,
        processing_method: rcvData.method,
        file_name: fileMetadata.file_name,
        file_size: fileMetadata.file_size
      })
      .select('id')
      .single();

    if (createError) throw createError;
    ledgerId = newLedger.id;
  }

  // ✅ INSERTAR SALE_DOCUMENTS
  const saleDocuments = rcvData.transacciones.map((transaction: any) => ({
    sales_ledger_id: ledgerId,
    company_id: companyId,
    document_number: transaction.nro || '',
    document_type: transaction.tipoDoc || '',
    sale_type: transaction.tipoCompra || '', // En ventas podría ser tipo venta
    folio: transaction.folio || '',
    document_date: parseDate(transaction.fechaDocto),
    reception_date: parseDate(transaction.fechaRecepcion),
    acknowledgment_date: parseDate(transaction.fechaAcuse),
    customer_rut: transaction.rutProveedor || '', // En ventas sería RUT del cliente
    customer_name: transaction.razonSocial || '', // En ventas sería nombre del cliente
    exempt_amount: transaction.montoExento || 0,
    net_amount: transaction.montoNeto || 0,
    iva_amount: transaction.montoIVA || 0,
    iva_non_recoverable: transaction.montoIVANoRecuperable || 0,
    iva_non_recoverable_code: transaction.codigoIVANoRec || '',
    total_amount: transaction.montoTotal || 0,
    net_amount_fixed_assets: transaction.montoNetoActivoFijo || 0,
    iva_fixed_assets: transaction.ivaActivoFijo || 0,
    iva_common_use: transaction.ivaUsoComun || 0,
    tax_no_credit_right: transaction.imptoSinDerechoCredito || 0,
    iva_not_withheld: transaction.ivaNoRetenido || 0,
    tobacco_cigars: transaction.tabacosPuros || 0,
    tobacco_cigarettes: transaction.tabacosCigarrillos || 0,
    tobacco_processed: transaction.tabacosElaborados || 0,
    nce_nde_invoice: transaction.nceNdeFactura || 0,
    other_tax_code: transaction.codigoOtroImpuesto || '',
    other_tax_value: transaction.valorOtroImpuesto || 0,
    other_tax_rate: transaction.tasaOtroImpuesto || 0
  }));

  const { error: documentsError } = await supabase
    .from('sale_document')
    .insert(saleDocuments);

  if (documentsError) throw documentsError;

  console.log(`✅ Almacenados ${saleDocuments.length} documentos de venta`);
  
  return ledgerId;
}

/**
 * Extrae el identificador del período (YYYY-MM) de las fechas
 */
function extractPeriodFromDates(fechaInicio: string, fechaFin: string): string {
  try {
    // Formato esperado: DD/MM/YYYY
    const [, , year] = fechaInicio.split('/');
    const [, month] = fechaInicio.split('/');
    return `${year}-${month.padStart(2, '0')}`;
  } catch {
    // Fallback al mes actual si hay error
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}

/**
 * Convierte fechas del RCV a fechas de período
 */
function getPeriodDates(fechaInicio: string, fechaFin: string): [string, string] {
  try {
    const parseRCVDate = (dateStr: string): string => {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    return [parseRCVDate(fechaInicio), parseRCVDate(fechaFin)];
  } catch {
    // Fallback a primer y último día del mes actual
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    return [firstDay, lastDay];
  }
}

/**
 * Convierte fecha del RCV (DD/MM/YYYY) a formato ISO (YYYY-MM-DD)
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch {
    return null;
  }
}