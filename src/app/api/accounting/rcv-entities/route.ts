import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interfaz para entidad RCV
export interface RCVEntity {
  id?: string;
  company_id: string;
  entity_name: string;
  entity_rut: string;
  entity_business_name?: string;
  entity_type: 'supplier' | 'customer' | 'both';
  account_code: string;
  account_name: string;
  account_type?: string;
  default_tax_rate?: number;
  is_tax_exempt?: boolean;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// GET - Obtener todas las entidades RCV de una empresa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const entityType = searchParams.get('entity_type'); // supplier, customer, both
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search'); // Búsqueda por nombre o RUT

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'company_id es requerido'
      }, { status: 400 });
    }

    let query = supabase
      .from('rcv_entities')
      .select('*')
      .eq('company_id', companyId);

    // Filtros opcionales
    if (entityType && entityType !== 'all') {
      query = query.eq('entity_type', entityType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Búsqueda por nombre o RUT
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(`entity_name.ilike.%${searchTerm}%,entity_rut.ilike.%${searchTerm}%,entity_business_name.ilike.%${searchTerm}%`);
    }

    // Ordenar por nombre
    query = query.order('entity_name', { ascending: true });

    const { data: entities, error } = await query;

    if (error) {
      console.error('Error fetching RCV entities:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al obtener entidades RCV'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: entities || [],
      message: `${entities?.length || 0} entidades encontradas`
    });

  } catch (error) {
    console.error('Error in GET /api/accounting/rcv-entities:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear nueva entidad RCV
export async function POST(request: NextRequest) {
  try {
    const body: RCVEntity = await request.json();
    
    console.log('📧 POST /api/accounting/rcv-entities - Body received:', body);
    
    // Validaciones básicas
    const { 
      company_id, 
      entity_name, 
      entity_rut, 
      entity_type,
      account_code,
      account_name
    } = body;

    if (!company_id || !entity_name || !entity_rut || !entity_type || !account_code || !account_name) {
      return NextResponse.json({
        success: false,
        error: 'Campos requeridos: company_id, entity_name, entity_rut, entity_type, account_code, account_name',
        debug: {
          received: {
            company_id: !!company_id,
            entity_name: !!entity_name,
            entity_rut: !!entity_rut,
            entity_type: !!entity_type,
            account_code: !!account_code,
            account_name: !!account_name
          }
        }
      }, { status: 400 });
    }

    // Verificar que la tabla companies existe
    const { data: companyCheck, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single();

    if (companyError) {
      console.error('❌ Company check error:', companyError);
      return NextResponse.json({
        success: false,
        error: '⚠️ Tabla "companies" no configurada en Supabase. Ver CONFIGURAR_SUPABASE.md',
        details: 'La base de datos necesita ser configurada antes de usar esta funcionalidad.',
        setup_guide: 'Ejecutar: CREATE TABLE companies ... (ver archivo CONFIGURAR_SUPABASE.md)'
      }, { status: 500 });
    }

    if (!companyCheck) {
      return NextResponse.json({
        success: false,
        error: `Company con ID ${company_id} no existe. Crear primero en tabla companies.`,
        suggestion: 'Ejecutar: INSERT INTO companies (id, company_name) VALUES (...) en Supabase'
      }, { status: 404 });
    }

    // Validar formato RUT básico
    const rutPattern = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9K]$/;
    if (!rutPattern.test(entity_rut)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de RUT inválido. Debe ser XX.XXX.XXX-X'
      }, { status: 400 });
    }

    // Verificar si ya existe el RUT en la empresa
    const { data: existingEntity } = await supabase
      .from('rcv_entities')
      .select('id, entity_name')
      .eq('company_id', company_id)
      .eq('entity_rut', entity_rut)
      .single();

    if (existingEntity) {
      return NextResponse.json({
        success: false,
        error: `Ya existe una entidad con RUT ${entity_rut}: ${existingEntity.entity_name}`
      }, { status: 409 });
    }

    // Preparar datos para inserción
    const entityData = {
      company_id,
      entity_name,
      entity_rut,
      entity_business_name: body.entity_business_name || null,
      entity_type,
      account_code,
      account_name,
      account_type: body.account_type || null,
      default_tax_rate: body.default_tax_rate || 19.0,
      is_tax_exempt: body.is_tax_exempt || false,
      is_active: body.is_active !== undefined ? body.is_active : true,
      notes: body.notes || null
    };

    const { data: newEntity, error } = await supabase
      .from('rcv_entities')
      .insert(entityData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating RCV entity:', error);
      
      // Mensajes de error más específicos
      if (error.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: '⚠️ Tabla "rcv_entities" no existe en Supabase',
          details: 'Necesitas ejecutar la migración 20250810140000_rcv_entities.sql',
          setup_guide: 'Ver archivo CONFIGURAR_SUPABASE.md para instrucciones completas'
        }, { status: 500 });
      }
      
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          error: `Ya existe una entidad con RUT ${entity_rut} en esta empresa`
        }, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Error al crear entidad RCV',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newEntity,
      message: `Entidad ${entity_name} creada exitosamente`
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/accounting/rcv-entities:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PUT - Actualizar entidad RCV existente
export async function PUT(request: NextRequest) {
  try {
    const body: RCVEntity = await request.json();
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'ID de entidad es requerido'
      }, { status: 400 });
    }

    // Validar formato RUT si se está actualizando
    if (body.entity_rut) {
      const rutPattern = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9K]$/;
      if (!rutPattern.test(body.entity_rut)) {
        return NextResponse.json({
          success: false,
          error: 'Formato de RUT inválido. Debe ser XX.XXX.XXX-X'
        }, { status: 400 });
      }
    }

    // Preparar datos para actualización (solo campos que vienen en el body)
    const updateData: any = {};
    
    if (body.entity_name !== undefined) updateData.entity_name = body.entity_name;
    if (body.entity_rut !== undefined) updateData.entity_rut = body.entity_rut;
    if (body.entity_business_name !== undefined) updateData.entity_business_name = body.entity_business_name;
    if (body.entity_type !== undefined) updateData.entity_type = body.entity_type;
    if (body.account_code !== undefined) updateData.account_code = body.account_code;
    if (body.account_name !== undefined) updateData.account_name = body.account_name;
    if (body.account_type !== undefined) updateData.account_type = body.account_type;
    if (body.default_tax_rate !== undefined) updateData.default_tax_rate = body.default_tax_rate;
    if (body.is_tax_exempt !== undefined) updateData.is_tax_exempt = body.is_tax_exempt;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: updatedEntity, error } = await supabase
      .from('rcv_entities')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating RCV entity:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar entidad RCV'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedEntity,
      message: 'Entidad actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error in PUT /api/accounting/rcv-entities:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}