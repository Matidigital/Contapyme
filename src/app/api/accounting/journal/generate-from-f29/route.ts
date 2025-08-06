import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/database/databaseSimple';

// POST - Generar asientos automáticos desde análisis F29
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { f29_id, entry_date, auto_approve = false } = body;

    if (!f29_id) {
      return NextResponse.json({
        success: false,
        error: 'f29_id es requerido'
      }, { status: 400 });
    }

    console.log('🤖 Generando asientos automáticos desde F29:', f29_id);

    const supabase = getDatabaseConnection();

    // Obtener datos del F29
    const { data: f29Data, error: f29Error } = await supabase
      .from('f29_forms')
      .select('*')
      .eq('id', f29_id)
      .single();

    if (f29Error || !f29Data) {
      console.error('❌ F29 no encontrado:', f29Error);
      return NextResponse.json({
        success: false,
        error: 'F29 no encontrado'
      }, { status: 404 });
    }

    // Verificar si ya existen asientos para este F29
    const { data: existingEntries, error: checkError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('source_id', f29_id)
      .eq('source_type', 'f29_analysis');

    if (checkError) {
      console.error('❌ Error verificando asientos existentes:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Error verificando asientos existentes'
      }, { status: 500 });
    }

    if (existingEntries && existingEntries.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Ya existen asientos contables para este F29'
      }, { status: 409 });
    }

    const company_id = f29Data.company_id || 'demo-company';
    const period = f29Data.period;
    const final_entry_date = entry_date || new Date().toISOString().split('T')[0];
    const generatedEntries = [];

    // ==========================================
    // 1. ASIENTO DE VENTAS E IVA DÉBITO FISCAL
    // ==========================================
    if (f29Data.ventas_netas > 0 || f29Data.iva_debito > 0) {
      const ventasLines = [];
      let lineNumber = 1;

      // IVA Débito Fiscal (DEBE)
      if (f29Data.iva_debito > 0) {
        ventasLines.push({
          journal_entry_id: '', // Se asignará después
          account_code: '11070001',
          account_name: 'IVA Débito Fiscal',
          line_number: lineNumber++,
          debit_amount: f29Data.iva_debito,
          credit_amount: 0,
          line_description: `IVA débito período ${period}`,
          reference: `F29-${period}`
        });
      }

      // Ventas Netas (HABER)
      if (f29Data.ventas_netas > 0) {
        ventasLines.push({
          journal_entry_id: '',
          account_code: '41010001',
          account_name: 'Ingresos por Ventas',
          line_number: lineNumber++,
          debit_amount: 0,
          credit_amount: f29Data.ventas_netas,
          line_description: `Ventas netas período ${period}`,
          reference: `F29-${period}`
        });
      }

      if (ventasLines.length > 0) {
        // Crear asiento de ventas
        const { data: ventasEntry, error: ventasError } = await supabase
          .from('journal_entries')
          .insert({
            company_id,
            entry_date: final_entry_date,
            description: `Registro ventas e IVA débito período ${period} según F29`,
            reference: `F29-VTA-${period}`,
            entry_type: 'f29',
            source_type: 'f29_analysis',
            source_id: f29_id,
            source_period: period,
            status: auto_approve ? 'approved' : 'draft',
            total_debit: ventasLines.reduce((sum, line) => sum + line.debit_amount, 0),
            total_credit: ventasLines.reduce((sum, line) => sum + line.credit_amount, 0),
            created_by: 'system'
          })
          .select()
          .single();

        if (ventasError) {
          console.error('❌ Error creando asiento de ventas:', ventasError);
          return NextResponse.json({
            success: false,
            error: 'Error creando asiento de ventas'
          }, { status: 500 });
        }

        // Insertar líneas del asiento de ventas
        const ventasLinesWithId = ventasLines.map(line => ({
          ...line,
          journal_entry_id: ventasEntry.id
        }));

        const { error: ventasLinesError } = await supabase
          .from('journal_entry_lines')
          .insert(ventasLinesWithId);

        if (ventasLinesError) {
          console.error('❌ Error creando líneas de ventas:', ventasLinesError);
          // Rollback
          await supabase.from('journal_entries').delete().eq('id', ventasEntry.id);
          return NextResponse.json({
            success: false,
            error: 'Error creando líneas del asiento de ventas'
          }, { status: 500 });
        }

        generatedEntries.push({
          ...ventasEntry,
          lines: ventasLinesWithId
        });

        console.log('✅ Asiento de ventas creado:', ventasEntry.id);
      }
    }

    // ==========================================
    // 2. ASIENTO DE IVA CRÉDITO FISCAL
    // ==========================================
    if (f29Data.iva_credito > 0) {
      const creditoLines = [
        {
          journal_entry_id: '',
          account_code: '11070002',
          account_name: 'IVA Crédito Fiscal',
          line_number: 1,
          debit_amount: f29Data.iva_credito,
          credit_amount: 0,
          line_description: `IVA crédito fiscal período ${period}`,
          reference: `F29-${period}`
        },
        {
          journal_entry_id: '',
          account_code: '21010001',
          account_name: 'Proveedores',
          line_number: 2,
          debit_amount: 0,
          credit_amount: f29Data.iva_credito,
          line_description: `Proveedores período ${period} (estimado)`,
          reference: `F29-${period}`
        }
      ];

      // Crear asiento de IVA crédito
      const { data: creditoEntry, error: creditoError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          entry_date: final_entry_date,
          description: `Registro IVA crédito fiscal período ${period} según F29`,
          reference: `F29-CRE-${period}`,
          entry_type: 'f29',
          source_type: 'f29_analysis',
          source_id: f29_id,
          source_period: period,
          status: auto_approve ? 'approved' : 'draft',
          total_debit: f29Data.iva_credito,
          total_credit: f29Data.iva_credito,
          created_by: 'system'
        })
        .select()
        .single();

      if (creditoError) {
        console.error('❌ Error creando asiento de crédito:', creditoError);
        return NextResponse.json({
          success: false,
          error: 'Error creando asiento de IVA crédito'
        }, { status: 500 });
      }

      // Insertar líneas del asiento de crédito
      const creditoLinesWithId = creditoLines.map(line => ({
        ...line,
        journal_entry_id: creditoEntry.id
      }));

      const { error: creditoLinesError } = await supabase
        .from('journal_entry_lines')
        .insert(creditoLinesWithId);

      if (creditoLinesError) {
        console.error('❌ Error creando líneas de crédito:', creditoLinesError);
        // Rollback
        await supabase.from('journal_entries').delete().eq('id', creditoEntry.id);
        return NextResponse.json({
          success: false,
          error: 'Error creando líneas del asiento de IVA crédito'
        }, { status: 500 });
      }

      generatedEntries.push({
        ...creditoEntry,
        lines: creditoLinesWithId
      });

      console.log('✅ Asiento de IVA crédito creado:', creditoEntry.id);
    }

    // ==========================================
    // 3. ASIENTO DE PPM (si existe)
    // ==========================================
    if (f29Data.ppm > 0) {
      const ppmLines = [
        {
          journal_entry_id: '',
          account_code: '61020001',
          account_name: 'Impuestos PPM',
          line_number: 1,
          debit_amount: f29Data.ppm,
          credit_amount: 0,
          line_description: `PPM período ${period}`,
          reference: `F29-${period}`
        },
        {
          journal_entry_id: '',
          account_code: '21050002',
          account_name: 'PPM por Pagar',
          line_number: 2,
          debit_amount: 0,
          credit_amount: f29Data.ppm,
          line_description: `PPM por pagar período ${period}`,
          reference: `F29-${period}`
        }
      ];

      // Crear asiento de PPM
      const { data: ppmEntry, error: ppmError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          entry_date: final_entry_date,
          description: `Registro PPM período ${period} según F29`,
          reference: `F29-PPM-${period}`,
          entry_type: 'f29',
          source_type: 'f29_analysis',
          source_id: f29_id,
          source_period: period,
          status: auto_approve ? 'approved' : 'draft',
          total_debit: f29Data.ppm,
          total_credit: f29Data.ppm,
          created_by: 'system'
        })
        .select()
        .single();

      if (ppmError) {
        console.error('❌ Error creando asiento de PPM:', ppmError);
        return NextResponse.json({
          success: false,
          error: 'Error creando asiento de PPM'
        }, { status: 500 });
      }

      // Insertar líneas del asiento de PPM
      const ppmLinesWithId = ppmLines.map(line => ({
        ...line,
        journal_entry_id: ppmEntry.id
      }));

      const { error: ppmLinesError } = await supabase
        .from('journal_entry_lines')
        .insert(ppmLinesWithId);

      if (ppmLinesError) {
        console.error('❌ Error creando líneas de PPM:', ppmLinesError);
        // Rollback
        await supabase.from('journal_entries').delete().eq('id', ppmEntry.id);
        return NextResponse.json({
          success: false,
          error: 'Error creando líneas del asiento de PPM'
        }, { status: 500 });
      }

      generatedEntries.push({
        ...ppmEntry,
        lines: ppmLinesWithId
      });

      console.log('✅ Asiento de PPM creado:', ppmEntry.id);
    }

    // ==========================================
    // 4. ASIENTO DE CIERRE IVA (si procede)
    // ==========================================
    const ivaDeterminado = f29Data.iva_determinado;
    if (Math.abs(ivaDeterminado) > 0) {
      const cierreLines = [];

      if (ivaDeterminado > 0) {
        // IVA a pagar (débito > crédito)
        cierreLines.push(
          {
            journal_entry_id: '',
            account_code: '11070001',
            account_name: 'IVA Débito Fiscal',
            line_number: 1,
            debit_amount: 0,
            credit_amount: f29Data.iva_debito,
            line_description: `Cierre IVA débito período ${period}`,
            reference: `F29-${period}`
          },
          {
            journal_entry_id: '',
            account_code: '11070002',
            account_name: 'IVA Crédito Fiscal',
            line_number: 2,
            debit_amount: f29Data.iva_credito,
            credit_amount: 0,
            line_description: `Cierre IVA crédito período ${period}`,
            reference: `F29-${period}`
          },
          {
            journal_entry_id: '',
            account_code: '21050001',
            account_name: 'IVA por Pagar',
            line_number: 3,
            debit_amount: 0,
            credit_amount: ivaDeterminado,
            line_description: `IVA a pagar período ${period}`,
            reference: `F29-${period}`
          }
        );
      } else {
        // IVA a favor (crédito > débito)
        cierreLines.push(
          {
            journal_entry_id: '',
            account_code: '11070001',
            account_name: 'IVA Débito Fiscal',
            line_number: 1,
            debit_amount: 0,
            credit_amount: f29Data.iva_debito,
            line_description: `Cierre IVA débito período ${period}`,
            reference: `F29-${period}`
          },
          {
            journal_entry_id: '',
            account_code: '11070002',
            account_name: 'IVA Crédito Fiscal',
            line_number: 2,
            debit_amount: f29Data.iva_credito,
            credit_amount: 0,
            line_description: `Cierre IVA crédito período ${period}`,
            reference: `F29-${period}`
          },
          {
            journal_entry_id: '',
            account_code: '11070003',
            account_name: 'IVA a Favor',
            line_number: 3,
            debit_amount: Math.abs(ivaDeterminado),
            credit_amount: 0,
            line_description: `IVA a favor período ${period}`,
            reference: `F29-${period}`
          }
        );
      }

      // Crear asiento de cierre IVA
      const { data: cierreEntry, error: cierreError } = await supabase
        .from('journal_entries')
        .insert({
          company_id,
          entry_date: final_entry_date,
          description: `Cierre IVA período ${period} según F29 (${ivaDeterminado > 0 ? 'a pagar' : 'a favor'})`,
          reference: `F29-CIERRE-${period}`,
          entry_type: 'f29',
          source_type: 'f29_analysis',
          source_id: f29_id,
          source_period: period,
          status: auto_approve ? 'approved' : 'draft',
          total_debit: cierreLines.reduce((sum, line) => sum + line.debit_amount, 0),
          total_credit: cierreLines.reduce((sum, line) => sum + line.credit_amount, 0),
          created_by: 'system'
        })
        .select()
        .single();

      if (cierreError) {
        console.error('❌ Error creando asiento de cierre:', cierreError);
        return NextResponse.json({
          success: false,
          error: 'Error creando asiento de cierre IVA'
        }, { status: 500 });
      }

      // Insertar líneas del asiento de cierre
      const cierreLinesWithId = cierreLines.map(line => ({
        ...line,
        journal_entry_id: cierreEntry.id
      }));

      const { error: cierreLinesError } = await supabase
        .from('journal_entry_lines')
        .insert(cierreLinesWithId);

      if (cierreLinesError) {
        console.error('❌ Error creando líneas de cierre:', cierreLinesError);
        // Rollback
        await supabase.from('journal_entries').delete().eq('id', cierreEntry.id);
        return NextResponse.json({
          success: false,
          error: 'Error creando líneas del asiento de cierre'
        }, { status: 500 });
      }

      generatedEntries.push({
        ...cierreEntry,
        lines: cierreLinesWithId
      });

      console.log('✅ Asiento de cierre IVA creado:', cierreEntry.id);
    }

    // Resumen de generación
    const summary = {
      f29_period: period,
      f29_rut: f29Data.rut,
      entries_generated: generatedEntries.length,
      total_debit: generatedEntries.reduce((sum, entry) => sum + entry.total_debit, 0),
      total_credit: generatedEntries.reduce((sum, entry) => sum + entry.total_credit, 0),
      auto_approved: auto_approve,
      entry_ids: generatedEntries.map(entry => entry.id)
    };

    console.log('✅ Asientos generados exitosamente:', summary);

    return NextResponse.json({
      success: true,
      data: {
        entries: generatedEntries,
        summary
      },
      message: `${generatedEntries.length} asientos contables generados exitosamente desde F29`
    });

  } catch (error) {
    console.error('❌ Error generando asientos desde F29:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}