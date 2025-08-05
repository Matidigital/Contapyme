'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FixedAsset } from '@/types';

interface WorkerTask {
  taskId: string;
  type: string;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface DepreciationCalculation {
  id: string;
  bookValue: number;
  accumulatedDepreciation: number;
  monthlyDepreciation: number;
  depreciationPercentage: number;
  remainingMonths: number;
  isFullyDepreciated: boolean;
  monthsSinceStart: number;
  error?: string;
}

interface AssetsReport {
  totalAssets: number;
  totalPurchaseValue: number;
  totalBookValue: number;
  totalAccumulatedDepreciation: number;
  monthlyDepreciation: number;
  assetsNearFullDepreciation: any[];
  fullyDepreciatedAssets: number;
  activeAssets: number;
  disposedAssets: number;
  averageAge: number;
  calculations: DepreciationCalculation[];
}

export function useDepreciationWorker() {
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, WorkerTask>>(new Map());
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Inicializar Worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      console.log('🔧 Inicializando Web Worker para cálculos de depreciación...');
      
      const worker = new Worker('/workers/depreciation-calculator.js');
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { taskId, success, result, error, type, timestamp } = e.data;

        // Mensaje de inicialización
        if (type === 'WORKER_READY') {
          console.log('✅ Web Worker listo:', e.data.message);
          setIsWorkerReady(true);
          setWorkerError(null);
          return;
        }

        // Resolver tarea específica
        if (taskId) {
          const task = tasksRef.current.get(taskId);
          if (task) {
            if (success) {
              task.resolve(result);
            } else {
              task.reject(new Error(error || 'Error en Web Worker'));
            }
            tasksRef.current.delete(taskId);
          }
        }
      };

      worker.onerror = (error) => {
        console.error('❌ Error en Web Worker:', error);
        setWorkerError(error.message || 'Error desconocido');
        setIsWorkerReady(false);
      };

    } catch (error: any) {
      console.error('❌ Error creando Web Worker:', error);
      setWorkerError(error.message || 'Error al crear Worker');
      setIsWorkerReady(false);
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        console.log('🔌 Terminando Web Worker...');
        workerRef.current.terminate();
        workerRef.current = null;
      }
      tasksRef.current.clear();
    };
  }, []);

  // Función genérica para enviar tareas al Worker
  const sendTask = useCallback((type: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isWorkerReady) {
        reject(new Error('Web Worker no está disponible'));
        return;
      }

      const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Guardar tarea para resolver después
      tasksRef.current.set(taskId, {
        taskId,
        type,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Enviar al Worker
      workerRef.current.postMessage({
        type,
        data,
        taskId
      });

      // Timeout de seguridad (30 segundos)
      setTimeout(() => {
        if (tasksRef.current.has(taskId)) {
          tasksRef.current.delete(taskId);
          reject(new Error('Timeout: cálculo tomó demasiado tiempo'));
        }
      }, 30000);
    });
  }, [isWorkerReady]);

  // Calcular depreciación de un solo activo
  const calculateSingleDepreciation = useCallback(async (
    asset: FixedAsset, 
    currentDate?: Date
  ): Promise<DepreciationCalculation> => {
    if (!isWorkerReady) {
      // Fallback local si Worker no está disponible
      return calculateDepreciationLocal(asset, currentDate);
    }

    try {
      return await sendTask('CALCULATE_SINGLE_DEPRECIATION', {
        asset,
        currentDate: currentDate?.toISOString()
      });
    } catch (error) {
      console.warn('Worker falló, usando cálculo local:', error);
      return calculateDepreciationLocal(asset, currentDate);
    }
  }, [isWorkerReady, sendTask]);

  // Calcular reporte completo de activos
  const calculateAssetsReport = useCallback(async (
    assets: FixedAsset[],
    currentDate?: Date
  ): Promise<AssetsReport> => {
    if (!isWorkerReady || assets.length === 0) {
      return calculateReportLocal(assets, currentDate);
    }

    try {
      console.log(`🧮 Calculando reporte de ${assets.length} activos en Web Worker...`);
      const startTime = performance.now();
      
      const result = await sendTask('CALCULATE_ASSETS_REPORT', {
        assets,
        currentDate: currentDate?.toISOString()
      });
      
      const duration = performance.now() - startTime;
      console.log(`✅ Reporte calculado en ${Math.round(duration)}ms`);
      
      return result;
    } catch (error) {
      console.warn('Worker falló, usando cálculo local:', error);
      return calculateReportLocal(assets, currentDate);
    }
  }, [isWorkerReady, sendTask]);

  // Calcular proyecciones de depreciación
  const calculateProjections = useCallback(async (
    assets: FixedAsset[],
    monthsAhead: number = 12
  ): Promise<any[]> => {
    if (!isWorkerReady) {
      return []; // Fallback vacío
    }

    try {
      return await sendTask('CALCULATE_DEPRECIATION_PROJECTION', {
        assets,
        monthsAhead
      });
    } catch (error) {
      console.warn('Error calculando proyecciones:', error);
      return [];
    }
  }, [isWorkerReady, sendTask]);

  // Analizar rentabilidad de activos
  const analyzeAssetProfitability = useCallback(async (
    assets: FixedAsset[]
  ): Promise<any[]> => {
    if (!isWorkerReady) {
      return []; // Fallback vacío
    }

    try {
      return await sendTask('ANALYZE_ASSET_PROFITABILITY', {
        assets
      });
    } catch (error) {
      console.warn('Error analizando rentabilidad:', error);
      return [];
    }
  }, [isWorkerReady, sendTask]);

  return {
    isWorkerReady,
    workerError,
    calculateSingleDepreciation,
    calculateAssetsReport,
    calculateProjections,
    analyzeAssetProfitability
  };
}

