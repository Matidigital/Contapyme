'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PayrollCalculator, type EmployeeData, type PayrollPeriod, type AdditionalIncome, type AdditionalDeductions, type LiquidationResult } from '@/lib/services/payrollCalculator';
import { CHILEAN_PAYROLL_CONFIG } from '@/lib/services/chileanPayrollConfig';

interface LiveCalculationData {
  employee?: EmployeeData;
  period: PayrollPeriod;
  additionalIncome: AdditionalIncome;
  additionalDeductions: AdditionalDeductions;
}

interface LiveCalculationResult {
  result: LiquidationResult | null;
  isCalculating: boolean;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

/**
 * Hook para cálculo de liquidaciones en tiempo real
 * Recalcula automáticamente cuando cambian los datos
 */
export function useLivePayrollCalculation(data: LiveCalculationData): LiveCalculationResult {
  const [result, setResult] = useState<LiquidationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Crear instancia del calculador con configuración chilena
  const calculator = useMemo(() => {
    return new PayrollCalculator(CHILEAN_PAYROLL_CONFIG);
  }, []);

  // Validar datos de entrada
  const validationResult = useMemo(() => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (!data.employee) {
      newErrors.push('Debe seleccionar un empleado');
    }

    if (data.period.days_worked <= 0) {
      newErrors.push('Días trabajados debe ser mayor a 0');
    }

    if (data.period.days_worked > 31) {
      newErrors.push('Días trabajados no puede ser mayor a 31');
    }

    if (data.period.month < 1 || data.period.month > 12) {
      newErrors.push('Mes debe estar entre 1 y 12');
    }

    if (data.period.year < 2020 || data.period.year > 2030) {
      newErrors.push('Año debe estar entre 2020 y 2030');
    }

    // Validaciones de montos negativos
    Object.entries(data.additionalIncome).forEach(([key, value]) => {
      if (value && value < 0) {
        newErrors.push(`${key} no puede ser negativo`);
      }
    });

    Object.entries(data.additionalDeductions).forEach(([key, value]) => {
      if (value && value < 0) {
        newErrors.push(`${key} no puede ser negativo`);
      }
    });

    // Advertencias
    if (data.employee?.contract_type === 'plazo_fijo') {
      newWarnings.push('ℹ️ Contrato plazo fijo: Sin seguro de cesantía');
    }

    if (data.period.days_worked < 30) {
      newWarnings.push(`⚠️ Período parcial: Solo ${data.period.days_worked} días trabajados`);
    }

    if (data.employee && data.employee.base_salary > 3000000) {
      newWarnings.push('⚠️ Sueldo alto: Verificar tope imponible');
    }

    return {
      errors: newErrors,
      warnings: newWarnings,
      isValid: newErrors.length === 0 && !!data.employee
    };
  }, [data]);

  // Función de cálculo con debounce
  const calculateLiquidation = useCallback(() => {
    if (!validationResult.isValid || !data.employee) {
      setResult(null);
      return;
    }

    setIsCalculating(true);
    
    try {
      const liquidationResult = calculator.calculateLiquidation(
        data.employee,
        data.period,
        data.additionalIncome,
        data.additionalDeductions
      );

      setResult(liquidationResult);
    } catch (error) {
      console.error('Error calculating liquidation:', error);
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  }, [data, calculator, validationResult.isValid]);

  // Actualizar errores y warnings
  useEffect(() => {
    setErrors(validationResult.errors);
    setWarnings(validationResult.warnings);
  }, [validationResult.errors, validationResult.warnings]);

  // Recalcular con debounce cuando cambian los datos
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (validationResult.isValid) {
        calculateLiquidation();
      } else {
        setResult(null);
        setIsCalculating(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [calculateLiquidation, validationResult.isValid]);

  return {
    result,
    isCalculating,
    errors,
    warnings,
    isValid: validationResult.isValid
  };
}

/**
 * Hook auxiliar para formatear moneda chilena
 */
export function useChileanCurrency() {
  return useCallback((amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);
}

/**
 * Hook para obtener información de contratos
 */
export function useContractTypeInfo() {
  return useCallback((contractType: string) => {
    const info = {
      indefinido: {
        name: 'Indefinido',
        unemployment: true,
        color: 'text-green-600',
        description: 'Con seguro de cesantía (0.6%)'
      },
      plazo_fijo: {
        name: 'Plazo Fijo',
        unemployment: false,
        color: 'text-blue-600',
        description: 'Sin seguro de cesantía'
      },
      obra_faena: {
        name: 'Obra o Faena',
        unemployment: false,
        color: 'text-purple-600',
        description: 'Sin seguro de cesantía'
      }
    };

    return info[contractType as keyof typeof info] || info.indefinido;
  }, []);
}