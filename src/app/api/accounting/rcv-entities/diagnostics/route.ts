import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Diagnóstico del estado de las tablas RCV
export async function GET(request: NextRequest) {
  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce';
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      company_id: companyId
    },
    tables: {},
    summary: {
      ready: false,
      issues: [],
      next_steps: []
    }
  };

  try {
    // 1. Verificar tabla companies
    try {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name')
        .limit(5);

      if (companiesError) {
        diagnostics.tables.companies = {
          exists: false,
          error: companiesError.message,
          code: companiesError.code
        };
        diagnostics.summary.issues.push('❌ Tabla "companies" no existe');
        diagnostics.summary.next_steps.push('Crear tabla companies (ver CONFIGURAR_SUPABASE.md)');
      } else {
        const hasCompany = companies?.some(c => c.id === companyId);
        diagnostics.tables.companies = {
          exists: true,
          count: companies?.length || 0,
          has_demo_company: hasCompany,
          sample: companies?.slice(0, 2)
        };
        
        if (!hasCompany) {
          diagnostics.summary.issues.push('⚠️ Company demo no existe');
          diagnostics.summary.next_steps.push(`Crear company: INSERT INTO companies (id, company_name) VALUES ('${companyId}', 'ContaPyme Demo')`);
        }
      }
    } catch (error) {
      diagnostics.tables.companies = {
        exists: false,
        error: 'Connection or permission error'
      };
      diagnostics.summary.issues.push('❌ Error conectando a tabla companies');
    }

    // 2. Verificar tabla rcv_entities
    try {
      const { data: entities, error: entitiesError } = await supabase
        .from('rcv_entities')
        .select('id, entity_name, entity_rut, entity_type')
        .eq('company_id', companyId)
        .limit(5);

      if (entitiesError) {
        diagnostics.tables.rcv_entities = {
          exists: false,
          error: entitiesError.message,
          code: entitiesError.code
        };
        diagnostics.summary.issues.push('❌ Tabla "rcv_entities" no existe');
        diagnostics.summary.next_steps.push('Ejecutar migración 20250810140000_rcv_entities.sql');
      } else {
        diagnostics.tables.rcv_entities = {
          exists: true,
          count: entities?.length || 0,
          sample: entities?.slice(0, 3)
        };
        
        if ((entities?.length || 0) === 0) {
          diagnostics.summary.issues.push('⚠️ No hay entidades de demo');
          diagnostics.summary.next_steps.push('Insertar datos de demo (ver CONFIGURAR_SUPABASE.md)');
        }
      }
    } catch (error) {
      diagnostics.tables.rcv_entities = {
        exists: false,
        error: 'Connection or permission error'
      };
      diagnostics.summary.issues.push('❌ Error conectando a tabla rcv_entities');
    }

    // 3. Verificar tabla rcv_records (del sistema de historial)
    try {
      const { data: records, error: recordsError } = await supabase
        .from('rcv_records')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      if (recordsError) {
        diagnostics.tables.rcv_records = {
          exists: false,
          error: recordsError.message,
          code: recordsError.code
        };
        diagnostics.summary.issues.push('⚠️ Tabla "rcv_records" no existe (opcional)');
        diagnostics.summary.next_steps.push('Ejecutar migración 20250810160000_rcv_history.sql para funcionalidad completa');
      } else {
        diagnostics.tables.rcv_records = {
          exists: true,
          count: records?.length || 0
        };
      }
    } catch (error) {
      diagnostics.tables.rcv_records = {
        exists: false,
        note: 'Tabla opcional para historial RCV'
      };
    }

    // 4. Estado general
    const companiesOk = diagnostics.tables.companies?.exists && diagnostics.tables.companies?.has_demo_company;
    const entitiesOk = diagnostics.tables.rcv_entities?.exists;
    
    diagnostics.summary.ready = companiesOk && entitiesOk;
    
    if (diagnostics.summary.ready) {
      diagnostics.summary.status = '✅ Sistema listo para crear entidades RCV';
    } else if (diagnostics.summary.issues.length > 0) {
      diagnostics.summary.status = `❌ ${diagnostics.summary.issues.length} problemas encontrados`;
    }

    return NextResponse.json({
      success: true,
      data: diagnostics
    });

  } catch (error) {
    console.error('Error in diagnostics:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en diagnóstico',
      details: error instanceof Error ? error.message : 'Error desconocido',
      data: diagnostics
    }, { status: 500 });
  }
}