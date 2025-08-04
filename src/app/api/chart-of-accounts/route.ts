import { NextRequest, NextResponse } from 'next/server';
import { databaseSimple } from '@/lib/databaseSimple';

export const dynamic = 'force-dynamic';

// GET /api/chart-of-accounts - Obtener plan de cuentas
export async function GET(request: NextRequest) {
  try {
    const account_type = request.nextUrl.searchParams.get('type');
    const level_type = request.nextUrl.searchParams.get('level');
    const parent = request.nextUrl.searchParams.get('parent');

    console.log('Loading chart of accounts with filters:', { account_type, level_type, parent });

    let query = `
      SELECT 
        code,
        name,
        level_type,
        account_type,
        parent_code,
        is_active
      FROM chart_of_accounts
      WHERE is_active = true
    `;

    const params: string[] = [];

    if (account_type) {
      query += ` AND account_type = $${params.length + 1}`;
      params.push(account_type);
    }

    if (level_type) {
      query += ` AND level_type = $${params.length + 1}`;
      params.push(level_type);
    }

    if (parent) {
      query += ` AND parent_code = $${params.length + 1}`;
      params.push(parent);
    }

    query += ' ORDER BY code ASC';

    const { data, error } = await databaseSimple.query(query, params);

    if (error) {
      console.error('Error fetching chart of accounts:', error);
      return NextResponse.json({ 
        accounts: [],
        message: 'Error al cargar plan de cuentas: ' + error.message 
      });
    }

    return NextResponse.json({ 
      accounts: data || [],
      total: data?.length || 0
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      accounts: [],
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST /api/chart-of-accounts - Crear nueva cuenta (para futuro)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validaciones básicas
    if (!body.code || !body.name || !body.level_type || !body.account_type) {
      return NextResponse.json(
        { error: 'Campos requeridos: code, name, level_type, account_type' },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO chart_of_accounts (
        code, name, level_type, account_type, parent_code
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const { data, error } = await databaseSimple.query(insertQuery, [
      body.code,
      body.name,
      body.level_type,
      body.account_type,
      body.parent_code || null
    ]);

    if (error) {
      console.error('Error creating account:', error);
      return NextResponse.json(
        { error: 'Error al crear cuenta contable' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      account: data?.[0],
      message: 'Cuenta creada exitosamente' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}