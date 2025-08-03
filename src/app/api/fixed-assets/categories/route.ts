import { NextRequest, NextResponse } from 'next/server';
import { databaseSimple } from '@/lib/databaseSimple';

// GET /api/fixed-assets/categories - Obtener categorías de activos fijos
export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT * FROM fixed_assets_categories
      ORDER BY name ASC
    `;

    const { data, error } = await databaseSimple.query(query);

    if (error) {
      console.error('Error fetching fixed asset categories:', error);
      return NextResponse.json(
        { error: 'Error al obtener categorías de activos fijos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}