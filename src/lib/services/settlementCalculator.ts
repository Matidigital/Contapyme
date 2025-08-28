/**
 * Calculadora de Finiquitos Laborales Chile
 * Implementa toda la normativa laboral chilena para cálculos de término de contrato
 * 
 * ✅ NORMATIVA: Código del Trabajo de Chile
 * ✅ ACTUALIZADO: Valores 2025 (sueldo mínimo, UF, etc.)
 * ✅ INCLUYE: Vacaciones proporcionales, indemnizaciones, avisos previos
 */

export interface CompanyData {
  name: string;
  rut: string;
  address: string;
  legal_representative_name: string;
  legal_representative_rut: string;
}

export interface EmployeeTerminationData {
  // Datos del empleado
  employee_id: string;
  employee_rut: string;
  employee_name: string;
  position: string;
  
  // Datos del contrato
  contract_start_date: Date;
  contract_type: 'indefinido' | 'plazo_fijo' | 'obra_faena';
  monthly_salary: number;
  weekly_hours: number;
  
  // Datos del término
  termination_date: Date;
  termination_cause_code: string;
  last_work_date: Date;
  
  // Vacaciones
  annual_vacation_days?: number; // Default 15 días hábiles
  vacation_days_taken?: number;
  vacation_periods?: VacationPeriod[];
  
  // Otros beneficios pendientes
  pending_overtime_hours?: number;
  pending_overtime_amount?: number;
  christmas_bonus_pending?: boolean;
  other_bonuses?: number;
}

export interface VacationPeriod {
  start_date: Date;
  end_date: Date;
  business_days: number;
  amount_paid: number;
}

export interface TerminationCause {
  article_code: string;
  article_name: string;
  requires_notice: boolean;
  notice_days: number;
  requires_severance: boolean;
  severance_calculation_type: 'years_service' | 'fixed_30_days' | 'fixed_11_days' | null;
  is_with_just_cause: boolean;
  category: 'employer_initiative' | 'employee_initiative' | 'mutual_agreement' | 'force_majeure';
}

export interface SettlementCalculationResult {
  // Información base
  employee: EmployeeTerminationData;
  termination_cause: TerminationCause;
  
  // Período trabajado
  years_of_service: number;
  months_of_service: number;
  days_worked_last_month: number;
  
  // Sueldos pendientes
  pending_salary_days: number;
  pending_salary_amount: number;
  
  // Vacaciones
  total_vacation_days_earned: number;
  vacation_days_taken: number;
  pending_vacation_days: number;
  vacation_daily_rate: number;
  pending_vacation_amount: number;
  
  // Feriado proporcional
  proportional_vacation_days: number;
  proportional_vacation_amount: number;
  
  // Indemnizaciones
  severance_entitled: boolean;
  severance_calculation_basis: string;
  severance_amount: number;
  notice_indemnification_amount: number;
  
  // Bonos y otros
  christmas_bonus_amount: number;
  pending_overtime_amount: number;
  other_bonuses_amount: number;
  
  // Totales
  total_compensations: number;
  total_deductions: number;
  final_net_amount: number;
  
  // Metadatos del cálculo
  calculation_warnings: string[];
  legal_references: string[];
  calculation_date: Date;
}

/**
 * Calculadora principal de finiquitos laborales
 */
export class SettlementCalculator {
  
  private readonly MINIMUM_WAGE_2025 = 500000; // Sueldo mínimo Chile 2025
  private readonly UF_VALUE_2025 = 37000; // Aproximado UF 2025
  private readonly MAX_SEVERANCE_UF = 330; // Tope legal indemnización
  
