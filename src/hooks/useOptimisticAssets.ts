'use client';

import { useState, useCallback } from 'react';
import { FixedAsset, CreateFixedAssetData } from '@/types';

interface OptimisticAsset extends FixedAsset {
  isOptimistic?: boolean;
  isReverting?: boolean;
}

export function useOptimisticAssets() {
  const [assets, setAssets] = useState<OptimisticAsset[]>([]);
  const [loading, setLoading] = useState(false);

  // Generar ID temporal para optimistic updates
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Crear activo con optimistic update
  const createAssetOptimistic = useCallback(async (
    assetData: CreateFixedAssetData,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    const tempId = generateTempId();
    
    // Crear activo temporal para UI inmediata
    const optimisticAsset: OptimisticAsset = {
      id: tempId,
      user_id: 'demo-user',
      name: assetData.name,
      description: assetData.description || '',
      category: assetData.category || 'Activo Fijo',
      purchase_value: assetData.purchase_value,
      residual_value: assetData.residual_value || 0,
      purchase_date: assetData.purchase_date,
      start_depreciation_date: assetData.start_depreciation_date,
      useful_life_years: assetData.useful_life_years,
      depreciation_method: 'linear',
      asset_account_code: assetData.asset_account_code,
      depreciation_account_code: assetData.depreciation_account_code || '',
      expense_account_code: assetData.expense_account_code || '',
      serial_number: assetData.serial_number || '',
      brand: assetData.brand || '',
      model: assetData.model || '',
      location: assetData.location || '',
      responsible_person: assetData.responsible_person || '',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isOptimistic: true // Marcador para saber que es temporal
    };

    // 1. Actualizar UI inmediatamente (optimistic)
    console.log('⚡ Creando activo optimistic:', assetData.name);
    setAssets(prev => [optimisticAsset, ...prev]);

    try {
      // 2. Guardar en base de datos
      const response = await fetch('/api/fixed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear activo');
      }

      const savedAsset = await response.json();
      
      // 3. Reemplazar optimistic con real
      console.log('✅ Activo guardado, reemplazando optimistic');
      setAssets(prev => prev.map(asset => 
        asset.id === tempId ? { ...savedAsset.asset, isOptimistic: false } : asset
      ));

      onSuccess?.();

    } catch (error: any) {
      console.error('❌ Error creando activo, revirtiendo optimistic:', error);
      
      // 4. Revertir optimistic update en caso de error
      setAssets(prev => prev.map(asset => 
        asset.id === tempId 
          ? { ...asset, isReverting: true } // Mostrar estado de error
          : asset
      ));

      // Remover después de 2 segundos con animación
      setTimeout(() => {
        setAssets(prev => prev.filter(asset => asset.id !== tempId));
      }, 2000);

      onError?.(error.message || 'Error al crear activo');
    }
  }, []);

  // Actualizar activo con optimistic update
  const updateAssetOptimistic = useCallback(async (
    id: string,
    updateData: Partial<CreateFixedAssetData>,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    // 1. Guardar estado original para posible reversión
    const originalAsset = assets.find(a => a.id === id);
    if (!originalAsset) {
      onError?.('Activo no encontrado');
      return;
    }

    // 2. Actualizar UI inmediatamente
    const optimisticUpdate = {
      ...originalAsset,
      ...updateData,
      updated_at: new Date().toISOString(),
      isOptimistic: true
    };

    console.log('⚡ Actualizando activo optimistic:', id);
    setAssets(prev => prev.map(asset => 
      asset.id === id ? optimisticUpdate : asset
    ));

    try {
      // 3. Guardar en base de datos
      const response = await fetch(`/api/fixed-assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar activo');
      }

      const updatedAsset = await response.json();
      
      // 4. Confirmar con datos reales
      console.log('✅ Activo actualizado, confirmando cambios');
      setAssets(prev => prev.map(asset => 
        asset.id === id ? { ...updatedAsset.asset, isOptimistic: false } : asset
      ));

      onSuccess?.();

    } catch (error: any) {
      console.error('❌ Error actualizando activo, revirtiendo:', error);
      
      // 5. Revertir al estado original
      setAssets(prev => prev.map(asset => 
        asset.id === id ? originalAsset : asset
      ));

      onError?.(error.message || 'Error al actualizar activo');
    }
  }, [assets]);

  // Eliminar activo con optimistic update
  const deleteAssetOptimistic = useCallback(async (
    id: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    // 1. Guardar para posible reversión
    const assetToDelete = assets.find(a => a.id === id);
    if (!assetToDelete) {
      onError?.('Activo no encontrado');
      return;
    }

    // 2. Marcar como eliminando (efecto visual)
    console.log('⚡ Eliminando activo optimistic:', id);
    setAssets(prev => prev.map(asset => 
      asset.id === id 
        ? { ...asset, isOptimistic: true, isReverting: true } 
        : asset
    ));

    try {
      // 3. Eliminar de base de datos
      const response = await fetch(`/api/fixed-assets/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar activo');
      }

      // 4. Remover definitivamente después de animación
      setTimeout(() => {
        console.log('✅ Activo eliminado, removiendo de UI');
        setAssets(prev => prev.filter(asset => asset.id !== id));
        onSuccess?.();
      }, 500);

    } catch (error: any) {
      console.error('❌ Error eliminando activo, revirtiendo:', error);
      
      // 5. Revertir al estado original
      setAssets(prev => prev.map(asset => 
        asset.id === id ? assetToDelete : asset
      ));

      onError?.(error.message || 'Error al eliminar activo');
    }
  }, [assets]);

  // Refrescar todos los assets desde servidor
  const refreshAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fixed-assets?status=all');
      if (response.ok) {
        const data = await response.json();
        setAssets((data.assets || []).map((asset: FixedAsset) => ({
          ...asset,
          isOptimistic: false
        })));
      }
    } catch (error) {
      console.error('Error refreshing assets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    assets,
    loading,
    setAssets,
    createAssetOptimistic,
    updateAssetOptimistic,
    deleteAssetOptimistic,
    refreshAssets
  };
}