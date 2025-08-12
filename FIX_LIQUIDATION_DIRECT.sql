-- =====================================================
-- CORRECCIÓN DIRECTA DE LIQUIDACIÓN ESPECÍFICA
-- =====================================================
-- ID: a2ce069b-fb18-409f-9a90-1c78eba1ba51
-- =====================================================

-- PASO 1: Ver valores actuales INCORRECTOS
SELECT 
    'ANTES DE CORREGIR' as estado,
    total_taxable_income as "Total Imponible (INCORRECTO)",
    total_gross_income as "Total Haberes (INCORRECTO)",
    base_salary as "Sueldo Base",
    bonuses as "Bonos", 
    legal_gratification_art50 as "Gratificación Art 50",
    food_allowance as "Colación"
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- PASO 2: ACTUALIZACIÓN DIRECTA CON VALORES CORRECTOS
UPDATE payroll_liquidations
SET 
    -- Total Imponible CORRECTO = 529000 + 10000 + 134750 = 673750
    total_taxable_income = 673750,
    
    -- Total No Imponible = 1000 (solo colación)
    total_non_taxable_income = 1000,
    
    -- Total Haberes CORRECTO = 673750 + 1000 = 674750
    total_gross_income = 674750,
    
    -- Recalcular líquido (674750 - descuentos actuales)
    net_salary = 674750 - total_deductions,
    
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- PASO 3: Verificar valores CORREGIDOS
SELECT 
    'DESPUÉS DE CORREGIR' as estado,
    total_taxable_income as "Total Imponible (DEBE SER 673750)",
    total_gross_income as "Total Haberes (DEBE SER 674750)",
    total_non_taxable_income as "Total No Imponible (DEBE SER 1000)",
    net_salary as "Líquido a Pagar",
    base_salary as "Sueldo Base",
    bonuses as "Bonos",
    legal_gratification_art50 as "Gratificación Art 50",
    food_allowance as "Colación"
FROM payroll_liquidations  
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Total Imponible: $673.750
-- Total No Imponible: $1.000  
-- Total Haberes: $674.750
-- =====================================================