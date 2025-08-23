import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id') || '8033ee69-b420-4d91-ba0e-482f46cd6fce';
    const period = searchParams.get('period') || '2025-08';
    
    const [year, month] = period.split('-');

    console.log('🔍 Comparando datos para:', { companyId, period, year, month });

    // 1. Obtener liquidaciones
    const { data: liquidations, error: liquidationsError } = await supabase
      .from('payroll_liquidations')
      .select(`
        id,
        employee_id,
        base_salary,
        total_gross_income,
        total_deductions,
        net_salary,
        afp_amount,
        health_amount,
        unemployment_amount,
        income_tax_amount,
        family_allowance,
        food_allowance,
        transport_allowance,
        employees (
          rut,
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .eq('period_year', parseInt(year))
      .eq('period_month', parseInt(month));

    // 2. Obtener libro de remuneraciones
    const { data: books } = await supabase
      .from('payroll_books')
      .select(`
        id,
        period,
        total_employees,
        total_haberes,
        total_descuentos,
        total_liquido,
        payroll_book_details (
          employee_rut,
          sueldo_base,
          total_haberes,
          total_descuentos,
          sueldo_liquido,
          prevision_afp,
          salud,
          cesantia,
          impuesto_unico,
          colacion,
          movilizacion,
          asignacion_familiar
        )
      `)
      .eq('company_id', companyId)
      .eq('period', period);

    if (liquidationsError) {
      return NextResponse.json({ error: 'Error obteniendo liquidaciones', details: liquidationsError }, { status: 500 });
    }

    const comparison = {
      period,
      liquidations: {
        count: liquidations?.length || 0,
        total_gross: liquidations?.reduce((sum, liq) => sum + (liq.total_gross_income || 0), 0) || 0,
        total_deductions: liquidations?.reduce((sum, liq) => sum + (liq.total_deductions || 0), 0) || 0,
        total_net: liquidations?.reduce((sum, liq) => sum + (liq.net_salary || 0), 0) || 0,
        details: liquidations?.map(liq => ({
          employee_rut: liq.employees?.rut,
          name: `${liq.employees?.first_name} ${liq.employees?.last_name}`,
          base_salary: liq.base_salary,
          total_gross_income: liq.total_gross_income,
          total_deductions: liq.total_deductions,
          net_salary: liq.net_salary,
          afp_amount: liq.afp_amount,
          health_amount: liq.health_amount,
          unemployment_amount: liq.unemployment_amount,
          income_tax_amount: liq.income_tax_amount
        })) || []
      },
      book: books && books.length > 0 ? {
        exists: true,
        count: books[0].total_employees,
        total_haberes: books[0].total_haberes,
        total_descuentos: books[0].total_descuentos,
        total_liquido: books[0].total_liquido,
        details: books[0].payroll_book_details?.map((detail: any) => ({
          employee_rut: detail.employee_rut,
          sueldo_base: detail.sueldo_base,
          total_haberes: detail.total_haberes,
          total_descuentos: detail.total_descuentos,
          sueldo_liquido: detail.sueldo_liquido,
          prevision_afp: detail.prevision_afp,
          salud: detail.salud,
          cesantia: detail.cesantia,
          impuesto_unico: detail.impuesto_unico
        })) || []
      } : {
        exists: false,
        message: 'No hay libro generado para este período'
      },
      differences: []
    };

    // 3. Comparar diferencias si existe el libro
    if (comparison.book.exists && liquidations && books && books[0]) {
      const bookDetails = books[0].payroll_book_details;
      const differences: any[] = [];

      liquidations.forEach(liq => {
        const bookDetail = bookDetails?.find((bd: any) => bd.employee_rut === liq.employees?.rut);
        
        if (bookDetail) {
          const diff: any = {
            employee_rut: liq.employees?.rut,
            name: `${liq.employees?.first_name} ${liq.employees?.last_name}`,
            liquidation: {
              base_salary: liq.base_salary,
              total_gross: liq.total_gross_income,
              total_deductions: liq.total_deductions,
              net_salary: liq.net_salary
            },
            book: {
              sueldo_base: bookDetail.sueldo_base,
              total_haberes: bookDetail.total_haberes,
              total_descuentos: bookDetail.total_descuentos,
              sueldo_liquido: bookDetail.sueldo_liquido
            },
            differences: {}
          };

          // Calcular diferencias
          if (Math.abs((liq.base_salary || 0) - (bookDetail.sueldo_base || 0)) > 1) {
            diff.differences.base_salary = {
              liquidation: liq.base_salary,
              book: bookDetail.sueldo_base,
              diff: (liq.base_salary || 0) - (bookDetail.sueldo_base || 0)
            };
          }

          if (Math.abs((liq.total_gross_income || 0) - (bookDetail.total_haberes || 0)) > 1) {
            diff.differences.total_gross = {
              liquidation: liq.total_gross_income,
              book: bookDetail.total_haberes,
              diff: (liq.total_gross_income || 0) - (bookDetail.total_haberes || 0)
            };
          }

          if (Math.abs((liq.total_deductions || 0) - (bookDetail.total_descuentos || 0)) > 1) {
            diff.differences.total_deductions = {
              liquidation: liq.total_deductions,
              book: bookDetail.total_descuentos,
              diff: (liq.total_deductions || 0) - (bookDetail.total_descuentos || 0)
            };
          }

          if (Math.abs((liq.net_salary || 0) - (bookDetail.sueldo_liquido || 0)) > 1) {
            diff.differences.net_salary = {
              liquidation: liq.net_salary,
              book: bookDetail.sueldo_liquido,
              diff: (liq.net_salary || 0) - (bookDetail.sueldo_liquido || 0)
            };
          }

          if (Object.keys(diff.differences).length > 0) {
            differences.push(diff);
          }
        } else {
          differences.push({
            employee_rut: liq.employees?.rut,
            name: `${liq.employees?.first_name} ${liq.employees?.last_name}`,
            issue: 'Employee in liquidation but not in book'
          });
        }
      });

      comparison.differences = differences;
    }

    return NextResponse.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Error comparando datos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}