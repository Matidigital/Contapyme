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
 * Crea asiento contable automático basado en configuración centralizada
 */
async function createAutomaticJournalEntry(companyId: string, transaction: any) {
  try {
    console.log('🔄 Creating automatic journal entry using centralized config for:', transaction);

    // Preparar datos del asiento según el tipo de transacción usando configuración centralizada
    let journalData = null;

    if (transaction.type === 'rcv') {
      journalData = await createRCVJournalEntry(transaction, companyId);
    } else if (transaction.type === 'fixed_asset') {
      journalData = await createFixedAssetJournalEntry(transaction, companyId);
    }

    if (!journalData) {
      throw new Error('No se pudo preparar los datos del asiento contable');
    }

    // Crear el asiento contable usando la API de journal
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005';
    const response = await fetch(siteUrl + '/api/accounting/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(journalData),
    });

    const result = await response.json();

    if (result.success) {
      // Marcar la transacción como procesada en integration_log
      try {
        const referenceType = transaction.type === 'rcv' 
          ? (transaction.subtype === 'purchase' ? 'PURCHASE' : 'SALES')
          : 'ACTIVO_FIJO';

        // Insertar directamente en integration_log como fallback
        await supabase
          .from('integration_log')
          .insert({
            company_id: companyId,
            source_module: transaction.type,
            source_type: transaction.subtype || 'asset_acquisition',
            source_id: transaction.id,
            journal_entry_id: result.data.entry.id,
            status: 'processed',
            processing_type: 'manual',
            details: {
              processed_at: new Date().toISOString(),
              integration_type: 'automatic_centralized',
              transaction_data: transaction.data,
              account_config_used: true
            },
            processed_at: new Date().toISOString()
          })
          .single();

        console.log('✅ Transaction marked as processed successfully');
      } catch (logError) {
        console.warn('⚠️ Could not log transaction processing:', logError);
        // No fallar por error de logging
      }

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
 * Crea asiento contable para RCV (Compras o Ventas) con cuentas específicas por entidad
 */
async function createRCVJournalEntry(transaction: any, companyId: string) {
  const { subtype, data } = transaction;
  const isRCVSales = subtype === 'sales';
  
  console.log(`🏢 Creating RCV journal entry for ${subtype} with entity-specific accounts`);
  
  // Obtener RUTs de las entidades en el RCV para usar cuentas específicas
  const entityAccounts = await getEntitySpecificAccounts(companyId, data, subtype);
  
  // Obtener configuración centralizada como fallback
  const accountConfig = await getCentralizedAccountConfig(companyId, 'rcv', subtype);
  
  if (!accountConfig) {
    throw new Error(`No se encontró configuración para RCV ${subtype}`);
  }

  const totalAmount = data.total_amount || 0;
  const netAmount = Math.round(totalAmount / 1.19); // Monto neto sin IVA
  const ivaAmount = totalAmount - netAmount; // IVA
  const lines = [];

  if (isRCVSales) {
    // RCV Ventas: Cliente al debe, Ventas e IVA al haber
    const clientAccount = entityAccounts.mainAccount || {
      code: accountConfig.asset_account_code,
      name: accountConfig.asset_account_name
    };
    
    lines.push({
      account_code: clientAccount.code,
      account_name: clientAccount.name,
      line_number: 1,
      debit_amount: totalAmount,
      credit_amount: 0,
      line_description: `${clientAccount.name} por ventas RCV ${data.period}${entityAccounts.entityCount > 0 ? ` (${entityAccounts.entityCount} entidades específicas)` : ''}`
    });

    lines.push({
      account_code: accountConfig.revenue_account_code,
      account_name: accountConfig.revenue_account_name,
      line_number: 2,
      debit_amount: 0,
      credit_amount: netAmount,
      line_description: `${accountConfig.revenue_account_name} RCV ${data.period}`
    });

    lines.push({
      account_code: accountConfig.tax_account_code,
      account_name: accountConfig.tax_account_name,
      line_number: 3,
      debit_amount: 0,
      credit_amount: ivaAmount,
      line_description: `${accountConfig.tax_account_name} RCV ${data.period}`
    });
  } else {
    // RCV Compras: Gastos e IVA al debe, Proveedores al haber
    const supplierAccount = entityAccounts.mainAccount || {
      code: accountConfig.asset_account_code,
      name: accountConfig.asset_account_name
    };
    
    lines.push({
      account_code: accountConfig.revenue_account_code,
      account_name: accountConfig.revenue_account_name,
      line_number: 1,
      debit_amount: netAmount,
      credit_amount: 0,
      line_description: `${accountConfig.revenue_account_name} por compras RCV ${data.period}`
    });

    lines.push({
      account_code: accountConfig.tax_account_code,
      account_name: accountConfig.tax_account_name,
      line_number: 2,
      debit_amount: ivaAmount,
      credit_amount: 0,
      line_description: `${accountConfig.tax_account_name} RCV ${data.period}`
    });

    lines.push({
      account_code: supplierAccount.code,
      account_name: supplierAccount.name,
      line_number: 3,
      debit_amount: 0,
      credit_amount: totalAmount,
      line_description: `${supplierAccount.name} por compras RCV ${data.period}${entityAccounts.entityCount > 0 ? ` (${entityAccounts.entityCount} entidades específicas)` : ''}`
    });
  }

  return {
    entry_date: new Date().toISOString().split('T')[0],
    description: `RCV ${isRCVSales ? 'Ventas' : 'Compras'} ${data.period} - ${data.file_name || ''}${entityAccounts.entityCount > 0 ? ` (${entityAccounts.entityCount} entidades con cuentas específicas)` : ''}`,
    reference: data.file_name || `RCV-${subtype}-${data.period}`,
    entry_type: 'rcv',
    lines
  };
}

/**
 * Crea asiento contable para Activos Fijos usando configuración centralizada
 */
async function createFixedAssetJournalEntry(transaction: any, companyId: string) {
  const { data } = transaction;
  
  // Obtener configuración centralizada
  const accountConfig = await getCentralizedAccountConfig(companyId, 'fixed_assets', 'acquisition');
  
  if (!accountConfig) {
    throw new Error('No se encontró configuración para Activos Fijos');
  }

  const purchaseValue = data.purchase_value || 0;

  const lines = [
    {
      account_code: data.account_code || accountConfig.asset_account_code,
      account_name: data.name || accountConfig.asset_account_name,
      line_number: 1,
      debit_amount: purchaseValue,
      credit_amount: 0,
      line_description: `Adquisición activo fijo: ${data.name}`
    },
    {
      account_code: accountConfig.revenue_account_code,
      account_name: accountConfig.revenue_account_name,
      line_number: 2,
      debit_amount: 0,
      credit_amount: purchaseValue,
      line_description: `Pago activo fijo: ${data.name}`
    }
  ];

  return {
    entry_date: data.purchase_date,
    description: `Adquisición Activo Fijo: ${data.name}`,
    reference: `AF-${data.id}`,
    entry_type: 'fixed_asset',
    lines
  };
}

/**
 * Obtiene configuración centralizada de cuentas para asientos automáticos
 */
async function getCentralizedAccountConfig(companyId: string, moduleType: string, transactionType: string) {
  try {
    // Por ahora usar configuración por defecto directamente
    // En el futuro se puede implementar configuración centralizada desde la base de datos
    console.log(`🔧 Using default account config for ${moduleType}/${transactionType}`);
    return getDefaultAccountConfig(moduleType, transactionType);

  } catch (error) {
    console.error('Error getting centralized config:', error);
    return getDefaultAccountConfig(moduleType, transactionType);
  }
}

/**
 * Obtiene configuración por defecto para asientos automáticos
 */
async function getDefaultAccountConfig(moduleType: string, transactionType: string) {
  const defaultConfigs = {
    rcv: {
      sales: {
        tax_account_code: '2104001',
        tax_account_name: 'IVA Débito Fiscal',
        revenue_account_code: '4101001',
        revenue_account_name: 'Ventas',
        asset_account_code: '1105001',
        asset_account_name: 'Clientes'
      },
      purchase: {
        tax_account_code: '1104001',
        tax_account_name: 'IVA Crédito Fiscal',
        revenue_account_code: '5101001',
        revenue_account_name: 'Gastos Generales',
        asset_account_code: '2101001',
        asset_account_name: 'Proveedores'
      }
    },
    fixed_assets: {
      acquisition: {
        tax_account_code: '1104001',
        tax_account_name: 'IVA Crédito Fiscal',
        revenue_account_code: '1101001',
        revenue_account_name: 'Caja y Bancos',
        asset_account_code: '1201001',
        asset_account_name: 'Activos Fijos'
      }
    }
  };

  return defaultConfigs[moduleType]?.[transactionType] || null;
}

/**
 * Obtiene cuentas específicas para entidades RCV basadas en los RUTs de las transacciones
 */
async function getEntitySpecificAccounts(companyId: string, rcvData: any, transactionType: string) {
  try {
    console.log(`🔍 Looking for entity-specific accounts for ${transactionType} RCV processing`);
    
    // Determinar el tipo de entidad que buscamos
    const entityType = transactionType === 'sales' ? 'customer' : 'supplier';
    
    // Intentar obtener RUTs de las transacciones RCV (esto dependería de la estructura de los datos)
    let entityRuts: string[] = [];
    
    if (rcvData.transactions && Array.isArray(rcvData.transactions)) {
      entityRuts = rcvData.transactions
        .map((t: any) => t.rut || t.entity_rut || t.supplier_rut || t.customer_rut)
        .filter((rut: string) => rut && rut.length > 0);
    }
    
    // Si no tenemos RUTs específicos, buscar entidades por tipo
    if (entityRuts.length === 0) {
      console.log(`📋 No specific RUTs found, searching for ${entityType} entities with accounts`);
      
      const { data: entities } = await supabase
        .from('rcv_entities')
        .select('account_code, account_name, entity_name')
        .eq('company_id', companyId)
        .in('entity_type', [entityType, 'both'])
        .not('account_code', 'is', null)
        .not('account_name', 'is', null)
        .limit(1);
      
      if (entities && entities.length > 0) {
        console.log(`✅ Found ${entities.length} ${entityType} entities with specific accounts`);
        return {
          mainAccount: {
            code: entities[0].account_code,
            name: entities[0].account_name
          },
          entityCount: entities.length,
          entities: entities
        };
      }
    } else {
      // Buscar cuentas específicas por RUT
      console.log(`🎯 Looking for specific accounts for ${entityRuts.length} RUTs`);
      
      const { data: entities } = await supabase
        .from('rcv_entities')
        .select('account_code, account_name, entity_name, entity_rut')
        .eq('company_id', companyId)
        .in('entity_rut', entityRuts)
        .not('account_code', 'is', null)
        .not('account_name', 'is', null);
      
      if (entities && entities.length > 0) {
        console.log(`✅ Found ${entities.length} entities with specific accounts for RUTs: ${entityRuts.join(', ')}`);
        
        // Si múltiples entidades, usar la primera como cuenta principal
        return {
          mainAccount: {
            code: entities[0].account_code,
            name: entities[0].account_name
          },
          entityCount: entities.length,
          entities: entities
        };
      }
    }
    
    console.log(`ℹ️ No entity-specific accounts found, will use default accounts`);
    return {
      mainAccount: null,
      entityCount: 0,
      entities: []
    };
    
  } catch (error) {
    console.error('❌ Error getting entity-specific accounts:', error);
    return {
      mainAccount: null,
      entityCount: 0,
      entities: []
    };
  }
}