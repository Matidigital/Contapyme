// VALIDADOR F29 - Sistema de validación robusto para formularios F29

import { F29SuperData } from './f29SuperParser';

export interface F29ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  summary: string;
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedFix?: number;
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

// Validador principal F29
export function validateF29Data(data: Partial<F29SuperData>): F29ValidationResult {
  console.log('🔍 VALIDADOR F29: Iniciando validación robusta...');
  
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  let confidence = 100;
  
  // VALIDACIÓN 1: Códigos principales presentes
  const requiredCodes = [
    { code: 'codigo538', name: 'Débito Fiscal', critical: true },
    { code: 'codigo511', name: 'Crédito Fiscal', critical: true },
    { code: 'codigo563', name: 'Ventas Netas', critical: true },
    { code: 'codigo062', name: 'PPM', critical: false },
    { code: 'codigo077', name: 'Remanente', critical: false }
  ];
  
  for (const { code, name, critical } of requiredCodes) {
    const value = (data as any)[code];
    
    if (!value || value <= 0) {
      if (critical) {
        errors.push({
          code: 'MISSING_CRITICAL_CODE',
          field: code,
          message: `${name} (${code}) es obligatorio y debe ser mayor a 0`,
          severity: 'critical'
        });
        confidence -= 25;
      } else {
        warnings.push({
          code: 'MISSING_OPTIONAL_CODE',
          field: code,
          message: `${name} (${code}) no detectado - puede ser 0 o estar ausente`,
          impact: 'low'
        });
        confidence -= 5;
      }
    }
  }
  
  // VALIDACIÓN 2: Rangos lógicos para PyMEs chilenas
  const rangeValidations = [
    { 
      code: 'codigo538', 
      min: 1000, 
      max: 50000000, // 50M CLP
      name: 'Débito Fiscal',
      typical: { min: 100000, max: 10000000 }
    },
    { 
      code: 'codigo511', 
      min: 0, 
      max: 100000000, // 100M CLP
      name: 'Crédito Fiscal',
      typical: { min: 50000, max: 20000000 }
    },
    { 
      code: 'codigo563', 
      min: 10000, 
      max: 500000000, // 500M CLP
      name: 'Ventas Netas',
      typical: { min: 1000000, max: 100000000 }
    },
    { 
      code: 'codigo062', 
      min: 0, 
      max: 5000000, // 5M CLP
      name: 'PPM',
      typical: { min: 10000, max: 1000000 }
    }
  ];
  
  for (const { code, min, max, name, typical } of rangeValidations) {
    const value = (data as any)[code];
    
    if (value && value > 0) {
      if (value < min || value > max) {
        errors.push({
          code: 'VALUE_OUT_OF_RANGE',
          field: code,
          message: `${name} fuera de rango válido: $${value.toLocaleString('es-CL')} (rango: $${min.toLocaleString('es-CL')} - $${max.toLocaleString('es-CL')})`,
          severity: 'high'
        });
        confidence -= 20;
      } else if (value < typical.min || value > typical.max) {
        warnings.push({
          code: 'VALUE_ATYPICAL',
          field: code,
          message: `${name} fuera del rango típico para PyMEs: $${value.toLocaleString('es-CL')}`,
          impact: 'medium'
        });
        confidence -= 3;
      }
    }
  }
  
  // VALIDACIÓN 3: Coherencia matemática F29
  if (data.codigo538 && data.codigo563) {
    const expectedDebito = data.codigo563 * 0.19;
    const debitoError = Math.abs(data.codigo538 - expectedDebito);
    const debitoErrorPercent = (debitoError / expectedDebito) * 100;
    
    if (debitoErrorPercent > 50) {
      errors.push({
        code: 'DEBITO_INCOHERENT',
        field: 'codigo538',
        message: `Débito fiscal no coherente con ventas: ${data.codigo538.toLocaleString('es-CL')} vs esperado ${expectedDebito.toLocaleString('es-CL')}`,
        severity: 'high',
        suggestedFix: Math.round(expectedDebito)
      });
      confidence -= 15;
    } else if (debitoErrorPercent > 20) {
      warnings.push({
        code: 'DEBITO_INCONSISTENT',
        field: 'codigo538',
        message: `Pequeña inconsistencia entre débito fiscal y ventas (${debitoErrorPercent.toFixed(1)}% diferencia)`,
        impact: 'medium'
      });
      confidence -= 5;
    }
  }
  
  // VALIDACIÓN 4: IVA negativo (a favor del contribuyente)
  if (data.codigo538 && data.codigo511) {
    const ivaDeterminado = data.codigo538 - data.codigo511;
    
    if (ivaDeterminado < -10000000) { // Más de 10M a favor
      warnings.push({
        code: 'HIGH_IVA_CREDIT',
        field: 'ivaPagar',
        message: `IVA a favor muy alto: $${Math.abs(ivaDeterminado).toLocaleString('es-CL')} - verificar créditos`,
        impact: 'medium'
      });
      confidence -= 5;
    }
  }
  
  // VALIDACIÓN 5: Información básica
  if (!data.rut || data.rut.length < 8) {
    errors.push({
      code: 'INVALID_RUT',
      field: 'rut',
      message: 'RUT no detectado o inválido',
      severity: 'medium'
    });
    confidence -= 10;
  }
  
  if (!data.periodo || !/^20\d{4}$/.test(data.periodo)) {
    warnings.push({
      code: 'INVALID_PERIOD',
      field: 'periodo',
      message: 'Período no detectado o formato incorrecto',
      impact: 'low'
    });
    confidence -= 5;
  }
  
  // VALIDACIÓN 6: Cálculos derivados
  if (data.comprasNetas && data.codigo538) {
    const expectedCompras = Math.round(data.codigo538 / 0.19);
    const comprasError = Math.abs(data.comprasNetas - expectedCompras);
    
    if (comprasError > 1000) {
      errors.push({
        code: 'INCORRECT_CALCULATION',
        field: 'comprasNetas',
        message: `Cálculo de compras netas incorrecto: ${data.comprasNetas.toLocaleString('es-CL')} vs esperado ${expectedCompras.toLocaleString('es-CL')}`,
        severity: 'medium',
        suggestedFix: expectedCompras
      });
      confidence -= 10;
    }
  }
  
  // GENERAR SUGERENCIAS
  if (errors.length === 0 && warnings.length === 0) {
    suggestions.push('✅ Formulario F29 validado correctamente');
    suggestions.push('📊 Todos los cálculos son coherentes');
    suggestions.push('🎯 Listo para presentación al SII');
  } else {
    if (errors.length > 0) {
      suggestions.push(`⚠️ Corregir ${errors.length} error(es) crítico(s) antes de presentar`);
    }
    if (warnings.length > 0) {
      suggestions.push(`📋 Revisar ${warnings.length} advertencia(s) detectada(s)`);
    }
    suggestions.push('🔍 Verificar datos originales en formulario físico');
    suggestions.push('📞 Consultar con contador si hay dudas');
  }
  
  // DETERMINAR VALIDEZ GENERAL
  const isValid = errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0;
  const finalConfidence = Math.max(0, Math.min(100, confidence));
  
  // GENERAR RESUMEN
  const summary = generateSummary(isValid, finalConfidence, errors.length, warnings.length);
  
  console.log(`🎯 VALIDACIÓN COMPLETADA: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'} (${finalConfidence}% confianza)`);
  
  return {
    isValid,
    confidence: finalConfidence,
    errors,
    warnings,
    suggestions,
    summary
  };
}

