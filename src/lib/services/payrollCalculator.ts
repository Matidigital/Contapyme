/**
 * Motor de Cálculo de Liquidaciones de Sueldo Chile
 * Implementa toda la lógica previsional chilena oficial
 * 
 * ✅ ACTUALIZADO: Usa configuración chilena centralizada
 * ✅ VERIFICADO: Cesantía 0.6% contratos indefinidos
 */

import { 
  CHILEAN_OFFICIAL_VALUES,
  calculateUnemploymentInsurance,
  calculateFamilyAllowance,
  calculateIncomeTax
} from './chileanPayrollConfig';

// Re-exportar valores para compatibilidad
export const CHILE_TAX_VALUES = CHILEAN_OFFICIAL_VALUES;

// Interfaces para tipado
export interface EmployeeData {
  id: string;
  rut: string;
  first_name: string;
  last_name: string;
  base_salary: number;
  contract_type: 'indefinido' | 'plazo_fijo' | 'obra_faena';
  afp_code: string;
  health_institution_code: string;
  family_allowances: number;
}

export interface PayrollPeriod {
  year: number;
  month: number;
  days_worked: number;
  worked_hours?: number;
  overtime_hours?: number;
}

export interface AdditionalIncome {
  bonuses?: number;
  commissions?: number;
  gratification?: number;
  overtime_amount?: number;
  food_allowance?: number;
  transport_allowance?: number;
}

export interface AdditionalDeductions {
  loan_deductions?: number;
  advance_payments?: number;
  apv_amount?: number;
  other_deductions?: number;
}

export interface PayrollSettings {
  afp_configs: Array<{
    code: string;
    commission_percentage: number;
    sis_percentage: number;
  }>;
  family_allowances: {
    tramo_a: number;
    tramo_b: number;
    tramo_c: number;
  };
  income_limits: {
    uf_limit: number;
    minimum_wage: number;
    family_allowance_limit: number;
  };
}

export interface LiquidationResult {
  // Datos básicos
  employee: EmployeeData;
  period: PayrollPeriod;
  
  // Haberes Imponibles
  base_salary: number;
  overtime_amount: number;
  bonuses: number;
  commissions: number;
  gratification: number;
  total_taxable_income: number;
  
  // Haberes No Imponibles
  food_allowance: number;
  transport_allowance: number;
  family_allowance: number;
  other_allowances: number;
  total_non_taxable_income: number;
  
  // Descuentos Previsionales
  afp_percentage: number;
  afp_commission_percentage: number;
  afp_amount: number;
  afp_commission_amount: number;
  sis_amount: number;
  
  health_percentage: number;
  health_amount: number;
  
  unemployment_percentage: number;
  unemployment_amount: number;
  
  // Impuestos
  income_tax_amount: number;
  
  // Otros Descuentos
  total_other_deductions: number;
  
  // Totales
  total_gross_income: number;
  total_deductions: number;
  net_salary: number;
  
  // Configuración usada
  calculation_config: PayrollSettings;
  
  // Metadatos
  calculation_date: string;
  tope_imponible_exceeded: boolean;
  warnings: string[];
}

export class PayrollCalculator {
  private settings: PayrollSettings;
  private warnings: string[] = [];

  constructor(settings: PayrollSettings) {
    this.settings = settings;
    this.warnings = [];
  }

