import { NextRequest, NextResponse } from 'next/server';
import { databaseSimple } from '@/lib/databaseSimple';
import { UpdateFixedAssetData } from '@/types';

// GET /api/fixed-assets/[id] - Obtener activo fijo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const query = `
      SELECT 
        fa.*,
        fac.name as category_name,
        fac.description as category_description
      FROM fixed_assets fa
      LEFT JOIN fixed_assets_categories fac ON fa.category = fac.name
      WHERE fa.id = $1 AND fa.user_id = auth.uid()
    `;

    const { data, error } = await databaseSimple.query(query, [id]);

    if (error) {
      console.error('Error fetching fixed asset:', error);
      return NextResponse.json(
        { error: 'Error al obtener activo fijo' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Activo fijo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ asset: data[0] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/fixed-assets/[id] - Actualizar activo fijo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: UpdateFixedAssetData = await request.json();

    // Validaciones básicas
    if (body.purchase_value && body.purchase_value <= 0) {
      return NextResponse.json(
        { error: 'El valor de compra debe ser positivo' },
        { status: 400 }
      );
    }

    if (body.useful_life_years && body.useful_life_years <= 0) {
      return NextResponse.json(
        { error: 'Los años de vida útil deben ser positivos' },
        { status: 400 }
      );
    }

    if (body.residual_value && body.purchase_value && 
        (body.residual_value < 0 || body.residual_value >= body.purchase_value)) {
      return NextResponse.json(
        { error: 'El valor residual debe ser mayor o igual a 0 y menor al valor de compra' },
        { status: 400 }
      );
    }

    // Construir query de actualización dinámicamente
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    const updatableFields = [
      'name', 'description', 'category', 'purchase_value', 'residual_value',
      'purchase_date', 'start_depreciation_date', 'useful_life_years',
      'asset_account_code', 'depreciation_account_code', 'expense_account_code',
      'serial_number', 'brand', 'model', 'location', 'responsible_person', 'status'
    ];

    updatableFields.forEach(field => {
      if (body[field as keyof UpdateFixedAssetData] !== undefined) {
        updateFields.push(`${field} = $${paramCounter}`);
        values.push(body[field as keyof UpdateFixedAssetData]);
        paramCounter++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE fixed_assets 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter} AND user_id = auth.uid()
      RETURNING *
    `;

    values.push(id);

    const { data, error } = await databaseSimple.query(updateQuery, values);

    if (error) {
      console.error('Error updating fixed asset:', error);
      return NextResponse.json(
        { error: 'Error al actualizar activo fijo' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Activo fijo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    const updatedAsset = data[0];

    // Si se actualizaron valores relacionados con depreciación, regenerar cronograma
    const depreciationFields = ['purchase_value', 'residual_value', 'useful_life_years', 'start_depreciation_date'];
    const needsDepreciationUpdate = depreciationFields.some(field => 
      body[field as keyof UpdateFixedAssetData] !== undefined
    );

    if (needsDepreciationUpdate) {
      try {
        // Eliminar cronograma anterior
        await databaseSimple.query(
          'DELETE FROM fixed_assets_depreciation WHERE fixed_asset_id = $1',
          [id]
        );

        // Generar nuevo cronograma
        const scheduleQuery = `
          INSERT INTO fixed_assets_depreciation 
          (fixed_asset_id, period_year, period_month, monthly_depreciation, accumulated_depreciation, book_value)
          SELECT 
            $1,
            period_year,
            period_month, 
            monthly_depreciation,
            accumulated_depreciation,
            book_value
          FROM generate_depreciation_schedule($1)
        `;

        await databaseSimple.query(scheduleQuery, [id]);
      } catch (scheduleError) {
        console.error('Error regenerating depreciation schedule:', scheduleError);
        // No fallar la actualización por esto
      }
    }

    return NextResponse.json({ 
      asset: updatedAsset,
      message: 'Activo fijo actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/fixed-assets/[id] - Eliminar activo fijo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Eliminar activo fijo (las depreciaciones se eliminan por CASCADE)
    const deleteQuery = `
      DELETE FROM fixed_assets 
      WHERE id = $1 AND user_id = auth.uid()
      RETURNING id, name
    `;

    const { data, error } = await databaseSimple.query(deleteQuery, [id]);

    if (error) {
      console.error('Error deleting fixed asset:', error);
      return NextResponse.json(
        { error: 'Error al eliminar activo fijo' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Activo fijo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: `Activo fijo "${data[0].name}" eliminado exitosamente` 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}