// Funciones de fallback locales (simples)
function calculateDepreciationLocal(asset: FixedAsset, currentDate = new Date()): DepreciationCalculation {
  try {
    const monthsSinceDepreciation = Math.max(0, Math.floor(
      (currentDate.getTime() - new Date(asset.start_depreciation_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));
    
    const depreciableValue = asset.purchase_value - (asset.residual_value || 0);
    const totalMonths = asset.useful_life_years * 12;
    const monthlyDepreciation = depreciableValue / totalMonths;
    
    const accumulatedDepreciation = Math.min(
      monthsSinceDepreciation * monthlyDepreciation,
      depreciableValue
    );
    
    const bookValue = Math.max(
      asset.purchase_value - accumulatedDepreciation,
      asset.residual_value || 0
    );
    
    return {
      id: asset.id,
      bookValue: Math.round(bookValue),
      accumulatedDepreciation: Math.round(accumulatedDepreciation),
      monthlyDepreciation: Math.round(monthlyDepreciation),
      depreciationPercentage: Math.round(((accumulatedDepreciation / depreciableValue) * 100) * 100) / 100,
      remainingMonths: Math.max(0, totalMonths - monthsSinceDepreciation),
      isFullyDepreciated: accumulatedDepreciation >= depreciableValue,
      monthsSinceStart: monthsSinceDepreciation
    };
  } catch (error: any) {
    return {
      id: asset.id,
      bookValue: asset.purchase_value,
      accumulatedDepreciation: 0,
      monthlyDepreciation: 0,
      depreciationPercentage: 0,
      remainingMonths: asset.useful_life_years * 12,
      isFullyDepreciated: false,
      monthsSinceStart: 0,
      error: error.message
    };
  }
}

function calculateReportLocal(assets: FixedAsset[], currentDate = new Date()): AssetsReport {
  const calculations = assets.map(asset => calculateDepreciationLocal(asset, currentDate));
  
  return {
    totalAssets: assets.length,
    totalPurchaseValue: assets.reduce((sum, a) => sum + a.purchase_value, 0),
    totalBookValue: calculations.reduce((sum, c) => sum + c.bookValue, 0),
    totalAccumulatedDepreciation: calculations.reduce((sum, c) => sum + c.accumulatedDepreciation, 0),
    monthlyDepreciation: calculations.reduce((sum, c) => sum + c.monthlyDepreciation, 0),
    assetsNearFullDepreciation: [],
    fullyDepreciatedAssets: calculations.filter(c => c.isFullyDepreciated).length,
    activeAssets: assets.filter(a => a.status === 'active').length,
    disposedAssets: assets.filter(a => a.status === 'disposed').length,
    averageAge: 0,
    calculations
  };
}