// Generar resumen de validación
function generateSummary(isValid: boolean, confidence: number, errorCount: number, warningCount: number): string {
  if (isValid && confidence >= 90) {
    return `✅ F29 VÁLIDO - Alta confianza (${confidence}%). Listo para presentación.`;
  } else if (isValid && confidence >= 70) {
    return `⚠️ F29 VÁLIDO - Confianza media (${confidence}%). Revisar advertencias.`;
  } else if (isValid) {
    return `🔍 F29 VÁLIDO - Baja confianza (${confidence}%). Verificar datos manualmente.`;
  } else if (errorCount <= 2) {
    return `❌ F29 INVÁLIDO - Errores menores (${errorCount}). Correcciones necesarias.`;
  } else {
    return `🚨 F29 INVÁLIDO - Múltiples errores (${errorCount}). Revisión completa requerida.`;
  }
}

// Validador rápido para uso en tiempo real
export function quickValidateF29(data: Partial<F29SuperData>): boolean {
  return (
    (data.codigo538 && data.codigo538 > 0) &&
    (data.codigo511 && data.codigo511 >= 0) &&
    (data.codigo563 && data.codigo563 > 0) &&
    (!data.rut || data.rut.length >= 8)
  );
}

// Corrector automático de errores comunes
export function autoCorrectF29(data: Partial<F29SuperData>): Partial<F29SuperData> {
  const corrected = { ...data };
  
  // Corregir cálculos derivados
  if (corrected.codigo538 && corrected.codigo538 > 0) {
    corrected.comprasNetas = Math.round(corrected.codigo538 / 0.19);
  }
  
  if (corrected.codigo538 && corrected.codigo511) {
    corrected.ivaPagar = corrected.codigo538 - corrected.codigo511;
  }
  
  if (corrected.ivaPagar !== undefined) {
    corrected.totalAPagar = corrected.ivaPagar + (corrected.codigo062 || 0) + (corrected.codigo077 || 0);
  }
  
  return corrected;
}