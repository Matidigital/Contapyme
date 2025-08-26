import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAnnex, type AnnexData } from '@/lib/templates/contractAnnexTemplates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Generar anexo basado en datos del empleado
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employee_id = searchParams.get('employee_id');
    const annex_type = searchParams.get('type') as AnnexData['annexType'];
    
    if (!employee_id || !annex_type) {
      return NextResponse.json({ 
        error: 'employee_id y type son requeridos' 
      }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener datos del empleado y su contrato
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select(`
        *,
        employment_contracts!inner(
          id,
          position,
          department,
          base_salary,
          start_date,
          end_date,
          contract_type,
          entry_time,
          exit_time
        ),
        companies!inner(
          name,
          rut,
          legal_representative_name,
          legal_representative_rut,
          fiscal_address,
          fiscal_city
        )
      `)
      .eq('id', employee_id)
      .single();

    if (employeeError || !employeeData) {
      console.error('Error fetching employee:', employeeError);
      return NextResponse.json({ 
        error: 'Empleado no encontrado' 
      }, { status: 404 });
    }

    // Obtener configuración de empresa desde payroll_settings
    const { data: payrollSettings } = await supabase
      .from('payroll_settings')
      .select('settings')
      .eq('company_id', employeeData.company_id)
      .single();

    const companyInfo = payrollSettings?.settings?.company_info;
    const legalRep = companyInfo?.legal_representative;

    // Preparar datos base para el anexo
    const baseAnnexData: Partial<AnnexData> = {
      // Datos del empleado
      employeeName: `${employeeData.first_name} ${employeeData.last_name} ${employeeData.middle_name || ''}`.trim(),
      employeeRut: employeeData.rut,
      employeeAddress: employeeData.address,
      employeePosition: employeeData.employment_contracts?.[0]?.position || '',
      employeeDepartment: employeeData.employment_contracts?.[0]?.department,
      
      // Datos de la empresa
      companyName: companyInfo?.company_name || employeeData.companies?.name,
      companyRut: companyInfo?.company_rut || employeeData.companies?.rut,
      companyAddress: companyInfo?.company_address || employeeData.companies?.fiscal_address,
      legalRepresentativeName: legalRep?.full_name || employeeData.companies?.legal_representative_name,
      legalRepresentativeRut: legalRep?.rut || employeeData.companies?.legal_representative_rut,
      
      // Datos del contrato
      originalContractDate: employeeData.employment_contracts?.[0]?.start_date,
      currentSalary: employeeData.employment_contracts?.[0]?.base_salary,
      
      // Tipo de anexo
      annexType: annex_type,
      annexDate: new Date().toISOString().split('T')[0]
    };

    // Devolver HTML base para que el frontend pueda editarlo
    return NextResponse.json({
      success: true,
      baseData: baseAnnexData,
      message: 'Datos base del anexo listos para edición'
    });

  } catch (error) {
    console.error('Error in GET /api/payroll/contracts/generate-annex:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// POST: Generar anexo con datos personalizados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let annexData = body as AnnexData;

    // Si se proporciona employee_id, cargar datos del empleado
    if (body.employee_id && !annexData.employeeName) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          *,
          employment_contracts!inner(
            position,
            department,
            base_salary,
            start_date
          ),
          companies!inner(
            name,
            rut,
            legal_representative_name,
            legal_representative_rut,
            fiscal_address,
            fiscal_city
          )
        `)
        .eq('id', body.employee_id)
        .single();

      if (employeeError || !employeeData) {
        return NextResponse.json({ 
          error: 'Empleado no encontrado' 
        }, { status: 404 });
      }

      // Obtener configuración de empresa desde payroll_settings
      const { data: payrollSettings } = await supabase
        .from('payroll_settings')
        .select('settings')
        .eq('company_id', employeeData.company_id)
        .single();

      const companyInfo = payrollSettings?.settings?.company_info;

      // Completar datos de anexo con información del empleado
      annexData = {
        ...annexData,
        employeeName: `${employeeData.first_name} ${employeeData.last_name} ${employeeData.middle_name || ''}`.trim(),
        employeeRut: employeeData.rut,
        employeeAddress: employeeData.address,
        employeePosition: employeeData.employment_contracts?.[0]?.position || '',
        employeeDepartment: employeeData.employment_contracts?.[0]?.department,
        companyName: companyInfo?.company_name || employeeData.companies?.name,
        companyRut: companyInfo?.company_rut || employeeData.companies?.rut,
        companyAddress: companyInfo?.company_address || employeeData.companies?.fiscal_address,
        legalRepresentativeName: companyInfo?.legal_representative?.name || employeeData.companies?.legal_representative_name,
        legalRepresentativeRut: companyInfo?.legal_representative?.rut || employeeData.companies?.legal_representative_rut,
        currentSalary: employeeData.employment_contracts?.[0]?.base_salary || 0,
        originalContractDate: employeeData.employment_contracts?.[0]?.start_date,
        annexDate: body.annexDate || new Date().toISOString().split('T')[0]
      };
    }

    if (!annexData.annexType) {
      return NextResponse.json({ 
        error: 'annexType es requerido' 
      }, { status: 400 });
    }

    // Validaciones específicas por tipo
    if (annexData.annexType === 'renovation') {
      if (!annexData.renovationType) {
        return NextResponse.json({ 
          error: 'renovationType es requerido para renovación' 
        }, { status: 400 });
      }
      
      if (annexData.renovationType === 'fixed_term' && !annexData.newEndDate) {
        return NextResponse.json({ 
          error: 'newEndDate es requerido para contrato a plazo fijo' 
        }, { status: 400 });
      }
    }

    if (annexData.annexType === 'vacation') {
      if (!annexData.vacationStartDate || !annexData.vacationEndDate) {
        return NextResponse.json({ 
          error: 'Fechas de inicio y fin son requeridas para feriado' 
        }, { status: 400 });
      }
    }

    if (annexData.annexType === 'night_shift') {
      // Aplicar valores por defecto si no vienen
      annexData.nightShiftPercentage = annexData.nightShiftPercentage || 20;
      annexData.nightShiftStartTime = annexData.nightShiftStartTime || '21:00';
      annexData.nightShiftEndTime = annexData.nightShiftEndTime || '07:00';
    }

    // Generar el HTML del anexo
    const html = generateAnnex(annexData);

    // Log para auditoría
    console.log(`📄 Anexo ${annexData.annexType} generado para: ${annexData.employeeName}`);
    console.log(`🏢 Empresa: ${annexData.companyName}`);
    console.log(`📅 Fecha: ${annexData.annexDate}`);

    // Devolver el HTML directamente para mostrar en el navegador
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="anexo_${annexData.annexType}_${annexData.employeeRut?.replace(/[.-]/g, '')}.html"`
      }
    });

  } catch (error) {
    console.error('Error in POST /api/payroll/contracts/generate-annex:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}