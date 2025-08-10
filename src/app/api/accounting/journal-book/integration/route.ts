import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/accounting/journal-book/integration
 * Obtiene datos pendientes de contabilizar de otros módulos
 * Query params:
 * - company_id (required)
 * - module: 'rcv' | 'fixed_assets' | 'all' (default: 'all')
 * - status: 'pending' | 'processed' | 'all' (default: 'pending')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const module = searchParams.get('module') || 'all';
    const status = searchParams.get('status') || 'pending';

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 Integration GET - Company: ${companyId}, Module: ${module}, Status: ${status}`);

    const integrationData = {
      rcv_data: [],
      fixed_assets_data: [],
      summary: {
        rcv_pending: 0,
        rcv_processed: 0,
        fixed_assets_pending: 0,
        fixed_assets_processed: 0,
        total_pending: 0
      }
    };

    // ✅ OBTENER DATOS RCV
    if (module === 'all' || module === 'rcv') {
      const rcvData = await getRCVIntegrationData(companyId, status);
      integrationData.rcv_data = rcvData.data;
      integrationData.summary.rcv_pending = rcvData.pending;
      integrationData.summary.rcv_processed = rcvData.processed;
    }

    // ✅ OBTENER DATOS ACTIVOS FIJOS
    if (module === 'all' || module === 'fixed_assets') {
      const fixedAssetsData = await getFixedAssetsIntegrationData(companyId, status);
      integrationData.fixed_assets_data = fixedAssetsData.data;
      integrationData.summary.fixed_assets_pending = fixedAssetsData.pending;
      integrationData.summary.fixed_assets_processed = fixedAssetsData.processed;
    }

    integrationData.summary.total_pending = 
      integrationData.summary.rcv_pending + 
      integrationData.summary.fixed_assets_pending;

    return NextResponse.json({
      success: true,
      data: integrationData
    });

  } catch (error) {
    console.error('❌ Error obteniendo datos de integración:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounting/journal-book/integration
 * Marca transacciones como contabilizadas y crea asientos automáticos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_id, transactions, create_journal_entries = true } = body;

    if (!company_id || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    console.log(`🔄 Integration POST - Processing ${transactions.length} transactions`);

    const results = [];
    
    for (const transaction of transactions) {
      try {
        const result = await processIntegrationTransaction(
          company_id, 
          transaction, 
          create_journal_entries
        );
        results.push(result);
      } catch (error) {
        console.error(`❌ Error processing transaction ${transaction.id}:`, error);
        results.push({
          id: transaction.id,
          success: false,
          error: error instanceof Error ? error.message : 'Error procesando transacción'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error procesando integración:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Obtiene datos RCV pendientes/procesados de contabilizar
 */
async function getRCVIntegrationData(companyId: string, status: string) {
  const data = [];
  let pending = 0;
  let processed = 0;

  try {
    // Obtener purchase_ledgers
    const { data: purchaseLedgers } = await supabase
      .from('purchase_ledger')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Obtener sales_ledgers
    const { data: salesLedgers } = await supabase
      .from('sales_ledger')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Procesar ledgers de compras
    if (purchaseLedgers) {
      for (const ledger of purchaseLedgers) {
        const isProcessed = await isRCVProcessed(ledger.id, 'purchase');
        const ledgerData = {
          id: ledger.id,
          type: 'purchase',
          period: ledger.period_identifier,
          file_name: ledger.file_name,
          total_transactions: ledger.total_transactions,
          total_amount: ledger.total_calculated_amount,
          unique_suppliers: ledger.unique_suppliers,
          created_at: ledger.created_at,
          is_processed: isProcessed,
          journal_entry_id: isProcessed ? await getJournalEntryId(ledger.id, 'purchase') : null
        };

        if (status === 'all' || (status === 'pending' && !isProcessed) || (status === 'processed' && isProcessed)) {
          data.push(ledgerData);
        }

        if (isProcessed) {
          processed++;
        } else {
          pending++;
        }
      }
    }

    // Procesar ledgers de ventas
    if (salesLedgers) {
      for (const ledger of salesLedgers) {
        const isProcessed = await isRCVProcessed(ledger.id, 'sales');
        const ledgerData = {
          id: ledger.id,
          type: 'sales',
          period: ledger.period_identifier,
          file_name: ledger.file_name,
          total_transactions: ledger.total_transactions,
          total_amount: ledger.total_calculated_amount,
          unique_customers: ledger.unique_customers,
          created_at: ledger.created_at,
          is_processed: isProcessed,
          journal_entry_id: isProcessed ? await getJournalEntryId(ledger.id, 'sales') : null
        };

        if (status === 'all' || (status === 'pending' && !isProcessed) || (status === 'processed' && isProcessed)) {
          data.push(ledgerData);
        }

        if (isProcessed) {
          processed++;
        } else {
          pending++;
        }
      }
    }

  } catch (error) {
    console.error('Error obteniendo datos RCV:', error);
  }

  return { data, pending, processed };
}

/**
 * Obtiene datos de activos fijos pendientes/procesados de contabilizar
 */
async function getFixedAssetsIntegrationData(companyId: string, status: string) {
  const data = [];
  let pending = 0;
  let processed = 0;

  try {
    const { data: fixedAssets } = await supabase
      .from('fixed_assets')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('purchase_date', { ascending: false });

    if (fixedAssets) {
      for (const asset of fixedAssets) {
        const isProcessed = await isFixedAssetProcessed(asset.id);
        const assetData = {
          id: asset.id,
          type: 'fixed_asset',
          name: asset.name,
          brand: asset.brand,
          model: asset.model,
          purchase_date: asset.purchase_date,
          purchase_value: asset.purchase_value,
          account_code: asset.account_code,
          created_at: asset.created_at,
          is_processed: isProcessed,
          journal_entry_id: isProcessed ? await getJournalEntryId(asset.id, 'fixed_asset') : null
        };

        if (status === 'all' || (status === 'pending' && !isProcessed) || (status === 'processed' && isProcessed)) {
          data.push(assetData);
        }

        if (isProcessed) {
          processed++;
        } else {
          pending++;
        }
      }
    }

  } catch (error) {
    console.error('Error obteniendo datos de activos fijos:', error);
  }

  return { data, pending, processed };
}

/**
 * Verifica si un RCV ya fue procesado contablemente
 */
async function isRCVProcessed(ledgerId: string, type: 'purchase' | 'sales'): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('journal_book')
      .select('jbid')
      .eq('reference_type', type.toUpperCase())
      .eq('reference_id', ledgerId)
      .eq('status', 'active')
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Verifica si un activo fijo ya fue procesado contablemente
 */
async function isFixedAssetProcessed(assetId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('journal_book')
      .select('jbid')
      .eq('reference_type', 'ACTIVO_FIJO')
      .eq('reference_id', assetId)
      .eq('status', 'active')
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Obtiene el ID del asiento contable asociado
 */
async function getJournalEntryId(referenceId: string, type: string): Promise<string | null> {
  try {
    const referenceType = type === 'purchase' ? 'PURCHASE' : 
                          type === 'sales' ? 'SALES' : 'ACTIVO_FIJO';
    
    const { data } = await supabase
      .from('journal_book')
      .select('jbid')
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .eq('status', 'active')
      .single();

    return data?.jbid || null;
  } catch {
    return null;
  }
}

/**
 * Procesa una transacción de integración individual
 */
async function processIntegrationTransaction(
  companyId: string, 
  transaction: any, 
  createJournalEntries: boolean
) {
  const { id, type, action = 'process' } = transaction;

  if (action === 'process' && createJournalEntries) {
    // Crear asiento contable automático
    const journalEntry = await createAutomaticJournalEntry(companyId, transaction);
    
    return {
      id,
      success: true,
      journal_entry_id: journalEntry?.jbid || null,
      message: 'Asiento contable creado exitosamente'
    };
  } else {
    // Solo marcar como procesado sin crear asiento
    return {
      id,
      success: true,
      journal_entry_id: null,
      message: 'Transacción marcada como procesada'
    };
  }
}

/**
 * Crea asiento contable automático basado en configuración
 */
async function createAutomaticJournalEntry(companyId: string, transaction: any) {
  try {
    console.log('🔄 Creating automatic journal entry for:', transaction);

    // Obtener configuración de integración
    const { data: configData } = await supabase
      .from('integration_config')
      .select('config')
      .eq('company_id', companyId)
      .single();

    const config = configData?.config || await getDefaultIntegrationConfig();

    // Preparar datos del asiento según el tipo de transacción
    let journalData = null;

    if (transaction.type === 'rcv') {
      journalData = await createRCVJournalEntry(transaction, config);
    } else if (transaction.type === 'fixed_asset') {
      journalData = await createFixedAssetJournalEntry(transaction, config);
    }

    if (!journalData) {
      throw new Error('No se pudo preparar los datos del asiento contable');
    }

    // Crear el asiento contable usando la API de journal
    const response = await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/accounting/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(journalData),
    });

    const result = await response.json();

    if (result.success) {
      // Marcar la transacción como procesada en integration_log
      const referenceType = transaction.type === 'rcv' 
        ? (transaction.subtype === 'purchase' ? 'PURCHASE' : 'SALES')
        : 'ACTIVO_FIJO';

      await supabase.rpc('mark_transaction_processed', {
        p_company_id: companyId,
        p_source_module: transaction.type,
        p_source_type: transaction.subtype || 'asset_acquisition',
        p_source_id: transaction.id,
        p_journal_entry_id: result.data.entry.id,
        p_processing_type: 'manual',
        p_details: {
          processed_at: new Date().toISOString(),
          integration_type: 'automatic',
          transaction_data: transaction.data
        }
      });

      return result.data.entry;
    } else {
      throw new Error(result.error || 'Error creando asiento contable');
    }

  } catch (error) {
    console.error('❌ Error creando asiento automático:', error);
    throw error;
  }
}

/**
 * Crea asiento contable para RCV (Compras o Ventas)
 */
async function createRCVJournalEntry(transaction: any, config: any) {
  const { subtype, data } = transaction;
  const isRCVSales = subtype === 'sales';
  const configKey = isRCVSales ? 'rcv_sales' : 'rcv_purchases';
  
  if (!config[configKey] || !config[configKey].enabled) {
    throw new Error(`Integración ${configKey} no está habilitada`);
  }

  const accounts = config[configKey].accounts;
  const totalAmount = data.total_amount || 0;
  const netAmount = Math.round(totalAmount / 1.19); // Monto neto sin IVA
  const ivaAmount = totalAmount - netAmount; // IVA

  const lines = [];

  if (isRCVSales) {
    // RCV Ventas: Cliente al debe, Ventas e IVA al haber
    lines.push({
      account_code: accounts.debit_client_account,
      account_name: 'Clientes',
      line_number: 1,
      debit_amount: totalAmount,
      credit_amount: 0,
      line_description: `Clientes por ventas RCV ${data.period}`
    });

    lines.push({
      account_code: accounts.credit_sales_account,
      account_name: 'Ventas',
      line_number: 2,
      debit_amount: 0,
      credit_amount: netAmount,
      line_description: `Ventas RCV ${data.period}`
    });

    lines.push({
      account_code: accounts.credit_iva_account,
      account_name: 'IVA Débito Fiscal',
      line_number: 3,
      debit_amount: 0,
      credit_amount: ivaAmount,
      line_description: `IVA Ventas RCV ${data.period}`
    });
  } else {
    // RCV Compras: Gastos e IVA al debe, Proveedores al haber
    lines.push({
      account_code: accounts.debit_expense_account,
      account_name: 'Gastos Generales',
      line_number: 1,
      debit_amount: netAmount,
      credit_amount: 0,
      line_description: `Gastos por compras RCV ${data.period}`
    });

    lines.push({
      account_code: accounts.debit_iva_account,
      account_name: 'IVA Crédito Fiscal',
      line_number: 2,
      debit_amount: ivaAmount,
      credit_amount: 0,
      line_description: `IVA Compras RCV ${data.period}`
    });

    lines.push({
      account_code: accounts.credit_supplier_account,
      account_name: 'Proveedores',
      line_number: 3,
      debit_amount: 0,
      credit_amount: totalAmount,
      line_description: `Proveedores por compras RCV ${data.period}`
    });
  }

  return {
    entry_date: new Date().toISOString().split('T')[0],
    description: config[configKey].description_template
      .replace('{period}', data.period)
      .replace('{file_name}', data.file_name || ''),
    reference: data.file_name || `RCV-${subtype}-${data.period}`,
    entry_type: subtype.toLowerCase(),
    lines
  };
}

/**
 * Crea asiento contable para Activos Fijos
 */
async function createFixedAssetJournalEntry(transaction: any, config: any) {
  const { data } = transaction;
  
  if (!config.fixed_assets || !config.fixed_assets.enabled) {
    throw new Error('Integración fixed_assets no está habilitada');
  }

  const accounts = config.fixed_assets.accounts;
  const purchaseValue = data.purchase_value || 0;

  const lines = [
    {
      account_code: data.account_code,
      account_name: data.name,
      line_number: 1,
      debit_amount: purchaseValue,
      credit_amount: 0,
      line_description: `Adquisición activo fijo: ${data.name}`
    },
    {
      account_code: accounts.credit_cash_account,
      account_name: 'Caja/Bancos',
      line_number: 2,
      debit_amount: 0,
      credit_amount: purchaseValue,
      line_description: `Pago activo fijo: ${data.name}`
    }
  ];

  return {
    entry_date: data.purchase_date,
    description: config.fixed_assets.description_template
      .replace('{asset_name}', data.name),
    reference: `AF-${data.id}`,
    entry_type: 'fixed_asset',
    lines
  };
}

/**
 * Obtiene configuración por defecto para asientos automáticos
 */
async function getDefaultIntegrationConfig() {
  return {
    rcv_sales: {
      enabled: true,
      accounts: {
        debit_client_account: '1105001',
        credit_sales_account: '4101001',
        credit_iva_account: '2104001'
      },
      description_template: 'Venta según RCV {period} - {file_name}'
    },
    rcv_purchases: {
      enabled: true,
      accounts: {
        debit_expense_account: '5101001',
        debit_iva_account: '1104001',
        credit_supplier_account: '2101001'
      },
      description_template: 'Compra según RCV {period} - {file_name}'
    },
    fixed_assets: {
      enabled: true,
      accounts: {
        credit_cash_account: '1101001',
        credit_supplier_account: '2101001'
      },
      description_template: 'Adquisición Activo Fijo: {asset_name}'
    }
  };
}