  // Causales de término según Código del Trabajo chileno
  private readonly TERMINATION_CAUSES: Record<string, TerminationCause> = {
    // Art. 159 - Iniciativa del trabajador o circunstancias especiales
    '159-1': {
      article_code: '159-1',
      article_name: 'Art. 159 N°1 - Mutuo acuerdo de las partes',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: false,
      category: 'mutual_agreement'
    },
    '159-2': {
      article_code: '159-2',
      article_name: 'Art. 159 N°2 - Renuncia del trabajador',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: false,
      category: 'employee_initiative'
    },
    '159-3': {
      article_code: '159-3',
      article_name: 'Art. 159 N°3 - Muerte del trabajador',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: false,
      category: 'force_majeure'
    },
    '159-4': {
      article_code: '159-4',
      article_name: 'Art. 159 N°4 - Vencimiento del plazo convenido',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: false,
      category: 'force_majeure'
    },
    '159-5': {
      article_code: '159-5',
      article_name: 'Art. 159 N°5 - Conclusión del trabajo o servicio',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: false,
      category: 'force_majeure'
    },
    '159-6': {
      article_code: '159-6',
      article_name: 'Art. 159 N°6 - Caso fortuito o fuerza mayor',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: false,
      category: 'force_majeure'
    },
    
    // Art. 160 - Conductas indebidas del trabajador (con justa causa)
    '160-1-a': {
      article_code: '160-1-a',
      article_name: 'Art. 160 N°1-a - Falta de probidad',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-1-b': {
      article_code: '160-1-b',
      article_name: 'Art. 160 N°1-b - Acoso sexual',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-1-c': {
      article_code: '160-1-c',
      article_name: 'Art. 160 N°1-c - Maltrato físico',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-1-d': {
      article_code: '160-1-d',
      article_name: 'Art. 160 N°1-d - Injurias contra el empleador',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-1-e': {
      article_code: '160-1-e',
      article_name: 'Art. 160 N°1-e - Conducta inmoral',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-1-f': {
      article_code: '160-1-f',
      article_name: 'Art. 160 N°1-f - Acoso laboral',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-2': {
      article_code: '160-2',
      article_name: 'Art. 160 N°2 - Negociación dentro del giro',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-3': {
      article_code: '160-3',
      article_name: 'Art. 160 N°3 - No concurrencia sin causa justificada',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-4-a': {
      article_code: '160-4-a',
      article_name: 'Art. 160 N°4-a - Abandono del trabajo (salida injustificada)',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-4-b': {
      article_code: '160-4-b',
      article_name: 'Art. 160 N°4-b - Negativa a trabajar sin causa',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-5': {
      article_code: '160-5',
      article_name: 'Art. 160 N°5 - Actos o imprudencias temerarias',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-6': {
      article_code: '160-6',
      article_name: 'Art. 160 N°6 - Perjuicio material intencional',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    '160-7': {
      article_code: '160-7',
      article_name: 'Art. 160 N°7 - Incumplimiento grave del contrato',
      requires_notice: false,
      notice_days: 0,
      requires_severance: false,
      severance_calculation_type: null,
      is_with_just_cause: true,
      category: 'employer_initiative'
    },
    
    // Art. 161 - Necesidades de la empresa (con indemnización)
    '161-1': {
      article_code: '161-1',
      article_name: 'Art. 161 N°1 - Necesidades de la empresa',
      requires_notice: true,
      notice_days: 30,
      requires_severance: true,
      severance_calculation_type: 'years_service',
      is_with_just_cause: false,
      category: 'employer_initiative'
    },
    '161-2': {
      article_code: '161-2',
      article_name: 'Art. 161 N°2 - Desahucio escrito del empleador',
      requires_notice: true,
      notice_days: 30,
      requires_severance: true,
      severance_calculation_type: 'years_service',
      is_with_just_cause: false,
      category: 'employer_initiative'
    },
    
    // Art. 163 bis - Procedimiento concursal
    '163-bis': {
      article_code: '163-bis',
      article_name: 'Art. 163 bis - Procedimiento concursal de liquidación',
      requires_notice: false,
      notice_days: 0,
      requires_severance: true,
      severance_calculation_type: 'years_service',
      is_with_just_cause: false,
      category: 'force_majeure'
    }
  };
  
  /**
   * Calcula el finiquito completo de un empleado
   */
  public calculateSettlement(data: EmployeeTerminationData): SettlementCalculationResult {
    const warnings: string[] = [];
    const legalRefs: string[] = [];
    
    // 1. Obtener causal de término
    const terminationCause = this.getTerminationCause(data.termination_cause_code);
    if (!terminationCause) {
      throw new Error(`Causal de término no válida: ${data.termination_cause_code}`);
    }
    legalRefs.push(`Código del Trabajo - ${terminationCause.article_name}`);
    
    // 2. Calcular tiempo de servicio
    const serviceTime = this.calculateServiceTime(data.contract_start_date, data.termination_date);
    
    // 3. Calcular días trabajados en el último mes
    const daysWorkedLastMonth = this.calculateDaysWorkedInMonth(
      data.last_work_date, 
      data.termination_date
    );
    
    // 4. Calcular sueldo pendiente
    const pendingSalary = this.calculatePendingSalary(
      data.monthly_salary,
      daysWorkedLastMonth,
      data.termination_date
    );
    
    // 5. Calcular vacaciones pendientes
    const vacationCalculation = this.calculateVacations(
      data.contract_start_date,
      data.termination_date,
      data.monthly_salary,
      data.annual_vacation_days || 15,
      data.vacation_days_taken || 0,
      data.vacation_periods || []
    );
    
    // 6. Calcular indemnizaciones
    const severanceCalculation = this.calculateSeverance(
      terminationCause,
      serviceTime.years,
      data.monthly_salary,
      data.termination_date,
      data.last_work_date
    );
    
    // 7. Calcular bonos pendientes
    const bonusCalculation = this.calculatePendingBonuses(
      data.termination_date,
      data.monthly_salary,
      data.christmas_bonus_pending || false,
      data.pending_overtime_amount || 0,
      data.other_bonuses || 0
    );
    
    // 8. Calcular totales
    const totalCompensations = 
      pendingSalary.amount +
      vacationCalculation.pending_amount +
      vacationCalculation.proportional_amount +
      severanceCalculation.severance_amount +
      severanceCalculation.notice_indemnification +
      bonusCalculation.christmas_bonus +
      bonusCalculation.overtime_amount +
      bonusCalculation.other_bonuses;
    
    // 9. Calcular descuentos (normalmente 0 en finiquitos)
    const totalDeductions = 0;
    const finalNetAmount = totalCompensations - totalDeductions;
    
    // 10. Agregar warnings específicos
    if (serviceTime.years >= 15 && terminationCause.requires_severance) {
      warnings.push('Empleado con más de 15 años de servicio - verificar tope de indemnización');
    }
    
    if (vacationCalculation.pending_days > 30) {
      warnings.push('Empleado tiene más de 30 días de vacaciones pendientes');
    }
    
    return {
      employee: data,
      termination_cause: terminationCause,
      
      years_of_service: serviceTime.years,
      months_of_service: serviceTime.months,
      days_worked_last_month: daysWorkedLastMonth,
      
      pending_salary_days: pendingSalary.days,
      pending_salary_amount: pendingSalary.amount,
      
      total_vacation_days_earned: vacationCalculation.total_earned,
      vacation_days_taken: vacationCalculation.days_taken,
      pending_vacation_days: vacationCalculation.pending_days,
      vacation_daily_rate: vacationCalculation.daily_rate,
      pending_vacation_amount: vacationCalculation.pending_amount,
      
      proportional_vacation_days: vacationCalculation.proportional_days,
      proportional_vacation_amount: vacationCalculation.proportional_amount,
      
      severance_entitled: severanceCalculation.entitled,
      severance_calculation_basis: severanceCalculation.basis,
      severance_amount: severanceCalculation.severance_amount,
      notice_indemnification_amount: severanceCalculation.notice_indemnification,
      
      christmas_bonus_amount: bonusCalculation.christmas_bonus,
      pending_overtime_amount: bonusCalculation.overtime_amount,
      other_bonuses_amount: bonusCalculation.other_bonuses,
      
      total_compensations: totalCompensations,
      total_deductions: totalDeductions,
      final_net_amount: finalNetAmount,
      
      calculation_warnings: warnings,
      legal_references: legalRefs,
      calculation_date: new Date()
    };
  }
  
  private getTerminationCause(code: string): TerminationCause | null {
    return this.TERMINATION_CAUSES[code] || null;
  }
  
  private calculateServiceTime(startDate: Date, endDate: Date) {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Cálculo exacto de años y meses
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    
    // Ajustar si el día final es menor al día inicial
    if (endDate.getDate() < startDate.getDate()) {
      months--;
    }
    
    // Ajustar años si los meses son negativos
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Para períodos muy cortos (menos de un mes), calcular fracción de mes
    if (years === 0 && months === 0) {
      // Calcular días en el mes de inicio
      const daysInStartMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      const daysWorked = diffDays + 1; // +1 para incluir el día de inicio
      months = daysWorked / daysInStartMonth;
    }
    
    return { years, months, total_days: diffDays };
  }
  
  private calculateDaysWorkedInMonth(lastWorkDate: Date, terminationDate: Date): number {
    const month = terminationDate.getMonth();
    const year = terminationDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Si trabajó todo el mes
    if (lastWorkDate.getMonth() !== month || lastWorkDate.getFullYear() !== year) {
      return terminationDate.getDate();
    }
    
    // Si trabajó parte del mes
    return lastWorkDate.getDate();
  }
  
  private calculatePendingSalary(monthlySalary: number, daysWorked: number, terminationDate: Date) {
    const daysInMonth = new Date(terminationDate.getFullYear(), terminationDate.getMonth() + 1, 0).getDate();
    const dailyRate = monthlySalary / daysInMonth;
    const pendingAmount = Math.round(dailyRate * daysWorked);
    
    return {
      days: daysWorked,
      daily_rate: dailyRate,
      amount: pendingAmount
    };
  }
  
  private calculateVacations(
    startDate: Date, 
    endDate: Date, 
    monthlySalary: number,
    annualVacationDays: number,
    daysTaken: number,
    vacationPeriods: VacationPeriod[]
  ) {
    // Calcular días de vacaciones ganados por año completo de trabajo
    const yearsOfService = this.calculateServiceTime(startDate, endDate).years;
    const totalEarned = yearsOfService * annualVacationDays;
    
    // NUEVO CÁLCULO DE FERIADO PROPORCIONAL SEGÚN NORMATIVA CHILENA
    // 1.66 días hábiles por mes trabajado (se redondea a 1.25 para 15 días anuales)
    const DIAS_POR_MES = 1.66; // Según normativa laboral chilena
    const serviceTime = this.calculateServiceTime(startDate, endDate);
    const totalMonthsWorked = (serviceTime.years * 12) + serviceTime.months;
    
    // Calcular días base de feriado proporcional
    const proportionalDaysBase = totalMonthsWorked * DIAS_POR_MES;
    
    // Calcular días adicionales por sábados, domingos y feriados
    // Estos se cuentan desde el día siguiente al término
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Contar días no hábiles dentro del período de feriado proporcional
    let additionalNonWorkingDays = 0;
    const daysToCheck = Math.floor(proportionalDaysBase);
    const currentCheckDate = new Date(nextDay);
    
    for (let i = 0; i < daysToCheck; i++) {
      const dayOfWeek = currentCheckDate.getDay();
      // Si es sábado (6) o domingo (0), se suma como día adicional
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        additionalNonWorkingDays++;
      }
      // También verificar si es feriado chileno
      if (isChileanHoliday(currentCheckDate)) {
        additionalNonWorkingDays++;
      }
      currentCheckDate.setDate(currentCheckDate.getDate() + 1);
    }
    
    // Total de días de feriado proporcional (base + no hábiles)
    const proportionalDays = proportionalDaysBase + additionalNonWorkingDays;
    
    // Vacaciones pendientes = ganadas - tomadas
    const pendingDays = Math.max(0, totalEarned - daysTaken);
    
    // Calcular valor diario de vacaciones (base: 30 días del mes)
    const dailyVacationRate = monthlySalary / 30;
    const pendingAmount = Math.round(pendingDays * dailyVacationRate);
    const proportionalAmount = Math.round(proportionalDays * dailyVacationRate);
    
    return {
      total_earned: totalEarned,
      days_taken: daysTaken,
      pending_days: pendingDays,
      proportional_days: proportionalDays,
      daily_rate: dailyVacationRate,
      pending_amount: pendingAmount,
      proportional_amount: proportionalAmount
    };
  }
  
