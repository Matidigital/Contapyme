import { NextRequest, NextResponse } from 'next/server';

// Configuración por defecto basada en valores reales de Chile (Enero 2025)
const DEFAULT_SETTINGS = {
  afp_configs: [
    { id: 'afp-capital', name: 'AFP Capital', code: 'CAPITAL', commission_percentage: 1.44, sis_percentage: 1.15, active: true },
    { id: 'afp-cuprum', name: 'AFP Cuprum', code: 'CUPRUM', commission_percentage: 1.48, sis_percentage: 1.15, active: true },
    { id: 'afp-habitat', name: 'AFP Hábitat', code: 'HABITAT', commission_percentage: 1.27, sis_percentage: 1.15, active: true },
    { id: 'afp-planvital', name: 'AFP PlanVital', code: 'PLANVITAL', commission_percentage: 1.16, sis_percentage: 1.15, active: true },
    { id: 'afp-provida', name: 'AFP ProVida', code: 'PROVIDA', commission_percentage: 1.69, sis_percentage: 1.15, active: true },
    { id: 'afp-modelo', name: 'AFP Modelo', code: 'MODELO', commission_percentage: 0.58, sis_percentage: 1.15, active: true },
    { id: 'afp-uno', name: 'AFP Uno', code: 'UNO', commission_percentage: 0.69, sis_percentage: 1.15, active: true }
  ],
  health_configs: [
    { id: 'fonasa', name: 'FONASA', code: 'FONASA', plan_percentage: 7.0, active: true },
    { id: 'banmedica', name: 'Banmédica', code: 'BANMEDICA', plan_percentage: 8.5, active: true },
    { id: 'consalud', name: 'Consalud', code: 'CONSALUD', plan_percentage: 8.2, active: true },
    { id: 'cruz-blanca', name: 'Cruz Blanca', code: 'CRUZ_BLANCA', plan_percentage: 8.8, active: true },
    { id: 'vida-tres', name: 'Vida Tres', code: 'VIDA_TRES', plan_percentage: 8.3, active: true },
    { id: 'colmena', name: 'Colmena Golden Cross', code: 'COLMENA', plan_percentage: 8.6, active: true }
  ],
  income_limits: {
    uf_limit: 83.4, // Tope imponible AFP/Salud en UF
    minimum_wage: 500000, // Sueldo mínimo en CLP
    family_allowance_limit: 1000000 // Límite superior para asignación familiar
  },
  family_allowances: {
    tramo_a: 13596, // Hasta $500.000
    tramo_b: 8397,  // $500.001 a $750.000  
    tramo_c: 2798   // $750.001 a $1.000.000
  },
  contributions: {
    unemployment_insurance_fixed: 3.0,      // Seguro cesantía plazo fijo
    unemployment_insurance_indefinite: 0.6, // Seguro cesantía indefinido
    social_security_percentage: 10.0        // Cotización AFP base
  },
  company_info: {
    mutual_code: 'ACHS',
    caja_compensacion_code: ''
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    // Por ahora, devolvemos siempre la configuración por defecto
    // TODO: Conectar con Supabase cuando esté disponible
    console.log(`🔧 Returning default settings for company ${companyId}`);
    
    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
      message: 'Configuración por defecto cargada (modo temporal)'
    });

  } catch (error) {
    console.error('Error in GET /api/payroll/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    const updatedSettings = await request.json();

    // Merge con configuración por defecto
    const mergedSettings = {
      ...DEFAULT_SETTINGS,
      ...updatedSettings
    };

    console.log(`🔧 Settings updated for company ${companyId} (modo temporal)`);
    
    return NextResponse.json({
      success: true,
      data: mergedSettings,
      message: 'Configuración actualizada exitosamente (modo temporal)'
    });

  } catch (error) {
    console.error('Error in PUT /api/payroll/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔧 Previred sync simulation for company ${companyId}`);
    
    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
      message: 'Configuración actualizada desde Previred exitosamente (modo temporal)'
    });

  } catch (error) {
    console.error('Error in POST /api/payroll/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}