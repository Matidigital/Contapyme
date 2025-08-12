-- =====================================================
-- FIX PARA CORREGIR CÁLCULOS DE LIQUIDACIÓN ESPECÍFICA
-- =====================================================
-- Problema: Los totales de haberes imponibles no están incluyendo correctamente
-- la gratificación Art. 50 en la suma total
-- 
-- Liquidación ID: a2ce069b-fb18-409f-9a90-1c78eba1ba51
-- =====================================================

-- 1. Verificar los valores actuales de la liquidación problemática
SELECT 
    id,
    base_salary,
    bonuses,
    legal_gratification_art50,
    total_taxable_income,
    total_non_taxable_income,
    total_gross_income,
    food_allowance,
    -- Cálculo correcto de haberes imponibles
    (base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50) as calculated_taxable_income,
    -- Cálculo correcto de haberes no imponibles  
    (food_allowance + transport_allowance + family_allowance) as calculated_non_taxable_income,
    -- Cálculo correcto del total de haberes
    (base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50 + 
     food_allowance + transport_allowance + family_allowance) as calculated_gross_income
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 2. Actualizar la liquidación con los cálculos correctos
UPDATE payroll_liquidations
SET 
    -- Corregir total de haberes imponibles (debe incluir gratificación Art. 50)
    total_taxable_income = base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50,
    
    -- Corregir total de haberes no imponibles
    total_non_taxable_income = food_allowance + transport_allowance + family_allowance,
    
    -- Corregir total de haberes (suma de imponibles + no imponibles)
    total_gross_income = (base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50) + 
                        (food_allowance + transport_allowance + family_allowance),
    
    -- Recalcular líquido a pagar
    net_salary = ((base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50) + 
                  (food_allowance + transport_allowance + family_allowance)) - total_deductions,
    
    updated_at = NOW()
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 3. Verificar que la corrección se aplicó correctamente
SELECT 
    id,
    '=== HABERES IMPONIBLES ===' as seccion,
    base_salary as "Sueldo Base",
    bonuses as "Bonos",
    legal_gratification_art50 as "Gratificación Art. 50",
    total_taxable_income as "Total Imponible",
    '=== HABERES NO IMPONIBLES ===' as seccion2,
    food_allowance as "Colación",
    total_non_taxable_income as "Total No Imponible",
    '=== TOTALES ===' as seccion3,
    total_gross_income as "Total Haberes",
    total_deductions as "Total Descuentos",
    net_salary as "Líquido a Pagar"
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 4. OPCIONAL: Corregir TODAS las liquidaciones que tengan gratificación Art. 50
-- y que no estén sumando correctamente
UPDATE payroll_liquidations
SET 
    total_taxable_income = base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50,
    total_non_taxable_income = food_allowance + transport_allowance + family_allowance,
    total_gross_income = (base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50) + 
                        (food_allowance + transport_allowance + family_allowance),
    net_salary = ((base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50) + 
                  (food_allowance + transport_allowance + family_allowance)) - total_deductions,
    updated_at = NOW()
WHERE legal_gratification_art50 > 0
  AND total_taxable_income != (base_salary + overtime_amount + bonuses + commissions + gratification + legal_gratification_art50);

-- 5. Mostrar resumen de liquidaciones corregidas
SELECT 
    COUNT(*) as liquidaciones_corregidas,
    SUM(legal_gratification_art50) as total_gratificaciones_art50
FROM payroll_liquidations
WHERE legal_gratification_art50 > 0
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Haberes Imponibles: $673.750 (529.000 + 10.000 + 134.750)
-- Haberes No Imponibles: $1.000
-- Total Haberes: $674.750
-- =====================================================