  /**
   * Calcula liquidación completa de un empleado
   */
  calculateLiquidation(
    employee: EmployeeData,
    period: PayrollPeriod,
    additionalIncome: AdditionalIncome = {},
    additionalDeductions: AdditionalDeductions = {}
  ): LiquidationResult {
    this.warnings = [];

    // 1. Calcular sueldo base proporcional
    const proportionalBaseSalary = this.calculateProportionalSalary(
      employee.base_salary,
      period.days_worked
    );

    // 2. Calcular haberes imponibles
    const taxableIncome = this.calculateTaxableIncome(
      proportionalBaseSalary,
      additionalIncome
    );

    // 3. Aplicar tope imponible
    const { adjustedTaxableIncome, topeExceeded } = this.applyIncomeLimit(taxableIncome);

    // 4. Calcular asignación familiar
    const familyAllowance = this.calculateFamilyAllowance(
      employee.family_allowances,
      employee.base_salary
    );

    // 5. Calcular haberes no imponibles
    const nonTaxableIncome = this.calculateNonTaxableIncome(
      additionalIncome,
      familyAllowance
    );

    // 6. Calcular descuentos previsionales
    const previsionalDeductions = this.calculatePrevisionalDeductions(
      adjustedTaxableIncome,
      employee.afp_code,
      employee.health_institution_code,
      employee.contract_type
    );

    // 7. Calcular impuesto único segunda categoría
    const incomeTax = this.calculateIncomeTax(adjustedTaxableIncome);

    // 8. Calcular otros descuentos
    const otherDeductions = this.calculateOtherDeductions(additionalDeductions);

    // 9. Calcular totales
    const totalGrossIncome = taxableIncome + nonTaxableIncome;
    const totalDeductions = previsionalDeductions.total + incomeTax + otherDeductions;
    const netSalary = totalGrossIncome - totalDeductions;

    // 10. Validar límite de descuentos (45% máximo)
    this.validateDeductionLimit(totalGrossIncome, totalDeductions);

    return {
      employee,
      period,
      
      // Haberes Imponibles
      base_salary: proportionalBaseSalary,
      overtime_amount: additionalIncome.overtime_amount || 0,
      bonuses: additionalIncome.bonuses || 0,
      commissions: additionalIncome.commissions || 0,
      gratification: additionalIncome.gratification || 0,
      total_taxable_income: taxableIncome,
      
      // Haberes No Imponibles
      food_allowance: additionalIncome.food_allowance || 0,
      transport_allowance: additionalIncome.transport_allowance || 0,
      family_allowance: familyAllowance,
      other_allowances: 0,
      total_non_taxable_income: nonTaxableIncome,
      
      // Descuentos Previsionales
      afp_percentage: CHILE_TAX_VALUES.AFP_BASE_PERCENTAGE,
      afp_commission_percentage: previsionalDeductions.afp_commission_percentage,
      afp_amount: previsionalDeductions.afp_amount,
      afp_commission_amount: previsionalDeductions.afp_commission_amount,
      sis_amount: previsionalDeductions.sis_amount,
      
      health_percentage: CHILE_TAX_VALUES.HEALTH_BASE_PERCENTAGE,
      health_amount: previsionalDeductions.health_amount,
      
      unemployment_percentage: previsionalDeductions.unemployment_percentage,
      unemployment_amount: previsionalDeductions.unemployment_amount,
      
      // Impuestos
      income_tax_amount: incomeTax,
      
      // Otros Descuentos
      total_other_deductions: otherDeductions,
      
      // Totales
      total_gross_income: totalGrossIncome,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      
      // Configuración
      calculation_config: this.settings,
      
      // Metadatos
      calculation_date: new Date().toISOString(),
      tope_imponible_exceeded: topeExceeded,
      warnings: [...this.warnings]
    };
  }

  /**
   * Calcula sueldo base proporcional según días trabajados
   */
  private calculateProportionalSalary(baseSalary: number, daysWorked: number): number {
    if (daysWorked >= 30) return baseSalary;
    return Math.round((baseSalary / 30) * daysWorked);
  }

  /**
   * Calcula total de haberes imponibles
   */
  private calculateTaxableIncome(
    baseSalary: number,
    additional: AdditionalIncome
  ): number {
    return baseSalary + 
           (additional.overtime_amount || 0) + 
           (additional.bonuses || 0) + 
           (additional.commissions || 0) + 
           (additional.gratification || 0);
  }

  /**
   * Aplica tope imponible (87.8 UF)
   */
  private applyIncomeLimit(taxableIncome: number): { adjustedTaxableIncome: number; topeExceeded: boolean } {
    const topeImponible = this.settings.income_limits.uf_limit * CHILE_TAX_VALUES.UF;
    
    if (taxableIncome > topeImponible) {
      this.warnings.push(`Renta imponible excede tope de ${this.settings.income_limits.uf_limit} UF`);
      return { adjustedTaxableIncome: topeImponible, topeExceeded: true };
    }
    
    return { adjustedTaxableIncome: taxableIncome, topeExceeded: false };
  }

