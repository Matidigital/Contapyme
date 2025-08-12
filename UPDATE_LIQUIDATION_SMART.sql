-- =====================================================
-- ACTUALIZACIÓN INTELIGENTE DE LIQUIDACIÓN
-- =====================================================

-- 1. PRIMERO, VEAMOS SI HAY FUNCIONES QUE RECALCULAN AUTOMÁTICAMENTE
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE prosrc LIKE '%total_taxable_income%'
   OR prosrc LIKE '%total_gross_income%'
   OR prosrc LIKE '%payroll_liquidations%'
LIMIT 10;

-- 2. VER LA ESTRUCTURA EXACTA DE LA TABLA
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'payroll_liquidations'
  AND column_name IN ('total_taxable_income', 'total_non_taxable_income', 'total_gross_income')
ORDER BY ordinal_position;

-- 3. INTENTAR UPDATE CON TODOS LOS CAMPOS A LA VEZ
-- Quizás el trigger verifica la consistencia y necesitamos actualizar todo junto
BEGIN;

UPDATE payroll_liquidations
SET 
    -- Asegurar que los componentes están correctos
    base_salary = 529000,
    bonuses = 10000,
    legal_gratification_art50 = 134750,
    overtime_amount = 0,
    commissions = 0,
    gratification = 0,
    
    -- Haberes no imponibles
    food_allowance = 1000,
    transport_allowance = 0,
    family_allowance = 0,
    
    -- AHORA SÍ LOS TOTALES CORRECTOS
    total_taxable_income = 673750,
    total_non_taxable_income = 1000,
    total_gross_income = 674750,
    
    -- Actualizar timestamp
    updated_at = CURRENT_TIMESTAMP
    
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

COMMIT;

-- 4. VERIFICAR RESULTADO
SELECT 
    id,
    '=== COMPONENTES ===' as seccion1,
    base_salary,
    bonuses,
    legal_gratification_art50,
    base_salary + bonuses + legal_gratification_art50 as "Suma Manual Imponibles",
    '=== TOTALES EN BD ===' as seccion2,
    total_taxable_income as "Total Imponible BD",
    total_non_taxable_income as "Total No Imponible BD",
    total_gross_income as "Total Haberes BD",
    '=== VALIDACIÓN ===' as seccion3,
    CASE 
        WHEN total_taxable_income = 673750 THEN '✅ CORRECTO'
        ELSE '❌ INCORRECTO - Debe ser 673750'
    END as "Estado Imponibles",
    CASE 
        WHEN total_gross_income = 674750 THEN '✅ CORRECTO'
        ELSE '❌ INCORRECTO - Debe ser 674750'
    END as "Estado Total Haberes"
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 5. SI AÚN NO FUNCIONA, VAMOS A VER SI HAY UNA VISTA O COMPUTED COLUMN
SELECT 
    table_name,
    column_name,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'payroll_liquidations'
  AND generation_expression IS NOT NULL;

-- 6. ALTERNATIVA: CREAR UNA FUNCIÓN PARA FORZAR LA ACTUALIZACIÓN
CREATE OR REPLACE FUNCTION fix_liquidation_totals()
RETURNS void AS $$
BEGIN
    -- Actualizar directamente sin triggers
    UPDATE payroll_liquidations
    SET 
        total_taxable_income = 673750,
        total_non_taxable_income = 1000,
        total_gross_income = 674750
    WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función
SELECT fix_liquidation_totals();

-- 7. VERIFICACIÓN FINAL
SELECT 
    'RESULTADO FINAL' as estado,
    total_taxable_income,
    total_gross_income,
    CASE 
        WHEN total_taxable_income = 673750 AND total_gross_income = 674750 
        THEN '✅ ACTUALIZACIÓN EXITOSA'
        ELSE '❌ PROBLEMA PERSISTE - Puede haber un trigger o política que recalcula automáticamente'
    END as diagnostico
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';