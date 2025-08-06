import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/database/databaseSimple';

// GET - Exportar libro diario a CSV/Excel
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('company_id') || 'demo-company';
    const format = searchParams.get('format') || 'csv'; // csv, excel
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const entry_type = searchParams.get('entry_type');
    const status = searchParams.get('status');
    const include_details = searchParams.get('include_details') !== 'false'; // default true

    console.log('📄 Exportando libro diario:', {
      company_id, format, date_from, date_to, entry_type, status, include_details
    });

    const supabase = getDatabaseConnection();

    // Construir query para obtener asientos con líneas
    let query = supabase
      .from('journal_entries')
      .select(`
        id,
        entry_number,
        entry_date,
        description,
        reference,
        entry_type,
        source_type,
        source_period,
        status,
        total_debit,
        total_credit,
        created_at,
        journal_entry_lines (
          id,
          account_code,
          account_name,
          line_number,
          debit_amount,
          credit_amount,
          line_description,
          reference,
          cost_center,
          analytical_account
        )
      `)
      .eq('company_id', company_id);

    // Aplicar filtros
    if (date_from) {
      query = query.gte('entry_date', date_from);
    }
    if (date_to) {
      query = query.lte('entry_date', date_to);
    }
    if (entry_type) {
      query = query.eq('entry_type', entry_type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Ordenar por fecha y número
    query = query
      .order('entry_date', { ascending: true })
      .order('entry_number', { ascending: true });

    const { data: entries, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo asientos para exportar:', error);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo datos del libro diario'
      }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron asientos para exportar con los filtros aplicados'
      }, { status: 404 });
    }

    console.log(`📋 Exportando ${entries.length} asientos`);

    // Preparar datos para CSV
    let csvContent = '';
    let fileName = '';

    if (include_details) {
      // Exportación detallada (una línea por cada línea de asiento)
      const headers = [
        'Fecha',
        'Número Asiento',
        'Descripción Asiento',
        'Referencia Asiento',
        'Tipo',
        'Origen',
        'Período',
        'Estado',
        'Línea',
        'Código Cuenta',
        'Nombre Cuenta',
        'Descripción Línea',
        'Referencia Línea',
        'Centro Costo',
        'Cuenta Analítica',
        'Debe',
        'Haber',
        'Total Debe Asiento',
        'Total Haber Asiento'
      ];

      csvContent = headers.join(';') + '\n';

      entries.forEach(entry => {
        const lines = entry.journal_entry_lines || [];
        
        if (lines.length === 0) {
          // Asiento sin líneas (caso anómalo)
          const row = [
            entry.entry_date,
            entry.entry_number,
            `"${entry.description}"`,
            entry.reference || '',
            entry.entry_type,
            entry.source_type || '',
            entry.source_period || '',
            entry.status,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '0',
            '0',
            entry.total_debit,
            entry.total_credit
          ];
          csvContent += row.join(';') + '\n';
        } else {
          // Una fila por cada línea del asiento
          lines
            .sort((a, b) => a.line_number - b.line_number)
            .forEach(line => {
              const row = [
                entry.entry_date,
                entry.entry_number,
                `"${entry.description}"`,
                entry.reference || '',
                entry.entry_type,
                entry.source_type || '',
                entry.source_period || '',
                entry.status,
                line.line_number,
                line.account_code,
                `"${line.account_name}"`,
                `"${line.line_description || ''}"`,
                line.reference || '',
                line.cost_center || '',
                line.analytical_account || '',
                line.debit_amount || 0,
                line.credit_amount || 0,
                entry.total_debit,
                entry.total_credit
              ];
              csvContent += row.join(';') + '\n';
            });
        }
      });

      fileName = `libro_diario_detallado_${date_from || 'todas'}${date_to ? `_${date_to}` : ''}.csv`;
      
    } else {
      // Exportación resumida (una línea por asiento)
      const headers = [
        'Fecha',
        'Número',
        'Descripción',
        'Referencia',
        'Tipo',
        'Origen',
        'Período',
        'Estado',
        'Total Debe',
        'Total Haber',
        'Líneas',
        'Creado'
      ];

      csvContent = headers.join(';') + '\n';

      entries.forEach(entry => {
        const row = [
          entry.entry_date,
          entry.entry_number,
          `"${entry.description}"`,
          entry.reference || '',
          entry.entry_type,
          entry.source_type || '',
          entry.source_period || '',
          entry.status,
          entry.total_debit,
          entry.total_credit,
          (entry.journal_entry_lines || []).length,
          new Date(entry.created_at).toLocaleDateString('es-CL')
        ];
        csvContent += row.join(';') + '\n';
      });

      fileName = `libro_diario_resumen_${date_from || 'todas'}${date_to ? `_${date_to}` : ''}.csv`;
    }

    // Estadísticas de exportación
    const totalLines = entries.reduce((sum, entry) => sum + (entry.journal_entry_lines?.length || 0), 0);
    const totalDebit = entries.reduce((sum, entry) => sum + entry.total_debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.total_credit, 0);
    const statusCounts = entries.reduce((counts: any, entry) => {
      counts[entry.status] = (counts[entry.status] || 0) + 1;
      return counts;
    }, {});
    const typeCounts = entries.reduce((counts: any, entry) => {
      counts[entry.entry_type] = (counts[entry.entry_type] || 0) + 1;
      return counts;
    }, {});

    // Agregar resumen al final del CSV
    csvContent += '\n';
    csvContent += 'RESUMEN DE EXPORTACIÓN\n';
    csvContent += `Total Asientos;${entries.length}\n`;
    csvContent += `Total Líneas;${totalLines}\n`;
    csvContent += `Total Debe;${totalDebit}\n`;
    csvContent += `Total Haber;${totalCredit}\n`;
    csvContent += `Fecha Exportación;"${new Date().toLocaleString('es-CL')}"\n`;
    csvContent += '\n';
    csvContent += 'POR ESTADO\n';
    Object.entries(statusCounts).forEach(([status, count]) => {
      csvContent += `${status};${count}\n`;
    });
    csvContent += '\n';
    csvContent += 'POR TIPO\n';
    Object.entries(typeCounts).forEach(([type, count]) => {
      csvContent += `${type};${count}\n`;
    });

    console.log(`✅ Libro diario exportado: ${entries.length} asientos, ${totalLines} líneas`);

    // Retornar CSV con headers apropiados
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString()
      }
    });

  } catch (error) {
    console.error('❌ Error exportando libro diario:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Exportar con configuración avanzada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id = 'demo-company',
      format = 'csv',
      filters = {},
      columns = null, // Array de columnas específicas a incluir
      group_by = null, // 'account', 'period', 'type'
      include_summary = true
    } = body;

    console.log('📄 Exportación avanzada libro diario:', { format, filters, group_by });

    const supabase = getDatabaseConnection();

    // Construir query base
    let query = supabase
      .from('journal_entries')
      .select(`
        *,
        journal_entry_lines (*)
      `)
      .eq('company_id', company_id);

    // Aplicar filtros dinámicos
    if (filters.date_from) query = query.gte('entry_date', filters.date_from);
    if (filters.date_to) query = query.lte('entry_date', filters.date_to);
    if (filters.entry_type) query = query.eq('entry_type', filters.entry_type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.source_type) query = query.eq('source_type', filters.source_type);

    const { data: entries, error } = await query;

    if (error) {
      console.error('❌ Error en exportación avanzada:', error);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo datos'
      }, { status: 500 });
    }

    // Procesamiento según agrupación
    let processedData = entries;
    let fileName = 'libro_diario_avanzado';

    if (group_by === 'account') {
      // Agrupar por cuenta contable
      const accountGroups: any = {};
      
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          const key = line.account_code;
          if (!accountGroups[key]) {
            accountGroups[key] = {
              account_code: line.account_code,
              account_name: line.account_name,
              total_debit: 0,
              total_credit: 0,
              entries_count: 0,
              lines: []
            };
          }
          accountGroups[key].total_debit += line.debit_amount || 0;
          accountGroups[key].total_credit += line.credit_amount || 0;
          accountGroups[key].entries_count += 1;
          accountGroups[key].lines.push({
            ...line,
            entry_date: entry.entry_date,
            entry_description: entry.description
          });
        });
      });

      processedData = Object.values(accountGroups);
      fileName = 'libro_diario_por_cuenta';
      
    } else if (group_by === 'period') {
      // Agrupar por período
      const periodGroups: any = {};
      
      entries?.forEach(entry => {
        const period = entry.source_period || entry.entry_date.substring(0, 7); // YYYY-MM
        if (!periodGroups[period]) {
          periodGroups[period] = {
            period,
            entries_count: 0,
            total_debit: 0,
            total_credit: 0,
            entries: []
          };
        }
        periodGroups[period].entries_count += 1;
        periodGroups[period].total_debit += entry.total_debit;
        periodGroups[period].total_credit += entry.total_credit;
        periodGroups[period].entries.push(entry);
      });

      processedData = Object.values(periodGroups);
      fileName = 'libro_diario_por_periodo';
    }

    // Generar CSV personalizado
    let csvContent = '';
    
    if (group_by === 'account') {
      csvContent = 'Código Cuenta;Nombre Cuenta;Total Debe;Total Haber;Saldo;Movimientos\n';
      processedData.forEach((account: any) => {
        const balance = account.total_debit - account.total_credit;
        csvContent += `${account.account_code};"${account.account_name}";${account.total_debit};${account.total_credit};${balance};${account.entries_count}\n`;
      });
    } else if (group_by === 'period') {
      csvContent = 'Período;Asientos;Total Debe;Total Haber\n';
      processedData.forEach((period: any) => {
        csvContent += `${period.period};${period.entries_count};${period.total_debit};${period.total_credit}\n`;
      });
    } else {
      // Exportación estándar con columnas personalizadas
      const defaultColumns = ['entry_date', 'entry_number', 'description', 'total_debit', 'total_credit'];
      const selectedColumns = columns || defaultColumns;
      
      csvContent = selectedColumns.join(';') + '\n';
      entries?.forEach(entry => {
        const row = selectedColumns.map(col => entry[col] || '');
        csvContent += row.join(';') + '\n';
      });
    }

    fileName += `.${format}`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      }
    });

  } catch (error) {
    console.error('❌ Error en exportación avanzada:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}