  /**
   * Calcula asignación familiar según tramos
   * ✅ MEJORADO: Usa función centralizada con mejor lógica
   */
  private calculateFamilyAllowance(familyCharges: number, baseSalary: number): number {
    const familyAllowanceData = calculateFamilyAllowance(familyCharges, baseSalary);
    
    // Agregar información del tramo a warnings para transparencia
    if (familyCharges > 0 && familyAllowanceData.amount > 0) {
      this.warnings.push(`ℹ️ Asignación familiar: ${familyAllowanceData.bracket}`);
    }
    
    return familyAllowanceData.amount;
  }

  /**
   * Calcula total haberes no imponibles
   */
  private calculateNonTaxableIncome(
    additional: AdditionalIncome,
    familyAllowance: number
  ): number {
    return (additional.food_allowance || 0) + 
           (additional.transport_allowance || 0) + 
           familyAllowance;
  }

  /**
   * Calcula todos los descuentos previsionales
   * ✅ MEJORADO: Usa función centralizada de cesantía
   */
  private calculatePrevisionalDeductions(
    taxableIncome: number,
    afpCode: string,
    healthCode: string,
    contractType: string
  ) {
    // AFP - 10% obligatorio
    const afpAmount = Math.round(taxableIncome * (CHILE_TAX_VALUES.AFP_PERCENTAGE / 100));
    
    // Comisión AFP variable según administradora
    const afpConfig = this.settings.afp_configs.find(afp => afp.code === afpCode);
    const afpCommissionPercentage = afpConfig?.commission_percentage || 0.77; // Default Modelo 2025
    const afpCommissionAmount = Math.round(taxableIncome * (afpCommissionPercentage / 100));
    
    // SIS - Seguro de Invalidez y Sobrevivencia
    const sisAmount = Math.round(taxableIncome * (CHILE_TAX_VALUES.SIS_PERCENTAGE / 100));
    
    // Salud - 7% mínimo (puede ser más en ISAPRE)
    const healthAmount = Math.round(taxableIncome * (CHILE_TAX_VALUES.HEALTH_PERCENTAGE / 100));
    
    // ✅ CESANTÍA - Usa función centralizada corregida
    const unemploymentData = calculateUnemploymentInsurance(
      taxableIncome, 
      contractType as 'indefinido' | 'plazo_fijo' | 'obra_faena'
    );
    
    return {
      afp_amount: afpAmount,
      afp_commission_percentage: afpCommissionPercentage,
      afp_commission_amount: afpCommissionAmount,
      sis_amount: sisAmount,
      health_amount: healthAmount,
      unemployment_percentage: unemploymentData.percentage,
      unemployment_amount: unemploymentData.amount,
      total: afpAmount + afpCommissionAmount + sisAmount + healthAmount + unemploymentData.amount
    };
  }

  /**
   * Calcula impuesto único segunda categoría
   * ✅ MEJORADO: Usa función centralizada con tabla oficial completa
   */
  private calculateIncomeTax(taxableIncome: number): number {
    const incomeTaxData = calculateIncomeTax(taxableIncome);
    
    // Agregar información del tramo a warnings para transparencia
    if (incomeTaxData.amount > 0) {
      this.warnings.push(`ℹ️ Impuesto segunda categoría: Tramo ${incomeTaxData.bracket}`);
    }
    
    return incomeTaxData.amount;
  }

  /**
   * Calcula otros descuentos
   */
  private calculateOtherDeductions(additional: AdditionalDeductions): number {
    return (additional.loan_deductions || 0) + 
           (additional.advance_payments || 0) + 
           (additional.apv_amount || 0) + 
           (additional.other_deductions || 0);
  }

  /**
   * Valida que descuentos no excedan 45% del total
   */
  private validateDeductionLimit(grossIncome: number, totalDeductions: number): void {
    const deductionPercentage = (totalDeductions / grossIncome) * 100;
    
    if (deductionPercentage > CHILE_TAX_VALUES.MAX_DEDUCTIONS_PERCENTAGE) {
      this.warnings.push(
        `Descuentos (${deductionPercentage.toFixed(1)}%) exceden límite legal del 45%`
      );
    }
  }

  /**
   * Formatea montos a formato chileno
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formatea período YYYY-MM
   */
  static formatPeriod(year: number, month: number): string {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[month - 1]} ${year}`;
  }
}