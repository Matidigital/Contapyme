/**
 * Servicio de liquidaciones SIMPLE - Solo cálculos locales
 * Sin APIs externas, sin consultas complejas Supabase
 */

import { PayrollCalculator } from './payrollCalculator';

export interface SimpleLiquidationRequest {
  employee: {
    id: string;
    rut: string;
    first_name: string;
    last_name: string;
    base_salary: number;
    contract_type?: string;
  };
  period: {
    year: number;
    month: number;
    days_worked?: number;
  };
  additional_income?: {
    bonuses?: number;
    commissions?: number;
    gratification?: number;
    overtime_amount?: number;
    food_allowance?: number;
    transport_allowance?: number;
  };
  additional_deductions?: {
    loan_deductions?: number;
    advance_payments?: number;
    apv_amount?: number;
    other_deductions?: number;
  };
}

export interface SimpleLiquidationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Configuración estándar chilena 2025 (hardcodeada)
const CHILE_STANDARD_CONFIG = {
  afp_configs: [
    { name: 'HABITAT', commission_percentage: 1.27 },
    { name: 'CUPRUM', commission_percentage: 1.44 },
    { name: 'PROVIDA', commission_percentage: 1.45 },
    { name: 'PLANVITAL', commission_percentage: 1.16 },
    { name: 'CAPITAL', commission_percentage: 1.44 },
    { name: 'MODELO', commission_percentage: 0.77 },
    { name: 'UNO', commission_percentage: 0.69 }
  ],
  health_plans: [
    { code: 'FONASA', name: 'FONASA', percentage: 7.0 }
  ],
  family_allowance_amount: 15000,
  tax_brackets: [] // Usar defaults del PayrollCalculator
};

export class SimpleLiquidationService {
  
  /**
   * Calcular liquidación con datos locales únicamente
   */
  static calculateLiquidation(request: SimpleLiquidationRequest): SimpleLiquidationResponse {
    try {
      console.log('🚀 Simple Liquidation Service - Cálculo local');
      
      // Validaciones básicas
      if (!request.employee || !request.employee.base_salary) {
        return {
          success: false,
          error: 'Datos del empleado incompletos'
        };
      }

      if (!request.period || !request.period.year || !request.period.month) {
        return {
          success: false,
          error: 'Período no especificado'
        };
      }

      // Preparar datos del empleado con configuración estándar
      const employeeData = {
        id: request.employee.id,
        rut: request.employee.rut,
        first_name: request.employee.first_name,
        last_name: request.employee.last_name,
        base_salary: request.employee.base_salary,
        contract_type: request.employee.contract_type || 'indefinido',
        // Configuración estándar (más común en Chile)
        afp_code: 'HABITAT',
        health_institution_code: 'FONASA',
        family_allowances: 0
      };

      const periodData = {
        year: request.period.year,
        month: request.period.month,
        days_worked: request.period.days_worked || 30,
        worked_hours: 0,
        overtime_hours: 0
      };

      // Usar configuración estándar chilena
      const calculator = new PayrollCalculator(CHILE_STANDARD_CONFIG);

      // Calcular liquidación
      const liquidationResult = calculator.calculateLiquidation(
        employeeData,
        periodData,
        request.additional_income || {},
        request.additional_deductions || {}
      );

      console.log('✅ Liquidación calculada exitosamente (modo simple)');

      return {
        success: true,
        data: {
          liquidation: liquidationResult,
          calculation_mode: 'simple_local',
          employee_name: `${request.employee.first_name} ${request.employee.last_name}`,
          period_display: `${getMonthName(request.period.month)} ${request.period.year}`,
          warnings: liquidationResult.warnings || []
        }
      };

    } catch (error) {
      console.error('❌ Error en cálculo simple:', error);
      return {
        success: false,
        error: `Error de cálculo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
}

// Función auxiliar para nombres de meses
function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || 'Mes inválido';
}