  private calculateSeverance(
    cause: TerminationCause, 
    yearsOfService: number, 
    monthlySalary: number,
    terminationDate: Date,
    lastWorkDate: Date
  ) {
    let severanceAmount = 0;
    let noticeIndemnification = 0;
    let calculationBasis = 'No aplica indemnización';
    let entitled = cause.requires_severance;
    
    if (cause.requires_severance) {
      switch (cause.severance_calculation_type) {
        case 'years_service':
          // Un mes por cada año de servicio (tope 330 UF ≈ 11 meses)
          const months = Math.min(yearsOfService, 11);
          severanceAmount = months * monthlySalary;
          calculationBasis = `${months} mes(es) por ${yearsOfService} año(s) de servicio`;
          break;
          
        case 'fixed_30_days':
          // 30 días de remuneración (solo gerentes Art. 159)
          severanceAmount = monthlySalary;
          calculationBasis = '30 días de remuneración (Art. 159)';
          break;
          
        case 'fixed_11_days':
          // 11 días por año (casos especiales)
          const days = Math.min(yearsOfService * 11, 330);
          severanceAmount = Math.round((monthlySalary / 30) * days);
          calculationBasis = `${days} días por años de servicio`;
          break;
      }
      
      // Aplicar tope legal (330 UF)
      const maxSeverance = this.MAX_SEVERANCE_UF * this.UF_VALUE_2025;
      if (severanceAmount > maxSeverance) {
        severanceAmount = maxSeverance;
        calculationBasis += ' (aplicado tope legal 330 UF)';
      }
    }
    
    // Indemnización en lugar de aviso previo
    if (cause.requires_notice) {
      const daysDifference = Math.floor(
        (terminationDate.getTime() - lastWorkDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDifference < cause.notice_days) {
        const missingDays = cause.notice_days - daysDifference;
        noticeIndemnification = Math.round((monthlySalary / 30) * missingDays);
      }
    }
    
    return {
      entitled,
      basis: calculationBasis,
      severance_amount: severanceAmount,
      notice_indemnification: noticeIndemnification
    };
  }
  
  private calculatePendingBonuses(
    terminationDate: Date,
    monthlySalary: number,
    christmasBonusPending: boolean,
    overtimeAmount: number,
    otherBonuses: number
  ) {
    let christmasBonusAmount = 0;
    
    // Gratificación legal proporcional si está en período
    if (christmasBonusPending) {
      const month = terminationDate.getMonth() + 1; // 1-12
      // Gratificación proporcional desde enero hasta mes de término
      christmasBonusAmount = Math.round((monthlySalary * 0.25 * month) / 12);
    }
    
    return {
      christmas_bonus: christmasBonusAmount,
      overtime_amount: overtimeAmount,
      other_bonuses: otherBonuses
    };
  }
  
  /**
   * Genera el texto legal para la carta de aviso de término
   */
  public generateNoticeLetterText(calculation: SettlementCalculationResult, companyData?: CompanyData): string {
    const { employee, termination_cause } = calculation;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-CL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Determinar el tipo de carta según la causal
    const isNonRenewal = termination_cause.article_code === '159-4' || 
                        termination_cause.article_name.toLowerCase().includes('vencimiento') ||
                        employee.contract_type === 'plazo_fijo';
    
    const terminationDate = new Date(calculation.employee.termination_date);
    const formattedTerminationDate = terminationDate.toLocaleDateString('es-CL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    if (isNonRenewal) {
      // Carta de no renovación para contratos a plazo fijo
      return `Punta Arenas, ${formattedDate}

Señor(a)
${employee.employee_name.toUpperCase()}
RUT ${employee.employee_rut}
Presente:

Ref.: Aviso de no Renovación de contrato.

                              Por medio de la presente comunicamos a Ud. que sus servicios terminarán el día ${terminationDate.getDate()} de ${terminationDate.toLocaleDateString('es-CL', { month: 'long' })} del ${terminationDate.getFullYear()}, de acuerdo con lo convenido en el contrato de trabajo de plazo fijo que suscribimos con usted, y conforme lo permite el artículo 159 N°4 del Código del Trabajo, que estipula que el contrato de trabajo terminará por "vencimiento del plazo convenido en el contrato".

                              Asimismo, ponemos en su conocimiento que sus cotizaciones previsionales y de salud se encuentran al día, según consta en certificado de cotizaciones adjunto.

                             Su feriado proporcional del mes de ${terminationDate.toLocaleDateString('es-CL', { month: 'long' })} del ${terminationDate.getFullYear()}, se encontrará a su disposición a través del portal de la DT.

                             Finalmente, es nuestro deseo señalar que agradecemos su desempeño y compromiso durante el período en que le correspondió cumplir funciones en nuestra institución.

                Sin otro particular saluda atentamente a Ud.     




p.p. ${companyData?.legal_representative_name || 'MIGUEL ANGEL RODRIGUEZ CABRERA'}
GERENTE GENERAL
RUT N° ${companyData?.legal_representative_rut || '18.282.415-1'}





C.c.
Dirección del Trabajo
Carpeta Funcionario`;
    } else {
      // Carta de término para contratos indefinidos u otras causales
      return `Punta Arenas, ${formattedDate}

Señor(a)
${employee.employee_name.toUpperCase()}
RUT ${employee.employee_rut}
Presente:

Ref.: Aviso de Término de Contrato de Trabajo.

                              Por medio de la presente, comunicamos a Ud. que hemos resuelto poner término a su contrato de trabajo, en virtud de lo dispuesto en el ${termination_cause.article_name} del Código del Trabajo.

                              El término de su contrato será efectivo a partir del día ${formattedTerminationDate}.

${termination_cause.requires_notice ? 
  `                              Conforme a la ley, se le otorga un preaviso de ${termination_cause.notice_days} días hábiles.` : 
  '                              Dado que se trata de una causal que no requiere preaviso, el término será inmediato.'
}

                              Asimismo, ponemos en su conocimiento que sus cotizaciones previsionales y de salud se encuentran al día, según consta en certificado de cotizaciones adjunto.

${calculation.pending_vacation_days > 0 ? 
  `                             Su feriado proporcional (${calculation.pending_vacation_days.toFixed(2)} días), se encontrará a su disposición a través del portal de la DT o se incluirá en su finiquito.` :
  '                             No presenta días de feriado proporcional pendientes.'
}

${termination_cause.requires_severance ? 
  '                              Ud. tendrá derecho a las indemnizaciones que correspondan según la ley, las cuales serán calculadas y pagadas en su finiquito.' :
  '                              La causal invocada no genera derecho a indemnización por años de servicio.'
}

                              Finalmente, es nuestro deseo señalar que agradecemos su desempeño y compromiso durante el período en que le correspondió cumplir funciones en nuestra institución.

                Sin otro particular saluda atentamente a Ud.




p.p. ${companyData?.legal_representative_name || 'MIGUEL ANGEL RODRIGUEZ CABRERA'}
GERENTE GENERAL
RUT N° ${companyData?.legal_representative_rut || '18.282.415-1'}





C.c.
Dirección del Trabajo
Carpeta Funcionario`;
    }
  }
  
  /**
   * Genera el texto del finiquito
   */
  public generateSettlementText(calculation: SettlementCalculationResult, companyData?: CompanyData): string {
    const { employee } = calculation;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
    
    const formatNumber = (amount: number) => 
      new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(amount);

    const convertNumberToWords = (amount: number): string => {
      // Función simplificada para convertir números a palabras (implementación básica)
      const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
      const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
      const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
      const hundreds = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
      
      if (amount === 0) return 'cero';
      if (amount < 1000000) {
        return `${formatNumber(amount)} pesos`;
      }
      
      const millions = Math.floor(amount / 1000000);
      const remainder = amount % 1000000;
      const thousands = Math.floor(remainder / 1000);
      const units_val = remainder % 1000;
      
      let result = '';
      if (millions > 0) {
        result += millions === 1 ? 'un millón' : `${formatNumber(millions)} millones`;
      }
      if (thousands > 0) {
        if (result) result += ' ';
        result += `${formatNumber(thousands)} mil`;
      }
      if (units_val > 0) {
        if (result) result += ' ';
        result += `${formatNumber(units_val)}`;
      }
      result += ' pesos';
      
      return result.charAt(0).toUpperCase() + result.slice(1);
    };
    
    // Crear lista de conceptos a pagar
    let conceptos = [];
    if (calculation.pending_vacation_amount > 0) {
      conceptos.push(`Feriado Proporcional (${calculation.pending_vacation_days.toFixed(2)} días)    $    ${formatNumber(calculation.pending_vacation_amount)}.-`);
    }
    if (calculation.proportional_vacation_amount > 0) {
      conceptos.push(`Vacaciones Proporcionales (${calculation.proportional_vacation_days.toFixed(2)} días)    $    ${formatNumber(calculation.proportional_vacation_amount)}.-`);
    }
    if (calculation.severance_amount > 0) {
      conceptos.push(`Indemnización por Años de Servicio    $    ${formatNumber(calculation.severance_amount)}.-`);
    }
    if (calculation.notice_indemnification_amount > 0) {
      conceptos.push(`Indemnización Sustitutiva Aviso Previo    $    ${formatNumber(calculation.notice_indemnification_amount)}.-`);
    }
    if (calculation.pending_salary_amount > 0) {
      conceptos.push(`Sueldo Proporcional (${calculation.pending_salary_days} días)    $    ${formatNumber(calculation.pending_salary_amount)}.-`);
    }
    if (calculation.christmas_bonus_amount > 0) {
      conceptos.push(`Gratificación Proporcional    $    ${formatNumber(calculation.christmas_bonus_amount)}.-`);
    }
    if (calculation.pending_overtime_amount > 0) {
      conceptos.push(`Horas Extras Pendientes    $    ${formatNumber(calculation.pending_overtime_amount)}.-`);
    }
    
    const conceptosText = conceptos.length > 0 ? conceptos.join('\n') : 'No hay conceptos adicionales a pagar';
    
    return `En la ciudad de Punta Arenas, a ${formattedDate}, entre ${companyData?.name || 'ContaPyme Puq'} Rol Único Tributario N°${companyData?.rut || '78.223.873-6'}, representada en este acto, por ${companyData?.legal_representative_name || 'MIGUEL ANGEL RODRIGUEZ CABRERA'}, Chilena, Cédula Nacional de Identidad Nº${companyData?.legal_representative_rut || '18.282.415-1'}, ambos domiciliados en ${companyData?.address || 'Punta Arenas, Región de Magallanes, Chile'}, en su calidad de EMPLEADOR y don(a) ${employee.employee_name.toUpperCase()}, Cédula de Identidad N° ${employee.employee_rut}, con domicilio en [DIRECCIÓN TRABAJADOR], en adelante el "TRABAJADOR(A)", se acuerda el siguiente finiquito:

PRIMERO: Don(a) ${employee.employee_name.toUpperCase()}, declara haber prestado servicios a ${companyData?.name || 'ContaPyme Puq'} ubicado en ${companyData?.address || 'Punta Arenas, Región de Magallanes, Chile'}, desde el ${employee.contract_start_date.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })} hasta el día ${employee.termination_date.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })} fecha esta última de terminación de sus servicios por la causal dispuesta en el ${calculation.termination_cause.article_name}.

SEGUNDO: Don(a) ${employee.employee_name.toUpperCase()} declara recibir en este acto a su entera satisfacción, de parte de ${companyData?.name || 'ContaPyme Puq'}, las sumas que a continuación se indican, por los siguientes conceptos:

${conceptosText}
 

LIQUIDO A PAGAR    
$    ${formatNumber(calculation.final_net_amount)}.-
=========    ==========
SON: ${convertNumberToWords(calculation.final_net_amount)}.-

TERCERO: Don (a) ${employee.employee_name.toUpperCase()}, deja constancia que durante todo el tiempo que prestó servicios a ${companyData?.name || 'ContaPyme Puq'} recibió de ésta, correcta y oportunamente el total de las remuneraciones convenidas, de acuerdo con su contrato de trabajo, clase de trabajo ejecutado, reajustes legales, y demás prestaciones en conformidad a la Ley, dejando expresa constancia en este acto que nada se le adeuda por los conceptos antes indicados ni por ninguno otro, sea de origen legal o contractual derivado de la prestación de sus servicios, motivo por el cual, y no teniendo reclamo ni cargo alguno que formular, ni intenciones de entablar acciones judiciales en contra la empresa, le otorga el más amplio y total finiquito, declaración que formula libre y espontáneamente, en perfecto y cabal conocimiento de cada uno de sus derechos.

CUARTO: Asimismo, declara don (a) ${employee.employee_name.toUpperCase()} que, en todo caso, y a todo evento, renuncia expresamente a cualquier derecho, acción laboral, civil o penal o reclamo que eventualmente tuviere o pudiere corresponderle en contra del empleador, en relación directa o indirecta con su contrato de trabajo, con los servicios prestados, con la terminación del referido contrato o dichos servicios, sea que esos derechos o acciones correspondan a remuneraciones, cotizaciones previsionales, de seguridad social o de salud, subsidios, beneficios contractuales adicionales a las remuneraciones, indemnizaciones compensaciones, o con cualquier otra causa o concepto.

QUINTO: Conforme lo dispuesto en el artículo 13 del texto refundido de la ley N° 14.908, modificada sustancialmente por la ley N° 21389 sobre Abandono de familia y pago de pensiones alimenticias, el empleador declara que, a la fecha de término de la relación laboral, no ha sido notificado de resolución judicial que exija retener y pagar pensión de alimentos, con cargo a la remuneración del TRABAJADOR(A) o a la indemnización por años de servicio, que pueda corresponderle.

SEXTO: Se deja constancia que las imposiciones previsionales del TRABAJADOR(A) se encuentran al día. El finiquito no producirá efecto al poner término al contrato de trabajo si el empleador no hubiera efectuado el pago íntegro de las cotizaciones previsionales.

SEPTIMO: Para constancia firman las partes el presente finiquito en dos ejemplares, quedando uno de ellos en poder del empleador y el otro en poder del TRABAJADOR(A).


${employee.employee_name.toUpperCase()}
${employee.employee_rut}
TRABAJADOR(A)





p.p. ${companyData?.legal_representative_name || 'MIGUEL ANGEL RODRIGUEZ CABRERA'} ${companyData?.name || 'ContaPyme Puq'}
EMPLEADOR`;
  }
}

// Función de utilidad para obtener días hábiles entre fechas
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    const dayOfWeek = currentDate.getDay();
    // Excluir sábado (6) y domingo (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

// Lista de feriados chilenos (se debe actualizar anualmente)
export function isChileanHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed to 1-indexed
  const day = date.getDate();
  
  // Feriados fijos de Chile
  const holidays = [
    { month: 1, day: 1 },   // Año Nuevo
    { month: 5, day: 1 },   // Día del Trabajo
    { month: 5, day: 21 },  // Glorias Navales
    { month: 6, day: 20 },  // Día de los Pueblos Indígenas
    { month: 6, day: 29 },  // San Pedro y San Pablo
    { month: 7, day: 16 },  // Virgen del Carmen
    { month: 8, day: 15 },  // Asunción de la Virgen
    { month: 9, day: 18 },  // Primera Junta Nacional
    { month: 9, day: 19 },  // Glorias del Ejército
    { month: 10, day: 12 }, // Encuentro de Dos Mundos
    { month: 10, day: 31 }, // Día de las Iglesias Evangélicas
    { month: 11, day: 1 },  // Día de Todos los Santos
    { month: 12, day: 8 },  // Inmaculada Concepción
    { month: 12, day: 25 }  // Navidad
  ];
  
  // Verificar si la fecha coincide con algún feriado
  return holidays.some(h => h.month === month && h.day === day);
}