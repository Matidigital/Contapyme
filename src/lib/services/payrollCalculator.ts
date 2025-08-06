/**
 * Motor de Cálculo de Liquidaciones de Sueldo Chile
 * Implementa toda la lógica previsional chilena oficial
 */

// Valores actuales Chile 2025 (actualizables desde configuración)
export const CHILE_TAX_VALUES = {
  UF: 39179, // Julio 2025
  UTM: 68923,
  MINIMUM_WAGE: 529000,
  AFP_BASE_PERCENTAGE: 10.0,
  HEALTH_BASE_PERCENTAGE: 7.0,
  SIS_PERCENTAGE: 1.88, // Julio 2025
  UNEMPLOYMENT_INDEFINITE: 0.6,
  UNEMPLOYMENT_FIXED: 3.0,
  MAX_DEDUCTIONS_PERCENTAGE: 45.0, // Máximo 45% según Código del Trabajo
  INCOME_TAX_EXEMPT_UTM: 13.5 // Exento hasta 13.5 UTM
};

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
   */
  private calculateFamilyAllowance(familyCharges: number, baseSalary: number): number {
    if (familyCharges === 0) return 0;
    
    const { family_allowances } = this.settings;
    let amountPerCharge = 0;
    
    if (baseSalary <= 500000) {
      amountPerCharge = family_allowances.tramo_a;
    } else if (baseSalary <= 750000) {
      amountPerCharge = family_allowances.tramo_b;
    } else if (baseSalary <= this.settings.income_limits.family_allowance_limit) {
      amountPerCharge = family_allowances.tramo_c;
    } else {
      return 0; // Sin asignación si excede límite
    }
    
    return amountPerCharge * familyCharges;
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
   */
  private calculatePrevisionalDeductions(
    taxableIncome: number,
    afpCode: string,
    healthCode: string,
    contractType: string
  ) {
    // AFP - 10% obligatorio
    const afpAmount = Math.round(taxableIncome * (CHILE_TAX_VALUES.AFP_BASE_PERCENTAGE / 100));
    
    // Comisión AFP variable según administradora
    const afpConfig = this.settings.afp_configs.find(afp => afp.code === afpCode);
    const afpCommissionPercentage = afpConfig?.commission_percentage || 0.58; // Default Modelo
    const afpCommissionAmount = Math.round(taxableIncome * (afpCommissionPercentage / 100));
    
    // SIS - Seguro de Invalidez y Sobrevivencia
    const sisAmount = Math.round(taxableIncome * (CHILE_TAX_VALUES.SIS_PERCENTAGE / 100));
    
    // Salud - 7% mínimo (puede ser más en ISAPRE)
    const healthAmount = Math.round(taxableIncome * (CHILE_TAX_VALUES.HEALTH_BASE_PERCENTAGE / 100));
    
    // Seguro de Cesantía - según tipo contrato
    let unemploymentPercentage = 0;
    if (contractType === 'indefinido') {
      unemploymentPercentage = CHILE_TAX_VALUES.UNEMPLOYMENT_INDEFINITE;
    } else if (contractType === 'plazo_fijo') {
      unemploymentPercentage = CHILE_TAX_VALUES.UNEMPLOYMENT_FIXED;
    }
    const unemploymentAmount = Math.round(taxableIncome * (unemploymentPercentage / 100));
    
    return {
      afp_amount: afpAmount,
      afp_commission_percentage: afpCommissionPercentage,
      afp_commission_amount: afpCommissionAmount,
      sis_amount: sisAmount,
      health_amount: healthAmount,
      unemployment_percentage: unemploymentPercentage,
      unemployment_amount: unemploymentAmount,
      total: afpAmount + afpCommissionAmount + sisAmount + healthAmount + unemploymentAmount
    };
  }

  /**
   * Calcula impuesto único segunda categoría
   */
  private calculateIncomeTax(taxableIncome: number): number {
    const exemptLimit = CHILE_TAX_VALUES.INCOME_TAX_EXEMPT_UTM * CHILE_TAX_VALUES.UTM;
    
    if (taxableIncome <= exemptLimit) {
      return 0;
    }
    
    // Tabla progresiva impuesto único (simplificada)
    // TODO: Implementar tabla completa según SII
    const taxableAmount = taxableIncome - exemptLimit;
    
    if (taxableAmount <= 150000) {
      return Math.round(taxableAmount * 0.04);
    } else if (taxableAmount <= 300000) {
      return Math.round(6000 + (taxableAmount - 150000) * 0.08);
    } else {
      return Math.round(18000 + (taxableAmount - 300000) * 0.135);
    }
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